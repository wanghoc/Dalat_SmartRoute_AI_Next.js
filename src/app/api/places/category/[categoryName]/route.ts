import { NextRequest, NextResponse } from 'next/server';

import { handleRouteError } from '@/lib/http';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ categoryName: string }> },
) {
  try {
    const { categoryName } = await context.params;

    const places = await prisma.place.findMany({
      where: {
        category: {
          name: categoryName,
        },
      },
      include: { category: true },
      orderBy: { rating: 'desc' },
    });

    return NextResponse.json(places);
  } catch (error) {
    return handleRouteError(error, 'Failed to fetch places');
  }
}
