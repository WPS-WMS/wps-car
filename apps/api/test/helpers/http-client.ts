import * as request from 'supertest';

/** Base da API em execução (ex.: npm run start:dev). */
export const API_BASE =
  process.env.E2E_API_URL?.replace(/\/$/, '') ?? 'http://127.0.0.1:3001/api/v1';

export function api() {
  return request(API_BASE);
}

export async function assertApiReachable() {
  try {
    await request('http://127.0.0.1:3001')
      .get('/api/v1/health')
      .timeout({ deadline: 5000 });
  } catch {
    throw new Error(
      `API não acessível em ${API_BASE}. Inicie com: cd apps/api && npm run start:dev`,
    );
  }
}
