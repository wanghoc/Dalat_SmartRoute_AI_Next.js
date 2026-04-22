import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/auth';
import { handleRouteError, jsonError } from '@/lib/http';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type UpdatePlaceBody = {
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

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const auth = requireAdmin(request);
    if ('response' in auth) {
      return auth.response;
    }

    const { id } = await context.params;
    const placeId = Number.parseInt(id, 10);

    if (!Number.isFinite(placeId)) {
      return jsonError(400, 'Invalid place id');
    }

    const existingPlace = await prisma.place.findUnique({ where: { id: placeId } });
    if (!existingPlace) {
      return jsonError(404, 'Place not found');
    }

    const body = (await request.json()) as UpdatePlaceBody;
    const data: Record<string, unknown> = {};

    if (body.title !== undefined) {
      const title = body.title.trim();
      if (!title) {
        return jsonError(400, 'title cannot be empty');
      }
      data.title = title;
    }

    if (body.location !== undefined) {
      const location = body.location.trim();
      if (!location) {
        return jsonError(400, 'location cannot be empty');
      }
      data.location = location;
    }

    if (body.description !== undefined) {
      const description = body.description.trim();
      if (!description) {
        return jsonError(400, 'description cannot be empty');
      }
      data.description = description;
    }

    if (body.imagePath !== undefined) {
      const imagePath = body.imagePath.trim();
      if (!imagePath) {
        return jsonError(400, 'imagePath cannot be empty');
      }
      data.imagePath = imagePath;
    }

    if (body.titleVi !== undefined) {
      data.titleVi = body.titleVi.trim() || null;
    }

    if (body.locationVi !== undefined) {
      data.locationVi = body.locationVi.trim() || null;
    }

    if (body.descriptionVi !== undefined) {
      data.descriptionVi = body.descriptionVi.trim() || null;
    }

    if (body.googleMapsLink !== undefined) {
      data.googleMapsLink = body.googleMapsLink.trim() || null;
    }

    if (body.openingHours !== undefined) {
      data.openingHours = body.openingHours.trim() || null;
    }

    if (body.phone !== undefined) {
      data.phone = body.phone.trim() || null;
    }

    if (body.designerTip !== undefined) {
      data.designerTip = body.designerTip.trim() || null;
    }

    if (body.latitude !== undefined) {
      data.latitude = parseOptionalNumber(body.latitude);
    }

    if (body.longitude !== undefined) {
      data.longitude = parseOptionalNumber(body.longitude);
    }

    if (body.indoorSuitable !== undefined) {
      data.indoorSuitable = parseOptionalBoolean(body.indoorSuitable);
    }

    if (body.categoryId !== undefined || body.categoryName !== undefined) {
      let resolvedCategoryId: number | null = null;
      const categoryId = Number.parseInt(String(body.categoryId ?? ''), 10);

      if (Number.isFinite(categoryId)) {
        const category = await prisma.category.findUnique({ where: { id: categoryId } });
        resolvedCategoryId = category?.id ?? null;
      } else if (body.categoryName?.trim()) {
        const category = await prisma.category.findUnique({
          where: { name: body.categoryName.trim() },
        });
        resolvedCategoryId = category?.id ?? null;
      }

      if (!resolvedCategoryId) {
        return jsonError(400, 'A valid categoryId or categoryName is required');
      }

      data.categoryId = resolvedCategoryId;
    }

    if (Object.keys(data).length === 0) {
      return jsonError(400, 'No fields to update');
    }

    const updatedPlace = await prisma.place.update({
      where: { id: placeId },
      data,
      include: {
        category: true,
      },
    });

    return NextResponse.json(updatedPlace);
  } catch (error) {
    return handleRouteError(error, 'Failed to update place');
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const auth = requireAdmin(request);
    if ('response' in auth) {
      return auth.response;
    }

    const { id } = await context.params;
    const placeId = Number.parseInt(id, 10);

    if (!Number.isFinite(placeId)) {
      return jsonError(400, 'Invalid place id');
    }

    const place = await prisma.place.findUnique({ where: { id: placeId } });
    if (!place) {
      return jsonError(404, 'Place not found');
    }

    await prisma.$transaction([
      prisma.favorite.deleteMany({ where: { placeId } }),
      prisma.review.deleteMany({ where: { placeId } }),
      prisma.place.delete({ where: { id: placeId } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError(error, 'Failed to delete place');
  }
}
