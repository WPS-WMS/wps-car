/** Payloads alinhados ao CreateVehicleDto e ao formulário web (toApiPayload). */

const runId = () => `${Date.now()}`.slice(-8);

export function buildCarPayload(suffix = runId()) {
  const year = new Date().getFullYear();
  return {
    type: 'CAR',
    brand: 'Volkswagen',
    model: `Gol Teste ${suffix}`,
    version: '1.0',
    manufactureYear: year - 1,
    modelYear: year,
    licensePlate: `TST${suffix}`.slice(0, 7),
    color: 'Preto',
    mileage: 85000,
    fuel: 'FLEX',
    transmission: 'MANUAL',
    doors: 4,
    category: 'HATCH',
    status: 'IN_STOCK',
    notes: `Veículo criado por teste E2E ${suffix}`,
    purchaseValue: 18900,
    listedValue: 21900,
  };
}

export function buildProductPayload(suffix = runId()) {
  const year = new Date().getFullYear();
  return {
    type: 'PRODUCT',
    brand: 'Bosch',
    model: `Kit Revisão ${suffix}`,
    manufactureYear: year,
    modelYear: year,
    color: '—',
    status: 'IN_STOCK',
    notes: `Produto criado por teste E2E ${suffix}`,
    purchaseValue: 450,
    listedValue: 699.9,
  };
}

export function buildInvalidCarPayload() {
  return {
    ...buildCarPayload('inv'),
    licensePlate: 'ABC',
  };
}
