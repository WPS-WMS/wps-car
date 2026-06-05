import { CommissionRule, VehicleCommissionOverride } from '@prisma/client';
import { decimalToString } from '../utils/decimal.util';

export function toCommissionRuleResponse(rule: CommissionRule) {
  return {
    id: rule.id,
    tenantId: rule.tenantId,
    name: rule.name,
    type: rule.type,
    value: decimalToString(rule.value),
    active: rule.active,
    isDefault: rule.isDefault,
    createdAt: rule.createdAt,
    updatedAt: rule.updatedAt,
  };
}

export function toVehicleCommissionOverrideResponse(override: VehicleCommissionOverride) {
  return {
    id: override.id,
    tenantId: override.tenantId,
    vehicleId: override.vehicleId,
    type: override.type,
    value: decimalToString(override.value),
    createdAt: override.createdAt,
    updatedAt: override.updatedAt,
  };
}
