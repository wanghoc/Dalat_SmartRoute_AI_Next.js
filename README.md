# Dalat SmartRoute (Next.js)

Next.js App Router migration of Dalat SmartRoute with Prisma + Supabase.

## Local setup

1. Install dependencies:

```bash
npm install
```

1. Create `.env.local` and set values:

```bash
# Runtime URL (Supabase pooler)
SUPABASE_DATABASE_URL="postgresql://postgres.<PROJECT_REF>:<URL_ENCODED_PASSWORD>@aws-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require"

# Direct URL (optional but recommended for migrate; can be same as DATABASE_URL when direct host is unavailable)
SUPABASE_DIRECT_URL="postgresql://postgres:<URL_ENCODED_PASSWORD>@db.<PROJECT_REF>.supabase.co:5432/postgres?sslmode=require"

# Backward-compatible aliases still supported
DATABASE_URL="postgresql://postgres.<PROJECT_REF>:<URL_ENCODED_PASSWORD>@aws-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require"
DIRECT_URL="postgresql://postgres:<URL_ENCODED_PASSWORD>@db.<PROJECT_REF>.supabase.co:5432/postgres?sslmode=require"

SUPABASE_PUBLISHABLE_KEY="..."
SUPABASE_SECRET_KEY="..."
SUPABASE_API_URL="https://<project-ref>.supabase.co/rest/v1/"

JWT_SECRET="replace_with_strong_secret"
OPENWEATHER_API_KEY="..."
GEMINI_API_KEY="..."
GEMINI_MODEL="gemini-flash-latest"
NEXT_PUBLIC_API_URL="/api"
```

1. Provision database + seed sample data:

```bash
npm run db:setup
```

This command uses a resilient flow:
- tries `prisma migrate deploy`
- falls back to `prisma db push` on connection/migration-engine issues
- runs seed script

1. Start dev server:

```bash
npm run dev
```

## Deployment (Vercel)

For full step-by-step deployment with Supabase setup, see [DEPLOY_SUPABASE_VERCEL.md](DEPLOY_SUPABASE_VERCEL.md).

Note: `.env.local` on your machine is not used by Vercel builds. Configure environment variables in Vercel Project Settings.

1. Add these environment variables in Vercel Project Settings:
- `SUPABASE_DATABASE_URL`
- `SUPABASE_DIRECT_URL`
- `DATABASE_URL`
- `DIRECT_URL`
- `JWT_SECRET`
- `OPENWEATHER_API_KEY`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `NEXT_PUBLIC_API_URL`

1. Use default Vercel build (or `vercel-build` script in this repo).

The `vercel-build` script runs:
- `npm run db:provision:soft`
- `npm run build`

So schema provisioning is attempted automatically during deploy in best-effort mode.
For first-time setup, run `npm run db:setup` locally to guarantee schema/data exist.

## Scripts

- `npm run build`: Prisma generate + Next build
- `npm run db:provision`: migrate deploy with db push fallback
- `npm run db:provision:soft`: same flow but does not block build on connection timeouts
- `npm run db:seed`: reset and seed demo data
- `npm run db:setup`: provision + seed
- `npm run vercel-build`: provision + build

## Troubleshooting

- `P1013 empty host in database URL`:
	Password likely contains special characters and is not URL encoded.
- `P1001 Can't reach database server`:
	Check Supabase project is active and verify host/port in URL.
- If direct host (`db.<ref>.supabase.co:5432`) fails in your network:
	Set `DIRECT_URL` temporarily equal to `DATABASE_URL`.
- If build log shows `file:./dev.db`:
	Your Vercel `DATABASE_URL` is misconfigured (SQLite value). Replace it with Supabase Postgres URI.
