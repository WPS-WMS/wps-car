export interface FipeVehicleReference {
  brand: string;
  model: string;
  modelYear: number;
  manufactureYear: number;
  version?: string;
  fuel?: string;
  color?: string;
}

export interface FipePlateLookupResult {
  provider: 'mock' | 'http';
  licensePlate: string;
  vehicle: FipeVehicleReference;
  fipeValue: number;
  referenceMonth?: string;
  raw?: unknown;
}
