import { NextResponse } from 'next/server';

import { handleRouteError, jsonError } from '@/lib/http';

export const dynamic = 'force-dynamic';

const DALAT_LAT = 11.94;
const DALAT_LON = 108.43;

export async function GET() {
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      return jsonError(500, 'Weather API not configured');
    }

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${DALAT_LAT}&lon=${DALAT_LON}&units=metric&lang=en&appid=${apiKey}`,
      { cache: 'no-store' },
    );

    if (!response.ok) {
      throw new Error('Weather API error');
    }

    const data = (await response.json()) as {
      main: { temp: number; feels_like: number; humidity: number };
      wind: { speed: number };
      weather: Array<{ description: string; id: number; icon: string }>;
      name: string;
      sys: { country: string };
    };

    return NextResponse.json({
      temp: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      description: data.weather[0]?.description,
      weatherId: data.weather[0]?.id,
      icon: data.weather[0]?.icon,
      city: data.name,
      country: data.sys.country,
    });
  } catch (error) {
    return handleRouteError(error, 'Failed to fetch weather data');
  }
}
