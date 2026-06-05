import { StockMovement } from '@prisma/client';

type MovementWithRelations = StockMovement & {
  user?: { id: string; name: string; email?: string } | null;
  vehicle?: {
    id: string;
    brand: string;
    model: string;
    licensePlate: string | null;
  };
};

export function toStockMovementResponse(movement: MovementWithRelations) {
  return {
    id: movement.id,
    vehicleId: movement.vehicleId,
    type: movement.type,
    description: movement.description,
    reference: movement.reference,
    userId: movement.userId,
    user: movement.user,
    vehicle: movement.vehicle,
    createdAt: movement.createdAt,
  };
}
