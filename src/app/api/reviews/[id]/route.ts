import { NextRequest, NextResponse } from 'next/server';

import { requireUserId } from '@/lib/auth';
import { handleRouteError, jsonError } from '@/lib/http';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const auth = requireUserId(request);
    if ('response' in auth) {
      return auth.response;
    }

    const { id } = await context.params;
    const reviewId = Number.parseInt(id, 10);

    if (!Number.isFinite(reviewId)) {
      return jsonError(400, 'Invalid review id');
    }

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: {
        id: true,
        userId: true,
        placeId: true,
      },
    });

    if (!review) {
      return jsonError(404, 'Review not found');
    }

    const isOwner = review.userId === auth.userId;
    const isAdmin = auth.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return jsonError(403, 'You can only delete your own reviews');
    }

    await prisma.review.delete({
      where: { id: reviewId },
    });

    const aggregate = await prisma.review.aggregate({
      where: { placeId: review.placeId },
      _avg: { rating: true },
      _count: { _all: true },
    });

    const reviewCount = aggregate._count._all;
    const avgRating = aggregate._avg.rating ?? 0;

    await prisma.place.update({
      where: { id: review.placeId },
      data: {
        reviewCount,
        rating: reviewCount > 0 ? Math.round(avgRating * 10) / 10 : 0,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError(error, 'Failed to delete review');
  }
}
