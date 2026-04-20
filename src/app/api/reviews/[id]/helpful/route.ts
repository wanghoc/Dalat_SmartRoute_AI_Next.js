import { NextRequest, NextResponse } from 'next/server';

import { handleRouteError, jsonError } from '@/lib/http';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const reviewId = Number.parseInt(id, 10);

    if (!Number.isFinite(reviewId)) {
      return jsonError(400, 'Invalid review id');
    }

    const review = await prisma.review.update({
      where: { id: reviewId },
      data: {
        helpful: {
          increment: 1,
        },
      },
      select: {
        helpful: true,
      },
    });

    return NextResponse.json({ helpful: review.helpful });
  } catch (error) {
    return handleRouteError(error, 'Failed to update');
  }
}
