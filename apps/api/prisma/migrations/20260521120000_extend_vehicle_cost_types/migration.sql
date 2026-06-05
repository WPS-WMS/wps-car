-- Novos tipos de custo por veículo
ALTER TYPE "VehicleCostType" ADD VALUE 'DISPATCHER';
ALTER TYPE "VehicleCostType" ADD VALUE 'TOWING';
ALTER TYPE "VehicleCostType" ADD VALUE 'ADVERTISING';
ALTER TYPE "VehicleCostType" ADD VALUE 'COMMISSION';
ALTER TYPE "VehicleCostType" ADD VALUE 'WASHING';

-- FK do usuário que lançou o custo
ALTER TABLE "vehicle_costs" ADD CONSTRAINT "vehicle_costs_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
