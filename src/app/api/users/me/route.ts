import { NextRequest, NextResponse } from 'next/server';

import { requireUserId } from '@/lib/auth';
import { handleRouteError, jsonError } from '@/lib/http';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type PatchBody = {
  avatar?: string | null;
};

function normalizeAvatar(value: unknown): string | null {
  if (value === null) return null;
  const str = String(value ?? '').trim();
  if (!str) return null;
  return str;
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = requireUserId(request);
    if ('response' in auth) {
      return auth.response;
    }

    const body = (await request.json()) as PatchBody;
    const avatar = normalizeAvatar(body.avatar);

    const updated = await prisma.user.update({
      where: { id: auth.userId },
      data: { avatar },
    });

    return NextResponse.json({
      user: {
        id: updated.id,
        email: updated.email,
        username: updated.username,
        name: updated.username,
        avatar: updated.avatar,
        role: updated.role,
      },
    });
  } catch (error) {
    // Prisma not found
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return jsonError(404, 'User not found');
    }
    return handleRouteError(error, 'Update profile failed');
  }
}

