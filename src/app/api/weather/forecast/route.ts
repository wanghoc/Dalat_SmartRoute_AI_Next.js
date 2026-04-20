import { NextResponse } from 'next/server';

import { handleRouteError, jsonError } from '@/lib/http';

export const dynamic = 'force-dynamic';

const DALAT_LAT = 11.94;
const DALAT_LON = 108.43;

type ForecastItem = {
  dt_txt: string;
  main: {
    temp: number;
    temp_min: number;
    temp_max: number;
    humidity: number;
  };
  weather: Array<{
    description: string;
    id: number;
    icon: string;
  }>;
};

export async function GET() {
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      return jsonError(500, 'Weather API not configured');
    }

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${DALAT_LAT}&lon=${DALAT_LON}&units=metric&lang=en&appid=${apiKey}`,
      { cache: 'no-store' },
    );

    if (!response.ok) {
      throw new Error('Weather API error');
    }

    const data = (await response.json()) as {
      list: ForecastItem[];
    };

    const dailyForecasts: Array<{
      date: string;
      temp: number;
      tempMin: number;
      tempMax: number;
      humidity: number;
      description: string;
      weatherId: number;
      icon: string;
    }> = [];

    const seenDates = new Set<string>();

    for (const item of data.list) {
      const date = item.dt_txt.split(' ')[0];
      if (!seenDates.has(date) && item.dt_txt.includes('12:00:00')) {
        seenDates.add(date);
        dailyForecasts.push({
          date,
          temp: Math.round(item.main.temp),
          tempMin: Math.round(item.main.temp_min),
          tempMax: Math.round(item.main.temp_max),
          humidity: item.main.humidity,
          description: item.weather[0]?.description,
          weatherId: item.weather[0]?.id,
          icon: item.weather[0]?.icon,
        });
      }
    }

    return NextResponse.json({
      forecasts: dailyForecasts.slice(0, 5),
    });
  } catch (error) {
    return handleRouteError(error, 'Failed to fetch forecast data');
  }
}
