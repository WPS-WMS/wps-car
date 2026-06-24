import * as fs from 'fs';
import * as path from 'path';

function applyEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i <= 0) continue;
    const key = t.slice(0, i).trim();
    const val = t.slice(i + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
}

export function loadEnvFiles(profile?: string) {
  const apiDir = path.resolve(__dirname, '..');
  const repoRoot = path.resolve(apiDir, '../..');
  const prof = (profile ?? process.env.ENV_PROFILE ?? 'local').toLowerCase();
  const names = prof === 'qa' ? ['.env.qa', '.env'] : ['.env.local', '.env'];

  for (const dir of [apiDir, repoRoot]) {
    for (const name of names) {
      applyEnvFile(path.join(dir, name));
    }
  }
}
