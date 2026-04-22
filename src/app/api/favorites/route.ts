import { NextRequest, NextResponse } from 'next/server';

import { requireUserId } from '@/lib/auth';
import { handleRouteError, jsonError } from '@/lib/http';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type FavoriteBody = {
  placeId?: number;
};

function parsePlaceId(value: unknown): number {
  return Number.parseInt(String(value ?? ''), 10);
}

export async function GET(request: NextRequest) {
  try {
    const auth = requireUserId(request);
    if ('response' in auth) {
      return auth.response;
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId: auth.userId },
      include: {
        place: {
          include: {
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ favorites });
  } catch (error) {
    return handleRouteError(error, 'Failed to fetch favorites');
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = requireUserId(request);
    if ('response' in auth) {
      return auth.response;
    }

    const body = (await request.json()) as FavoriteBody;
    const placeId = parsePlaceId(body.placeId);

    if (!Number.isFinite(placeId)) {
      return jsonError(400, 'placeId is required');
    }

    const place = await prisma.place.findUnique({ where: { id: placeId } });
    if (!place) {
      return jsonError(404, 'Place not found');
    }

    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_placeId: {
          userId: auth.userId,
          placeId,
        },
      },
      include: {
        place: {
          include: {
            category: true,
          },
        },
      },
    });

    if (existingFavorite) {
      return NextResponse.json(existingFavorite);
    }

    const favorite = await prisma.favorite.create({
      data: {
        userId: auth.userId,
        placeId,
      },
      include: {
        place: {
          include: {
            category: true,
          },
        },
      },
    });

    return NextResponse.json(favorite, { status: 201 });
  } catch (error) {
    return handleRouteError(error, 'Failed to save favorite');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = requireUserId(request);
    if ('response' in auth) {
      return auth.response;
    }

    let placeId = Number.NaN;
    const placeIdFromQuery = new URL(request.url).searchParams.get('placeId');
    if (placeIdFromQuery) {
      placeId = parsePlaceId(placeIdFromQuery);
    }

    if (!Number.isFinite(placeId)) {
      const body = (await request.json().catch(() => ({}))) as FavoriteBody;
      placeId = parsePlaceId(body.placeId);
    }

    if (!Number.isFinite(placeId)) {
      return jsonError(400, 'placeId is required');
    }

    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_placeId: {
          userId: auth.userId,
          placeId,
        },
      },
    });

    if (!favorite) {
      return jsonError(404, 'Favorite not found');
    }

    await prisma.favorite.delete({
      where: {
        userId_placeId: {
          userId: auth.userId,
          placeId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError(error, 'Failed to remove favorite');
  }
}
