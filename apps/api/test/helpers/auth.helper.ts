import { api } from './http-client';

export const E2E_DEFAULTS = {
  email: process.env.E2E_EMAIL ?? 'admin@revendademo.com.br',
  password: process.env.E2E_PASSWORD ?? 'Admin@123',
  tenantCnpj: process.env.E2E_TENANT_CNPJ ?? '00000000000191',
};

export async function loginAsAdmin(): Promise<string> {
  const res = await api()
    .post('/auth/login')
    .send({
      email: E2E_DEFAULTS.email,
      password: E2E_DEFAULTS.password,
      tenantCnpj: E2E_DEFAULTS.tenantCnpj,
    })
    .expect(200);

  const token = res.body.accessToken as string | undefined;
  if (!token) {
    throw new Error(
      'Login E2E falhou: verifique seed, DATABASE_URL e credenciais (E2E_EMAIL / E2E_PASSWORD / E2E_TENANT_CNPJ).',
    );
  }
  return token;
}

export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}
