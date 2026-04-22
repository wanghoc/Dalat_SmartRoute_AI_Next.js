import { NextResponse } from 'next/server';

import { requireUserId } from '@/lib/auth';
import { handleRouteError, jsonError } from '@/lib/http';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const auth = requireUserId(request);
    if ('response' in auth) {
      return auth.response;
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
    });

    if (!user) {
      return jsonError(404, 'User not found');
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.username,
      avatar: user.avatar,
      role: user.role,
    });
  } catch (error) {
    return handleRouteError(error, 'Authentication failed');
  }
}
