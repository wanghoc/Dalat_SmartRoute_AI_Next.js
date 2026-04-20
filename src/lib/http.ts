import { NextResponse } from 'next/server';

export function jsonError(status: number, error: string, details?: string) {
  return NextResponse.json(
    {
      error,
      ...(details ? { details } : {}),
    },
    { status },
  );
}

export function handleRouteError(error: unknown, fallbackMessage: string) {
  console.error(fallbackMessage, error);

  const details =
    process.env.NODE_ENV === 'development' && error instanceof Error
      ? error.message
      : undefined;

  return NextResponse.json(
    {
      error: fallbackMessage,
      ...(details ? { message: details } : {}),
    },
    { status: 500 },
  );
}
