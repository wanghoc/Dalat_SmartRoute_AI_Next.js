import { NextRequest, NextResponse } from 'next/server';

import { handleRouteError, jsonError } from '@/lib/http';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ placeId: string }> },
) {
  try {
    const { placeId: placeIdRaw } = await context.params;
    const placeId = Number.parseInt(placeIdRaw, 10);

    if (!Number.isFinite(placeId)) {
      return jsonError(400, 'Invalid placeId');
    }

    const { searchParams } = new URL(request.url);
    const limit = Number.parseInt(searchParams.get('limit') ?? '20', 10);
    const offset = Number.parseInt(searchParams.get('offset') ?? '0', 10);

    const reviews = await prisma.review.findMany({
      where: { placeId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: Number.isFinite(limit) ? limit : 20,
      skip: Number.isFinite(offset) ? offset : 0,
    });

    const total = await prisma.review.count({
      where: { placeId },
    });

    return NextResponse.json({ reviews, total });
  } catch (error) {
    return handleRouteError(error, 'Failed to fetch reviews');
  }
}
