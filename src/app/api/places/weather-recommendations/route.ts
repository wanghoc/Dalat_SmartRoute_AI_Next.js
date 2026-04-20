import { NextRequest, NextResponse } from 'next/server';

import { handleRouteError } from '@/lib/http';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const weatherId = Number.parseInt(searchParams.get('weatherId') ?? '800', 10);
    const limit = Number.parseInt(searchParams.get('limit') ?? '6', 10);

    const weatherCode = Number.isFinite(weatherId) ? weatherId : 800;
    const isRainy = weatherCode >= 200 && weatherCode < 700;

    const places = await prisma.place.findMany({
      where: {
        indoorSuitable: isRainy,
      },
      include: { category: true },
      take: Number.isFinite(limit) ? limit : 6,
      orderBy: { rating: 'desc' },
    });

    return NextResponse.json({
      weatherCondition: isRainy ? 'rainy' : 'clear',
      isIndoor: isRainy,
      places,
    });
  } catch (error) {
    return handleRouteError(error, 'Failed to fetch weather recommendations');
  }
}
