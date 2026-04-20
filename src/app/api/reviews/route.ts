import { NextRequest, NextResponse } from 'next/server';

import { requireUserId } from '@/lib/auth';
import { handleRouteError, jsonError } from '@/lib/http';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type CreateReviewBody = {
  title?: string;
  content?: string;
  rating?: number;
  placeId?: number;
  language?: string;
  tags?: string[];
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number.parseInt(searchParams.get('limit') ?? '50', 10);
    const offset = Number.parseInt(searchParams.get('offset') ?? '0', 10);
    const language = searchParams.get('language');

    const where = language ? { language } : {};

    const reviews = await prisma.review.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        place: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: Number.isFinite(limit) ? limit : 50,
      skip: Number.isFinite(offset) ? offset : 0,
    });

    const total = await prisma.review.count({ where });

    return NextResponse.json({ reviews, total });
  } catch (error) {
    return handleRouteError(error, 'Failed to fetch reviews');
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = requireUserId(request);
    if ('response' in auth) {
      return auth.response;
    }

    const body = (await request.json()) as CreateReviewBody;
    const content = body.content?.trim();
    const rating = Number.parseInt(String(body.rating ?? ''), 10);
    const placeId = Number.parseInt(String(body.placeId ?? ''), 10);
    const language = body.language ?? 'en';
    const tags = Array.isArray(body.tags) ? body.tags : [];

    if (!content || !Number.isFinite(rating) || !Number.isFinite(placeId)) {
      return jsonError(400, 'Content, rating, and placeId are required');
    }

    if (rating < 1 || rating > 5) {
      return jsonError(400, 'Rating must be between 1 and 5');
    }

    const place = await prisma.place.findUnique({ where: { id: placeId } });
    if (!place) {
      return jsonError(404, 'Place not found');
    }

    const review = await prisma.review.create({
      data: {
        title: body.title,
        content,
        rating,
        language,
        tags: JSON.stringify(tags),
        userId: auth.userId,
        placeId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    const allReviews = await prisma.review.findMany({
      where: { placeId },
      select: { rating: true },
    });

    const totalRating = allReviews.reduce(
      (sum: number, item: { rating: number }) => sum + item.rating,
      0,
    );
    const avgRating = totalRating / allReviews.length;

    await prisma.place.update({
      where: { id: placeId },
      data: {
        rating: Math.round(avgRating * 10) / 10,
        reviewCount: allReviews.length,
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    return handleRouteError(error, 'Failed to create review');
  }
}
