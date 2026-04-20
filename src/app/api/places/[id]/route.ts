import { NextRequest, NextResponse } from 'next/server';

import { handleRouteError, jsonError } from '@/lib/http';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const placeId = Number.parseInt(id, 10);

    if (!Number.isFinite(placeId)) {
      return jsonError(400, 'Invalid place id');
    }

    const place = await prisma.place.findUnique({
      where: { id: placeId },
      include: {
        category: true,
        reviews: {
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
          take: 10,
        },
      },
    });

    if (!place) {
      return jsonError(404, 'Place not found');
    }

    return NextResponse.json(place);
  } catch (error) {
    return handleRouteError(error, 'Failed to fetch place');
  }
}
