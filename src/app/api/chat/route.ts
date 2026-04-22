import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

import { requireUserId } from '@/lib/auth';
import dalatData from '@/lib/data.json';
import { handleRouteError, jsonError } from '@/lib/http';

export const dynamic = 'force-dynamic';

const DALAT_LAT = 11.94;
const DALAT_LON = 108.43;

type ChatBody = {
  message?: string;
  language?: string;
  history?: Array<{ type?: string; text?: string }>;
};

type WeatherSummary = {
  current?: {
    temp: number;
    description: string;
    weatherId: number;
  };
  tomorrow?: {
    date: string;
    tempAvg: number;
    tempMin: number;
    tempMax: number;
    weatherDescription: string;
    willRain: boolean;
    rainChancePct: number;
  };
};

async function getWeatherSummary(apiKey: string): Promise<WeatherSummary | null> {
  const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${DALAT_LAT}&lon=${DALAT_LON}&units=metric&lang=vi&appid=${apiKey}`;
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${DALAT_LAT}&lon=${DALAT_LON}&units=metric&lang=vi&appid=${apiKey}`;

  const [currentResponse, forecastResponse] = await Promise.all([
    fetch(weatherUrl, { cache: 'no-store' }),
    fetch(forecastUrl, { cache: 'no-store' }),
  ]);

  if (!currentResponse.ok || !forecastResponse.ok) {
    return null;
  }

  const currentData = (await currentResponse.json()) as {
    main?: { temp?: number };
    weather?: Array<{ description?: string; id?: number }>;
  };

  const forecastData = (await forecastResponse.json()) as {
    list?: Array<{
      dt_txt?: string;
      main?: { temp?: number; temp_min?: number; temp_max?: number };
      weather?: Array<{ id?: number; description?: string }>;
    }>;
  };

  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const list = forecastData.list ?? [];

  const groupedByDate = new Map<string, typeof list>();
  for (const item of list) {
    const date = item.dt_txt?.split(' ')[0];
    if (!date) continue;
    if (!groupedByDate.has(date)) {
      groupedByDate.set(date, []);
    }
    groupedByDate.get(date)?.push(item);
  }

  const candidateTomorrow = [...groupedByDate.keys()]
    .filter((date) => date > today)
    .sort()[0];

  let tomorrowSummary: WeatherSummary['tomorrow'];
  if (candidateTomorrow) {
    const tomorrowSlots = groupedByDate.get(candidateTomorrow) ?? [];
    const temps = tomorrowSlots
      .map((slot) => slot.main?.temp)
      .filter((value): value is number => Number.isFinite(value));
    const tempMins = tomorrowSlots
      .map((slot) => slot.main?.temp_min)
      .filter((value): value is number => Number.isFinite(value));
    const tempMaxs = tomorrowSlots
      .map((slot) => slot.main?.temp_max)
      .filter((value): value is number => Number.isFinite(value));

    const rainySlots = tomorrowSlots.filter((slot) => {
      const id = slot.weather?.[0]?.id;
      return Number.isFinite(id) && Number(id) < 700;
    }).length;

    const noonLikeSlot =
      tomorrowSlots.find((slot) => slot.dt_txt?.includes('12:00:00')) ??
      tomorrowSlots[Math.floor(tomorrowSlots.length / 2)];

    const description =
      noonLikeSlot?.weather?.[0]?.description ??
      (rainySlots > 0 ? 'co mua' : 'it mua');

    tomorrowSummary = {
      date: candidateTomorrow,
      tempAvg: temps.length
        ? Math.round(temps.reduce((sum, t) => sum + t, 0) / temps.length)
        : 0,
      tempMin: tempMins.length ? Math.round(Math.min(...tempMins)) : 0,
      tempMax: tempMaxs.length ? Math.round(Math.max(...tempMaxs)) : 0,
      weatherDescription: description,
      willRain: rainySlots > 0,
      rainChancePct: tomorrowSlots.length
        ? Math.round((rainySlots / tomorrowSlots.length) * 100)
        : 0,
    };
  }

  return {
    current: {
      temp: Math.round(currentData.main?.temp ?? 0),
      description: currentData.weather?.[0]?.description ?? 'khong ro',
      weatherId: Number(currentData.weather?.[0]?.id ?? 0),
    },
    tomorrow: tomorrowSummary,
  };
}

export async function POST(request: NextRequest) {
  try {
    const auth = requireUserId(request);
    if ('response' in auth) {
      return auth.response;
    }

    const body = (await request.json()) as ChatBody;
    const message = body.message?.trim();
    const language = body.language ?? 'vi';

    if (!message) {
      return jsonError(400, 'Message is required');
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return jsonError(500, 'No API Key found');
    }

    const modelName = process.env.GEMINI_MODEL || 'gemini-flash-latest';
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    const weatherApiKey = process.env.OPENWEATHER_API_KEY;
    let weatherSummary: WeatherSummary | null = null;
    if (weatherApiKey) {
      try {
        weatherSummary = await getWeatherSummary(weatherApiKey);
      } catch {
        weatherSummary = null;
      }
    }

    const langInstructions =
      language === 'vi'
        ? 'Tra loi ngan gon bang tieng Viet, dung Markdown de dinh dang de doc, xuong dong giua cac y, va in dam cac dia diem quan trong:'
        : 'Answer briefly in English using Markdown formatting, break ideas into separate lines, and bold key place names:';

    const roleDescription =
      language === 'vi'
        ? 'Ban la huong dan vien du lich Da Lat than thien va nhiet tinh.'
        : 'You are a friendly and enthusiastic Dalat travel guide.';

    const weatherContext = weatherSummary
      ? JSON.stringify(weatherSummary)
      : language === 'vi'
        ? 'Khong lay duoc du lieu thoi tiet OpenWeather luc nay.'
        : 'OpenWeather data is currently unavailable.';

    const historyContext = (body.history ?? [])
      .slice(-6)
      .map((item) => `${item.type === 'user' ? 'User' : 'Assistant'}: ${item.text ?? ''}`)
      .join('\n');

    const prompt = `
${roleDescription} Hay tra loi cau hoi dua tren du lieu sau:
${JSON.stringify(dalatData)}

Du lieu thoi tiet OpenWeather (uu tien dung cho cac cau hoi thoi tiet, dac biet la ngay mai):
${weatherContext}

Hoi thoai gan day:
${historyContext || '(khong co)'}

Cau hoi: ${message}
${langInstructions}
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return NextResponse.json({ response: text, success: true });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('404') || error.message.includes('not found'))
    ) {
      return NextResponse.json(
        {
          error: 'Model Not Found',
          message:
            'Ten model trong code khong khop voi API key. Hay kiem tra GEMINI_MODEL.',
          details: error.message,
        },
        { status: 404 },
      );
    }

    return handleRouteError(error, 'AI Error');
  }
}
