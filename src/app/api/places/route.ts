import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/auth';
import { handleRouteError, jsonError } from '@/lib/http';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type UpsertPlaceBody = {
  title?: string;
  titleVi?: string;
  location?: string;
  locationVi?: string;
  description?: string;
  descriptionVi?: string;
  imagePath?: string;
  googleMapsLink?: string;
  openingHours?: string;
  phone?: string;
  latitude?: number | string;
  longitude?: number | string;
  indoorSuitable?: boolean | string;
  designerTip?: string;
  categoryId?: number | string;
  categoryName?: string;
};

function parseOptionalNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : null;
}

function parseOptionalBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }

  return false;
}

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

export async function POST(request: NextRequest) {
  try {
    const auth = requireAdmin(request);
    if ('response' in auth) {
      return auth.response;
    }

    const body = (await request.json()) as UpsertPlaceBody;
    const title = body.title?.trim();
    const location = body.location?.trim();
    const description = body.description?.trim();
    const imagePath = body.imagePath?.trim();
    const categoryName = body.categoryName?.trim();
    const categoryId = Number.parseInt(String(body.categoryId ?? ''), 10);

    if (!title || !location || !description || !imagePath) {
      return jsonError(400, 'title, location, description, and imagePath are required');
    }

    let resolvedCategoryId: number | null = null;

    if (Number.isFinite(categoryId)) {
      const category = await prisma.category.findUnique({ where: { id: categoryId } });
      resolvedCategoryId = category?.id ?? null;
    } else if (categoryName) {
      const category = await prisma.category.findUnique({ where: { name: categoryName } });
      resolvedCategoryId = category?.id ?? null;
    }

    if (!resolvedCategoryId) {
      return jsonError(400, 'A valid categoryId or categoryName is required');
    }

    const latitude = parseOptionalNumber(body.latitude);
    const longitude = parseOptionalNumber(body.longitude);

    const createdPlace = await prisma.place.create({
      data: {
        title,
        titleVi: body.titleVi?.trim() || null,
        location,
        locationVi: body.locationVi?.trim() || null,
        description,
        descriptionVi: body.descriptionVi?.trim() || null,
        imagePath,
        googleMapsLink: body.googleMapsLink?.trim() || null,
        openingHours: body.openingHours?.trim() || null,
        phone: body.phone?.trim() || null,
        latitude,
        longitude,
        indoorSuitable: parseOptionalBoolean(body.indoorSuitable),
        designerTip: body.designerTip?.trim() || null,
        categoryId: resolvedCategoryId,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(createdPlace, { status: 201 });
  } catch (error) {
    return handleRouteError(error, 'Failed to create place');
  }
}
