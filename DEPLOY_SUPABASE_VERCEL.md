# Deploy Guide: Supabase + Vercel

This guide is for the Next.js project in this repository.

## 1) Prepare Supabase

1. Create a Supabase project.
2. Go to Project Settings -> Database -> Connection string.
3. Copy both connection strings:
   - Connection pooling URI (port 6543)
   - Direct connection URI (port 5432)

Important:
- If your password has special characters (for example: @, #, /), use the URI provided by Supabase directly.
- Do not manually type the URI if possible.

## 2) Configure Local Environment

Create or update `.env.local`:

```dotenv
DATABASE_URL="<pooling-uri-from-supabase>"
DIRECT_URL="<direct-uri-from-supabase>"
JWT_SECRET="<strong-random-secret>"
OPENWEATHER_API_KEY="<your-key>"
GEMINI_API_KEY="<your-key>"
GEMINI_MODEL="gemini-flash-latest"
NEXT_PUBLIC_API_URL="/api"
NODE_ENV="development"
```

Notes:
- If `DIRECT_URL` cannot connect in your network, set `DIRECT_URL` equal to `DATABASE_URL` temporarily.
- This repository includes a resilient DB provision script that can fallback to `prisma db push`.

## 3) Initialize Database (One Time)

Run:

```bash
npm install
npm run db:setup
```

What it does:
- Applies migration (or fallback push when migration engine cannot connect)
- Seeds demo data

Verify data:

```bash
npm run dev
```

Open these endpoints:
- http://localhost:3000/api/places
- http://localhost:3000/api/reviews

## 4) Push Source Code

```bash
git add .
git commit -m "Setup Supabase + Vercel deployment flow"
git push
```

## 5) Configure Vercel

In Vercel project settings, add Environment Variables for Production (and Preview if needed):

- DATABASE_URL
- DIRECT_URL
- JWT_SECRET
- OPENWEATHER_API_KEY
- GEMINI_API_KEY
- GEMINI_MODEL
- NEXT_PUBLIC_API_URL

Important:
- Vercel does not read your local `.env.local` file.
- You must set these values in Vercel Project Settings -> Environment Variables.

Recommended mapping for Supabase:
- `DATABASE_URL`: use Supabase pooler URL (`aws-<x>-<region>.pooler.supabase.com:6543`)
- `DIRECT_URL`: use Supabase direct URL (`db.<project-ref>.supabase.co:5432`) when available
- If direct URL cannot connect from Vercel, set `DIRECT_URL` equal to `DATABASE_URL`

This repository already contains `vercel.json` with:
- `buildCommand`: `npm run vercel-build`

And `vercel-build` does:
1. `npm run db:provision`
2. `npm run build`

## 6) First Production Seed

Deploy does not auto-seed to avoid wiping production data.

For first-time demo data in production, run once from your machine with production env values:

```bash
npm run db:seed
```

Warning:
- Current seed script clears existing data first.
- Do not run seed repeatedly on a live production database unless you want to reset data.

## 7) Troubleshooting

### Error: P1013 (invalid database URL / empty host)
Cause:
- Malformed URL, usually from unescaped special characters in password.

Fix:
- Re-copy URI from Supabase Connection string page.
- Do not edit password section manually.

### Error: P1001 (can't reach database server)
Cause:
- Wrong host/port/region or temporary network issue.

Fix:
1. Re-copy host from Supabase.
2. Test network to host/port.
3. Try `DIRECT_URL=DATABASE_URL` temporarily.
4. Confirm Vercel env values are updated in the correct environment (Production/Preview) and redeploy.

### Dev error: another next dev server is already running
Fix:

```powershell
taskkill /PID <pid> /F
npm run dev
```

## 8) Operational Recommendation

For real production:
- Keep deploy migration-only (`db:provision` + build)
- Seed only one time (or redesign seed to be idempotent/upsert-based)
- Rotate exposed API keys if they were ever shared publicly
