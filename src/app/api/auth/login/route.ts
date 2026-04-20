import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

import { signToken } from '@/lib/auth';
import { handleRouteError, jsonError } from '@/lib/http';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type LoginBody = {
  email?: string;
  password?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as LoginBody;
    const email = body.email?.trim();
    const password = body.password ?? '';

    if (!email || !password) {
      return jsonError(400, 'Email and password are required');
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return jsonError(401, 'Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return jsonError(401, 'Invalid credentials');
    }

    const token = signToken({ userId: user.id });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
      },
      token,
    });
  } catch (error) {
    return handleRouteError(error, 'Login failed');
  }
}
