import { api, assertApiReachable } from './helpers/http-client';
import { authHeader, loginAsAdmin } from './helpers/auth.helper';
import {
  buildCarPayload,
  buildInvalidCarPayload,
  buildProductPayload,
} from './helpers/vehicle-payloads';

describe('Cadastro de veículos e produtos (e2e)', () => {
  let token: string;
  const createdIds: string[] = [];

  beforeAll(async () => {
    await assertApiReachable();
    token = await loginAsAdmin();
  });

  afterAll(async () => {
    for (const id of createdIds) {
      await api()
        .delete(`/vehicles/${id}`)
        .set(authHeader(token))
        .catch(() => undefined);
    }
  });

  it('cria um veículo (tipo CAR) com sucesso', async () => {
    const payload = buildCarPayload();

    const res = await api()
      .post('/vehicles')
      .set(authHeader(token))
      .send(payload)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      type: 'CAR',
      brand: payload.brand,
      model: payload.model,
      status: 'IN_STOCK',
    });
    expect(res.body.data.id).toBeDefined();
    createdIds.push(res.body.data.id);
  });

  it('cria um produto (tipo PRODUCT) sem campos de veículo', async () => {
    const payload = buildProductPayload();

    const res = await api()
      .post('/vehicles')
      .set(authHeader(token))
      .send(payload)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.type).toBe('PRODUCT');
    expect(res.body.data.brand).toBe(payload.brand);
    expect(res.body.data.licensePlate).toBeNull();
    createdIds.push(res.body.data.id);
  });

  it('lista veículos e encontra o cadastro recente', async () => {
    const payload = buildCarPayload('list');
    const created = await api()
      .post('/vehicles')
      .set(authHeader(token))
      .send(payload)
      .expect(201);

    const id = created.body.data.id as string;
    createdIds.push(id);

    const list = await api()
      .get('/vehicles')
      .query({ search: payload.model, limit: 10 })
      .set(authHeader(token))
      .expect(200);

    expect(list.body.data.some((v: { id: string }) => v.id === id)).toBe(true);
  });

  it('rejeita placa inválida', async () => {
    const res = await api()
      .post('/vehicles')
      .set(authHeader(token))
      .send(buildInvalidCarPayload());

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  it('exige autenticação para criar', async () => {
    await api().post('/vehicles').send(buildCarPayload('noauth')).expect(401);
  });
});
