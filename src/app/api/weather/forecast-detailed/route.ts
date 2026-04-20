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
      `https://api.openweathermap.org/data/2.5/forecast?lat=${DALAT_LAT}&lon=${DALAT_LON}&units=metric&lang=en&appid=${apiKey}`,
      { cache: 'no-store' },
    );

    if (!response.ok) {
      throw new Error('Weather API error');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return handleRouteError(error, 'Failed to fetch detailed forecast data');
  }
}
