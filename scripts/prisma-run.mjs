/**
 * Runs a Prisma CLI command with the datasource environment resolved first.
 *
 *   node scripts/prisma-run.mjs generate
 *   node scripts/prisma-run.mjs migrate deploy
 *
 * Two problems this solves:
 *
 * 1. The schema declares `directUrl = env("DIRECT_URL")` so migrations can
 *    bypass a transaction pooler, but attaching a Postgres store in the Vercel
 *    dashboard sets only DATABASE_URL, and Prisma treats the missing directUrl
 *    as a hard validation error — the first deploy would fail having created no
 *    tables. DIRECT_URL therefore falls back to DATABASE_URL.
 *
 * 2. DATABASE_URL and DIRECT_URL must describe the SAME database. A real
 *    environment variable overrides the .env file, so if someone runs
 *    `DATABASE_URL=<production> npm run db:deploy`, taking DIRECT_URL from .env
 *    would migrate their *local* database while they believe they are migrating
 *    production. The two are resolved as a pair from a single source.
 */
import { spawnSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';

/** Parse .env files into an object, without touching process.env. */
function readEnvFiles() {
  const values = {};
  for (const file of ['.env', '.env.local']) {   // .env.local wins, as in Next.js
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match) continue;
      const [, key, rawValue] = match;
      const quoted = rawValue.trim().match(/^(['"])([\s\S]*)\1/);
      values[key] = quoted ? quoted[2] : rawValue.split('#')[0].trim();
    }
  }
  return values;
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node scripts/prisma-run.mjs <prisma args...>');
  process.exit(1);
}

const fileEnv = readEnvFiles();
const env = { ...fileEnv, ...process.env };   // real environment variables win

// Resolve the datasource pair from whichever source supplied DATABASE_URL, so a
// command-line DATABASE_URL never pairs with a DIRECT_URL from .env.
const fromProcess = Boolean(process.env.DATABASE_URL);
const databaseUrl = process.env.DATABASE_URL ?? fileEnv.DATABASE_URL;
const directUrl =
  process.env.DIRECT_URL ?? (fromProcess ? databaseUrl : fileEnv.DIRECT_URL ?? databaseUrl);

const needsConnection = args[0] === 'migrate' || args[0] === 'db';

if (!databaseUrl) {
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
  env.DIRECT_URL = env.DATABASE_URL;
} else {
  env.DATABASE_URL = databaseUrl;
  env.DIRECT_URL = directUrl;
}

if (needsConnection) {
  // Never print credentials; just the host/database being touched.
  try {
    const u = new URL(env.DIRECT_URL);
    console.log(`> prisma ${args.join(' ')} → ${u.host}${u.pathname}`);
  } catch { /* unparseable URL — let Prisma report it */ }
}

const result = spawnSync('npx', ['prisma', ...args], { stdio: 'inherit', env, shell: false });
process.exit(result.status ?? 1);
