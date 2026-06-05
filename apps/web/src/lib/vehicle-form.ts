import { z } from 'zod';
import { isProductType, PRODUCT_TYPE } from './asset-type';

const fuelEnum = z.enum([
  'GASOLINE',
  'ETHANOL',
  'FLEX',
  'DIESEL',
  'ELECTRIC',
  'HYBRID',
  'GNV',
  'OTHER',
]);

const transmissionEnum = z.enum(['MANUAL', 'AUTOMATIC', 'CVT', 'AUTOMATED_MANUAL', 'OTHER']);

const categoryEnum = z.enum(['HATCH', 'SEDAN', 'SUV', 'PICKUP', 'VAN', 'COUPE', 'WAGON', 'OTHER']);

const vehicleFormBaseSchema = z.object({
  type: z.enum(['CAR', 'MOTORCYCLE', 'TRUCK', 'UTILITY', PRODUCT_TYPE, 'OTHER']),
  brand: z.string().min(1, 'Marca é obrigatória').max(100),
  model: z.string().min(1, 'Modelo é obrigatório').max(100),
  version: z.string().max(100).optional(),
  manufactureYear: z.number().int().min(1900).max(2100),
  modelYear: z.number().int().min(1900).max(2100),
  licensePlate: z.string().max(10).optional(),
  renavam: z.string().max(20).optional(),
  chassis: z.string().max(30).optional(),
  color: z.string().max(50).optional(),
  mileage: z.number().int().min(0).optional(),
  fuel: fuelEnum.optional(),
  transmission: transmissionEnum.optional(),
  doors: z.number().int().min(0).max(10).optional(),
  category: categoryEnum.optional(),
  status: z.enum([
    'IN_STOCK',
    'RESERVED',
    'SOLD',
    'IN_PREPARATION',
    'IN_MAINTENANCE',
    'UNAVAILABLE',
  ]),
  notes: z.string().max(2000).optional(),
  purchaseValue: z.number().min(0.01, 'Valor de compra é obrigatório'),
  purchaseDate: z.string().optional(),
  listedValue: z.number().min(0).optional(),
});

export const vehicleFormSchema = vehicleFormBaseSchema;

export type VehicleFormValues = z.infer<typeof vehicleFormSchema>;

export function emptyVehicleForm(): VehicleFormValues {
  const year = new Date().getFullYear();
  return {
    type: 'CAR',
    brand: '',
    model: '',
    version: '',
    manufactureYear: year,
    modelYear: year,
    licensePlate: '',
    renavam: '',
    chassis: '',
    color: '',
    mileage: undefined,
    fuel: undefined,
    transmission: undefined,
    doors: undefined,
    category: undefined,
    status: 'IN_STOCK',
    notes: '',
    purchaseValue: 0,
    purchaseDate: new Date().toISOString().slice(0, 10),
    listedValue: undefined,
  };
}

export function toApiPayload(values: VehicleFormValues, options?: { omitFinancial?: boolean }) {
  const product = isProductType(values.type);
  const year = values.manufactureYear;

  const base = {
    type: values.type,
    brand: values.brand.trim(),
    model: values.model.trim(),
    version: values.version?.trim() || undefined,
    manufactureYear: year,
    modelYear: product ? year : values.modelYear,
    licensePlate: product ? undefined : values.licensePlate?.trim() || undefined,
    renavam: product ? undefined : values.renavam?.trim() || undefined,
    chassis: product ? undefined : values.chassis?.trim() || undefined,
    color: values.color?.trim() || undefined,
    mileage: product ? undefined : values.mileage,
    fuel: product ? undefined : values.fuel,
    transmission: product ? undefined : values.transmission,
    doors: product ? undefined : values.doors,
    category: product ? undefined : values.category,
    status: values.status,
    notes: values.notes?.trim() || undefined,
  };

  if (options?.omitFinancial) {
    return base;
  }

  return {
    ...base,
    purchaseValue: values.purchaseValue,
    purchaseDate: values.purchaseDate ? new Date(values.purchaseDate).toISOString() : undefined,
    listedValue: values.listedValue,
  };
}
