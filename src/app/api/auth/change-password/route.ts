import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

import { requireUserId } from '@/lib/auth';
import { handleRouteError, jsonError } from '@/lib/http';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type Body = {
  currentPassword?: string;
  newPassword?: string;
};

export async function POST(request: NextRequest) {
  try {
    const auth = requireUserId(request);
    if ('response' in auth) {
      return auth.response;
    }

    const body = (await request.json()) as Body;
    const currentPassword = body.currentPassword ?? '';
    const newPassword = body.newPassword ?? '';

    if (!currentPassword || !newPassword) {
      return jsonError(400, 'currentPassword and newPassword are required');
    }

    if (newPassword.length < 6) {
      return jsonError(400, 'Password must be at least 6 characters');
    }

    const user = await prisma.user.findUnique({ where: { id: auth.userId } });
    if (!user) {
      return jsonError(404, 'User not found');
    }

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) {
      return jsonError(401, 'Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError(error, 'Change password failed');
  }
}

