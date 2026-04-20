import { NextRequest, NextResponse } from 'next/server';

import { handleRouteError } from '@/lib/http';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const limit = Number.parseInt(searchParams.get('limit') ?? '50', 10);

    const where: {
      category?: { name: string };
      OR?: Array<{
        title?: { contains: string };
        titleVi?: { contains: string };
        description?: { contains: string };
      }>;
    } = {};

    if (category) {
      where.category = { name: category };
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { titleVi: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const places = await prisma.place.findMany({
      where,
      include: { category: true },
      take: Number.isFinite(limit) ? limit : 50,
      orderBy: { rating: 'desc' },
    });

    return NextResponse.json(places);
  } catch (error) {
    return handleRouteError(error, 'Failed to fetch places');
  }
}
