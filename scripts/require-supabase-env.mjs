#!/usr/bin/env node
/**
 * Fail Capacitor / production builds if Supabase env is missing.
 * Vite only bakes VITE_* at build time — TestFlight must not ship placeholders.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnvFile(name) {
  const path = resolve(process.cwd(), name);
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[m[1]] = v;
  }
  return out;
}

const fileEnv = {
  ...loadEnvFile('.env'),
  ...loadEnvFile('.env.local'),
  ...loadEnvFile('.env.production'),
  ...loadEnvFile('.env.production.local'),
};

const url = process.env.VITE_SUPABASE_URL || fileEnv.VITE_SUPABASE_URL || '';
const key = process.env.VITE_SUPABASE_ANON_KEY || fileEnv.VITE_SUPABASE_ANON_KEY || '';

if (!url || !key || url.includes('your-project') || key.includes('your-anon')) {
  console.error(
    '[require-supabase-env] Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.\n' +
      'Add them to .env.local before `vite build` / `cap sync` so TestFlight is not a setup screen.',
  );
  process.exit(1);
}

console.log('[require-supabase-env] OK', url.replace(/^https?:\/\//, '').slice(0, 40));
