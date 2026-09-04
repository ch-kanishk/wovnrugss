/**
 * Runs a Prisma CLI command with the datasource env vars resolved first.
 *
 * Why this exists: the schema declares `directUrl = env("DIRECT_URL")` so that
 * migrations bypass a transaction pooler. But attaching a Postgres store in the
 * Vercel dashboard sets DATABASE_URL and *not* DIRECT_URL, and Prisma treats a
 * missing directUrl as a hard validation error — the first deploy would fail
 * with no tables created. Defaulting DIRECT_URL to DATABASE_URL makes the
 * common (no pooler) setup work out of the box, while still letting anyone on a
 * pooled connection set a real direct URL.
 *
 *   node scripts/prisma-run.mjs generate
 *   node scripts/prisma-run.mjs migrate deploy
 */
import { spawnSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';

/**
 * Load .env files the way the Prisma CLI and Next.js do. This wrapper inspects
 * DATABASE_URL itself, so it has to see values that live in a file rather than
 * the process environment — otherwise a local `npm run build` would report
 * DATABASE_URL as missing even though .env defines it.
 * Real environment variables always win, which is what Vercel relies on.
 */
function loadEnvFiles(target) {
  for (const file of ['.env.local', '.env']) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match) continue;
      const key = match[1];
      if (key in target) continue;                    // never override a real env var
      let value = match[2].trim();
      const quoted = value.match(/^(['"])([\s\S]*)\1/);
      value = quoted ? quoted[2] : value.split('#')[0].trim();
      target[key] = value;
    }
  }
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node scripts/prisma-run.mjs <prisma args...>');
  process.exit(1);
}

const env = { ...process.env };
loadEnvFiles(env);
const needsConnection = args[0] === 'migrate' || args[0] === 'db';

if (!env.DATABASE_URL) {
  if (needsConnection) {
    console.error(
      '\nDATABASE_URL is not set. Point it at your PostgreSQL database ' +
        '(see .env.example) before running migrations.\n'
    );
    process.exit(1);
  }
  // `prisma generate` never connects; a placeholder keeps `npm install` working
  // on a fresh clone that has no .env yet.
  env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/placeholder';
}

if (!env.DIRECT_URL) env.DIRECT_URL = env.DATABASE_URL;

const result = spawnSync('npx', ['prisma', ...args], { stdio: 'inherit', env, shell: false });
process.exit(result.status ?? 1);
