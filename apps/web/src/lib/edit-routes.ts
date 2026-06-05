/** Rotas de edição estáticas (query `id`) — compatível com `output: 'export'`. */

export function vehicleEditHref(id: string, params?: { tab?: string }) {
  const qs = new URLSearchParams({ id });
  if (params?.tab && params.tab !== 'dados') qs.set('tab', params.tab);
  return `/veiculos/editar?${qs}`;
}

export function customerEditHref(id: string) {
  return `/clientes/editar?id=${encodeURIComponent(id)}`;
}

export function supplierEditHref(id: string) {
  return `/fornecedores/editar?id=${encodeURIComponent(id)}`;
}
