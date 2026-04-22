import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/auth';
import { handleRouteError, jsonError } from '@/lib/http';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type PatchBody = {
  email?: string;
  role?: 'ADMIN' | 'VISITOR';
  username?: string;
  avatar?: string | null;
  newPassword?: string;
};

function parseUserId(request: NextRequest): number {
  const parts = request.nextUrl.pathname.split('/');
  const idStr = parts[parts.length - 1] || '';
  return Number.parseInt(idStr, 10);
}

function normalizeOptionalString(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  const trimmed = String(value ?? '').trim();
  return trimmed || undefined;
}

function normalizeOptionalAvatar(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = String(value ?? '').trim();
  return trimmed || null;
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = requireAdmin(request);
    if ('response' in auth) {
      return auth.response;
    }

    const userId = parseUserId(request);
    if (!Number.isFinite(userId)) {
      return jsonError(400, 'Invalid user id');
    }

    const body = (await request.json()) as PatchBody;

    const email = normalizeOptionalString(body.email);
    const username = normalizeOptionalString(body.username);
    const role = body.role;
    const avatar = normalizeOptionalAvatar(body.avatar);
    const newPassword = normalizeOptionalString(body.newPassword);

    if (newPassword && newPassword.length < 6) {
      return jsonError(400, 'Password must be at least 6 characters');
    }

    const data: {
      email?: string;
      username?: string;
      role?: 'ADMIN' | 'VISITOR';
      avatar?: string | null;
      passwordHash?: string;
    } = {};

    if (email) data.email = email;
    if (username) data.username = username;
    if (role) data.role = role;
    if (avatar !== undefined) data.avatar = avatar;
    if (newPassword) data.passwordHash = await bcrypt.hash(newPassword, 10);

    if (Object.keys(data).length === 0) {
      return jsonError(400, 'No fields to update');
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    return handleRouteError(error, 'Failed to update user');
  }
}

