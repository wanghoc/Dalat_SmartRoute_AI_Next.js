import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { config as loadDotenv } from 'dotenv';

if (existsSync('.env')) {
  loadDotenv({ path: '.env' });
}
if (existsSync('.env.local')) {
  loadDotenv({ path: '.env.local', override: true });
}

function normalizeConnectionString(value) {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function isLikelySqliteUrl(value) {
  if (!value) {
    return false;
  }

  return value.startsWith('file:') || value.startsWith('sqlite:');
}

function hasSupportedPostgresProtocol(value) {
  if (!value) {
    return false;
  }

  return value.startsWith('postgres://') || value.startsWith('postgresql://');
}

function run(command, args, label, timeoutMs = 0, env = process.env) {
  console.log(`\n[db-provision] ${label}`);
  const result = spawnSync(command, args, {
    encoding: 'utf-8',
    stdio: 'pipe',
    shell: process.platform === 'win32',
    env,
    timeout: timeoutMs,
  });

  if (result.stdout) {
    process.stdout.write(result.stdout);
  }
  if (result.stderr) {
    process.stderr.write(result.stderr);
  }

  return {
    code: result.status ?? 1,
    output: `${result.stdout ?? ''}\n${result.stderr ?? ''}`,
    timedOut: result.error?.code === 'ETIMEDOUT',
  };
}

function isFallbackEligible(output) {
  return /P1001|P1012|P1013|Can't reach database server|provided database string is invalid|Environment variable not found|P1000/i.test(
    output,
  );
}

function getHost(connectionString) {
  if (!connectionString) {
    return '(missing)';
  }

  try {
    const host = new URL(connectionString).host;
    return host || '(empty-host)';
  } catch {
    return '(invalid-url)';
  }
}

process.env.DATABASE_URL = normalizeConnectionString(process.env.DATABASE_URL);
process.env.DIRECT_URL = normalizeConnectionString(process.env.DIRECT_URL);

if (!process.env.DATABASE_URL) {
  console.error('[db-provision] DATABASE_URL is missing.');
  console.error('[db-provision] Set DATABASE_URL in Vercel Project Settings -> Environment Variables.');
  process.exit(1);
}

if (isLikelySqliteUrl(process.env.DATABASE_URL)) {
  console.error('[db-provision] DATABASE_URL is using SQLite/file protocol, but schema expects PostgreSQL.');
  console.error('[db-provision] Current DATABASE_URL starts with file:/sqlite:.');
  console.error('[db-provision] Update Vercel DATABASE_URL to your Supabase Postgres URI (pooler on port 6543).');
  process.exit(1);
}

if (!hasSupportedPostgresProtocol(process.env.DATABASE_URL)) {
  console.error('[db-provision] DATABASE_URL must start with postgres:// or postgresql://');
  process.exit(1);
}

if (!process.env.DIRECT_URL) {
  process.env.DIRECT_URL = process.env.DATABASE_URL;
  console.warn('[db-provision] DIRECT_URL is missing. Defaulting DIRECT_URL to DATABASE_URL.');
}

if (isLikelySqliteUrl(process.env.DIRECT_URL)) {
  console.warn('[db-provision] DIRECT_URL is SQLite/file URL. Replacing DIRECT_URL with DATABASE_URL.');
  process.env.DIRECT_URL = process.env.DATABASE_URL;
}

const baseEnv = { ...process.env };
console.log(`[db-provision] DATABASE_URL host: ${getHost(baseEnv.DATABASE_URL)}`);
console.log(`[db-provision] DIRECT_URL host: ${getHost(baseEnv.DIRECT_URL)}`);

const migrate = run(
  'npx',
  ['prisma', 'migrate', 'deploy'],
  'Running prisma migrate deploy',
  90_000,
  baseEnv,
);

if (migrate.code === 0) {
  console.log('[db-provision] Migration deploy completed.');
  process.exit(0);
}

if (!migrate.timedOut && !isFallbackEligible(migrate.output)) {
  console.error('[db-provision] Migration failed with a non-recoverable error.');
  process.exit(migrate.code);
}

if (baseEnv.DIRECT_URL && baseEnv.DIRECT_URL !== baseEnv.DATABASE_URL) {
  console.warn('[db-provision] Retrying prisma migrate deploy with DATABASE_URL as DIRECT_URL.');
  const migrateWithPooled = run(
    'npx',
    ['prisma', 'migrate', 'deploy'],
    'Retrying prisma migrate deploy with pooled connection',
    90_000,
    { ...baseEnv, DIRECT_URL: baseEnv.DATABASE_URL },
  );

  if (migrateWithPooled.code === 0) {
    console.log('[db-provision] Migration deploy completed using pooled connection.');
    process.exit(0);
  }

  if (!migrateWithPooled.timedOut && !isFallbackEligible(migrateWithPooled.output)) {
    console.error('[db-provision] Retry migration failed with a non-recoverable error.');
    process.exit(migrateWithPooled.code);
  }
}

if (migrate.timedOut) {
  console.warn('[db-provision] prisma migrate deploy timed out. Falling back to db push.');
} else {
  console.warn('[db-provision] Falling back to prisma db push due to connection/migration engine error.');
}

const push = run(
  'npx',
  ['prisma', 'db', 'push'],
  'Running prisma db push fallback (DATABASE_URL as DIRECT_URL)',
  120_000,
  { ...baseEnv, DIRECT_URL: baseEnv.DATABASE_URL },
);

if (push.code !== 0) {
  console.error('[db-provision] Fallback db push failed.');
  process.exit(push.code);
}

console.log('[db-provision] Fallback db push completed.');
