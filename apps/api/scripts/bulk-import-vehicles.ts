/**
 * Importação em lote de veículos/produtos via CSV.
 *
 * Uso (na pasta apps/api):
 *   npm run import:vehicles -- --file=../../scripts/vehicles-import.example.csv
 *   npm run import:vehicles -- --file=./meus-veiculos.csv --dry-run
 *
 * Variáveis de ambiente (ou .env na raiz do monorepo / apps/api):
 *   IMPORT_API_URL   default http://localhost:3001/api/v1
 *   IMPORT_EMAIL     default admin@revendademo.com.br
 *   IMPORT_PASSWORD  default Admin@123
 *   IMPORT_TENANT_CNPJ default 00000000000191
 */

import * as fs from 'fs';
import * as path from 'path';

// Carrega .env da raiz do monorepo ou apps/api
function loadEnvFile() {
  const candidates = [
    path.resolve(__dirname, '../../../.env'),
    path.resolve(__dirname, '../.env'),
  ];
  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
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
}

loadEnvFile();

const HEADER_ALIASES: Record<string, string> = {
  tipo: 'type',
  type: 'type',
  marca: 'brand',
  brand: 'brand',
  modelo: 'model',
  model: 'model',
  versao: 'version',
  version: 'version',
  ano_fabricacao: 'manufactureYear',
  manufactureyear: 'manufactureYear',
  ano_modelo: 'modelYear',
  modelyear: 'modelYear',
  placa: 'licensePlate',
  licenseplate: 'licensePlate',
  renavam: 'renavam',
  chassi: 'chassis',
  chassis: 'chassis',
  cor: 'color',
  color: 'color',
  km: 'mileage',
  mileage: 'mileage',
  combustivel: 'fuel',
  fuel: 'fuel',
  cambio: 'transmission',
  transmission: 'transmission',
  portas: 'doors',
  doors: 'doors',
  categoria: 'category',
  category: 'category',
  status: 'status',
  observacoes: 'notes',
  notes: 'notes',
  valor_compra: 'purchaseValue',
  purchasevalue: 'purchaseValue',
  data_compra: 'purchaseDate',
  purchasedate: 'purchaseDate',
  valor_anunciado: 'listedValue',
  listedvalue: 'listedValue',
};

const VEHICLE_TYPES = new Set([
  'CAR',
  'MOTORCYCLE',
  'TRUCK',
  'UTILITY',
  'PRODUCT',
  'OTHER',
]);

function parseArgs() {
  const args = process.argv.slice(2);
  let file = '';
  let dryRun = false;
  let delimiter = '';

  for (const arg of args) {
    if (arg === '--dry-run') dryRun = true;
    else if (arg.startsWith('--file=')) file = arg.slice('--file='.length);
    else if (arg.startsWith('--delimiter=')) delimiter = arg.slice('--delimiter='.length);
    else if (!arg.startsWith('--') && !file) file = arg;
  }

  if (!file) {
    console.error(
      'Informe o CSV: npm run import:vehicles -- --file=../../scripts/vehicles-import.example.csv',
    );
    process.exit(1);
  }

  return {
    file: path.resolve(process.cwd(), file),
    dryRun,
    delimiter: delimiter || undefined,
  };
}

function detectDelimiter(headerLine: string, forced?: string) {
  if (forced) return forced;
  const semi = (headerLine.match(/;/g) ?? []).length;
  const comma = (headerLine.match(/,/g) ?? []).length;
  return semi > comma ? ';' : ',';
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === delimiter && !inQuotes) {
      out.push(cur.trim());
      cur = '';
      continue;
    }
    cur += ch;
  }
  out.push(cur.trim());
  return out;
}

function parseCsv(content: string, forcedDelimiter?: string) {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'));

  if (!lines.length) return { rows: [] as Record<string, string>[], headers: [] as string[] };

  const delimiter = detectDelimiter(lines[0], forcedDelimiter);
  const rawHeaders = parseCsvLine(lines[0], delimiter);
  const headers = rawHeaders.map((h) => {
    const key = h.toLowerCase().replace(/\s+/g, '_');
    return HEADER_ALIASES[key] ?? key;
  });

  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i], delimiter);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = cells[idx] ?? '';
    });
    rows.push(row);
  }

  return { rows, headers };
}

function parseNumber(value: string | undefined): number | undefined {
  if (!value?.trim()) return undefined;
  let s = value.trim();
  // 45.000,00 → 45000.00 | 45000.00 permanece
  if (s.includes(',')) {
    s = s.replace(/\./g, '').replace(',', '.');
  }
  const n = Number(s);
  return Number.isNaN(n) ? undefined : n;
}

function parseIntField(value: string | undefined): number | undefined {
  if (!value?.trim()) return undefined;
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? undefined : n;
}

function rowToPayload(row: Record<string, string>, lineNum: number) {
  const type = (row.type ?? '').trim().toUpperCase();
  const brand = (row.brand ?? '').trim();
  const model = (row.model ?? '').trim();
  const manufactureYear = parseIntField(row.manufactureYear);
  const purchaseValue = parseNumber(row.purchaseValue);

  const errors: string[] = [];
  if (!type || !VEHICLE_TYPES.has(type)) {
    errors.push(`tipo inválido (${row.type ?? 'vazio'})`);
  }
  if (!brand) errors.push('marca obrigatória');
  if (!model) errors.push('modelo obrigatório');
  if (manufactureYear === undefined) errors.push('ano_fabricacao obrigatório');
  if (purchaseValue === undefined || purchaseValue <= 0) {
    errors.push('valor_compra obrigatório e > 0');
  }

  const isProduct = type === 'PRODUCT';
  let modelYear = parseIntField(row.modelYear);
  if (modelYear === undefined && manufactureYear !== undefined) {
    modelYear = manufactureYear;
  }
  if (!isProduct && modelYear === undefined) {
    errors.push('ano_modelo obrigatório para veículos');
  }

  if (errors.length) {
    throw new Error(`Linha ${lineNum}: ${errors.join('; ')}`);
  }

  const payload: Record<string, unknown> = {
    type,
    brand,
    model,
    manufactureYear: manufactureYear!,
    modelYear: modelYear!,
    purchaseValue: purchaseValue!,
    status: (row.status?.trim().toUpperCase() || 'IN_STOCK') as string,
  };

  const optionalString = (key: string, apiKey: string) => {
    const v = row[key]?.trim();
    if (v) payload[apiKey] = v;
  };

  optionalString('version', 'version');
  optionalString('notes', 'notes');
  optionalString('color', 'color');

  if (!isProduct) {
    optionalString('licensePlate', 'licensePlate');
    optionalString('renavam', 'renavam');
    optionalString('chassis', 'chassis');
    const mileage = parseIntField(row.mileage);
    if (mileage !== undefined) payload.mileage = mileage;
    const doors = parseIntField(row.doors);
    if (doors !== undefined) payload.doors = doors;
    if (row.fuel?.trim()) payload.fuel = row.fuel.trim().toUpperCase();
    if (row.transmission?.trim()) {
      payload.transmission = row.transmission.trim().toUpperCase();
    }
    if (row.category?.trim()) payload.category = row.category.trim().toUpperCase();
  }

  const listedValue = parseNumber(row.listedValue);
  if (listedValue !== undefined) payload.listedValue = listedValue;

  const purchaseDate = row.purchaseDate?.trim();
  if (purchaseDate) {
    const d = new Date(purchaseDate);
    if (Number.isNaN(d.getTime())) {
      throw new Error(`Linha ${lineNum}: data_compra inválida (${purchaseDate})`);
    }
    payload.purchaseDate = d.toISOString();
  }

  return payload;
}

async function login(): Promise<string> {
  const baseUrl = process.env.IMPORT_API_URL ?? 'http://localhost:3001/api/v1';
  const res = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.IMPORT_EMAIL ?? 'admin@revendademo.com.br',
      password: process.env.IMPORT_PASSWORD ?? 'Admin@123',
      tenantCnpj: process.env.IMPORT_TENANT_CNPJ ?? '00000000000191',
    }),
  });

  const body = (await res.json()) as { accessToken?: string; message?: string };
  if (!res.ok || !body.accessToken) {
    throw new Error(
      `Login falhou (${res.status}): ${body.message ?? JSON.stringify(body)}`,
    );
  }
  return body.accessToken;
}

async function createVehicle(
  token: string,
  payload: Record<string, unknown>,
): Promise<{ id: string; brand: string; model: string }> {
  const baseUrl = process.env.IMPORT_API_URL ?? 'http://localhost:3001/api/v1';
  const res = await fetch(`${baseUrl}/vehicles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const body = (await res.json()) as {
    id?: string;
    brand?: string;
    model?: string;
    message?: string | string[];
    data?: { id: string; brand: string; model: string };
  };

  if (!res.ok) {
    const msg = Array.isArray(body.message) ? body.message.join(', ') : body.message;
    throw new Error(msg ?? `HTTP ${res.status}`);
  }

  const data = body.data ?? body;
  return {
    id: data.id!,
    brand: data.brand ?? '',
    model: data.model ?? '',
  };
}

async function main() {
  const { file, dryRun, delimiter } = parseArgs();

  if (!fs.existsSync(file)) {
    console.error(`Arquivo não encontrado: ${file}`);
    process.exit(1);
  }

  const content = fs.readFileSync(file, 'utf8');
  const { rows } = parseCsv(content, delimiter);

  if (!rows.length) {
    console.log('Nenhuma linha de dados no CSV (apenas cabeçalho ou arquivo vazio).');
    process.exit(0);
  }

  console.log(`Arquivo: ${file}`);
  console.log(`Linhas: ${rows.length}${dryRun ? ' (simulação — dry-run)' : ''}\n`);

  let token: string | null = null;
  if (!dryRun) {
    console.log('Autenticando…');
    token = await login();
    console.log('OK\n');
  }

  let ok = 0;
  let fail = 0;

  for (let i = 0; i < rows.length; i++) {
    const lineNum = i + 2;
    try {
      const payload = rowToPayload(rows[i], lineNum);
      if (dryRun) {
        console.log(
          `[dry-run] Linha ${lineNum}: ${payload.type} ${payload.brand} ${payload.model}`,
        );
        ok++;
        continue;
      }

      const created = await createVehicle(token!, payload);
      console.log(
        `✓ Linha ${lineNum}: ${created.brand} ${created.model} (id: ${created.id})`,
      );
      ok++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`✗ Linha ${lineNum}: ${msg}`);
      fail++;
    }
  }

  console.log(`\nResumo: ${ok} sucesso, ${fail} erro(s).`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
