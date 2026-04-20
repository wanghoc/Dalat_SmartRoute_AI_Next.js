import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

import { signToken } from '@/lib/auth';
import { handleRouteError, jsonError } from '@/lib/http';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type RegisterBody = {
  email?: string;
  username?: string;
  password?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RegisterBody;
    const email = body.email?.trim();
    const username = body.username?.trim();
    const password = body.password ?? '';

    if (!email || !username || !password) {
      return jsonError(400, 'All fields are required');
    }

    if (password.length < 6) {
      return jsonError(400, 'Password must be at least 6 characters');
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return jsonError(
        400,
        existingUser.email === email
          ? 'Email already registered'
          : 'Username already taken',
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        avatar: `https://i.pravatar.cc/150?u=${username}`,
      },
    });

    const token = signToken({ userId: user.id });

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          avatar: user.avatar,
        },
        token,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleRouteError(error, 'Registration failed');
  }
}
