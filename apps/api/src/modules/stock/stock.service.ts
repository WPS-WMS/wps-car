import { Injectable } from '@nestjs/common';
import { StockMovementType, VehicleStatus } from '@prisma/client';
import { DomainException } from '../../domain/exceptions/domain.exception';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import {
  isValidLicensePlate,
  normalizeLicensePlate,
} from '../../common/utils/license-plate.util';
import { toPlateLookupResponse } from '../../common/mappers/plate-lookup.mapper';
import { toStockItemResponse } from '../../common/mappers/vehicle.mapper';
import { toStockMovementResponse } from '../../common/mappers/stock.mapper';
import { DataScopeService } from '../../infrastructure/scope/data-scope.service';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { ListVehiclesQueryDto } from '../vehicles/dto/list-vehicles-query.dto';
import { VehiclesRepository } from '../vehicles/repositories/vehicles.repository';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { ListStockMovementsQueryDto } from './dto/list-stock-movements-query.dto';
import { StockRepository } from './repositories/stock.repository';

const IN_STOCK_STATUSES: VehicleStatus[] = [
  VehicleStatus.IN_STOCK,
  VehicleStatus.RESERVED,
  VehicleStatus.IN_PREPARATION,
  VehicleStatus.IN_MAINTENANCE,
];

const MOVEMENT_STATUS_MAP: Partial<Record<StockMovementType, VehicleStatus>> = {
  [StockMovementType.ENTRY]: VehicleStatus.IN_STOCK,
  [StockMovementType.EXIT]: VehicleStatus.UNAVAILABLE,
  [StockMovementType.RESERVATION]: VehicleStatus.RESERVED,
  [StockMovementType.RELEASE]: VehicleStatus.IN_STOCK,
};

@Injectable()
export class StockService {
  constructor(
    private readonly vehiclesRepository: VehiclesRepository,
    private readonly stockRepository: StockRepository,
    private readonly dataScope: DataScopeService,
  ) {}

  async listInventory(query: ListVehiclesQueryDto, actor: AuthenticatedUser) {
    const scope = await this.dataScope.buildVehicleScope(actor, {
      branchId: query.branchId,
    });
    const { data, total, page, limit } =
      await this.vehiclesRepository.findStockPaginated(query, IN_STOCK_STATUSES, scope);

    return new PaginatedResponseDto(
      data.map(toStockItemResponse),
      total,
      page,
      limit,
    );
  }

  async lookupByPlate(licensePlate: string, actor: AuthenticatedUser) {
    if (!isValidLicensePlate(licensePlate)) {
      throw new DomainException('INVALID_LICENSE_PLATE', 'Placa inválida', 400);
    }

    const normalized = normalizeLicensePlate(licensePlate);
    const vehicle = await this.vehiclesRepository.findByLicensePlate(normalized, true);

    if (!vehicle) {
      return toPlateLookupResponse({
        plate: normalized,
        vehicle: null,
        sales: [],
        costs: [],
        movements: [],
      });
    }

    this.dataScope.assertVehicleAccess(vehicle, actor);

    const [sales, costs, movements] = await Promise.all([
      this.stockRepository.findSalesByVehicle(vehicle.id),
      this.stockRepository.findCostsByVehicle(vehicle.id),
      this.stockRepository.findMovementsByVehicle(vehicle.id),
    ]);

    return toPlateLookupResponse({
      plate: normalized,
      vehicle,
      sales,
      costs,
      movements,
    });
  }

  async findByPlate(licensePlate: string, actor: AuthenticatedUser) {
    const vehicle = await this.vehiclesRepository.findByLicensePlate(licensePlate);
    if (!vehicle) {
      throw new DomainException('VEHICLE_NOT_FOUND', 'Veículo não encontrado no estoque', 404);
    }
    this.dataScope.assertVehicleAccess(vehicle, actor);
    return toStockItemResponse(vehicle);
  }

  async listMovements(query: ListStockMovementsQueryDto) {
    const { data, total, page, limit } =
      await this.stockRepository.findMovementsPaginated(query);

    return new PaginatedResponseDto(
      data.map(toStockMovementResponse),
      total,
      page,
      limit,
    );
  }

  async createMovement(dto: CreateStockMovementDto, actor: AuthenticatedUser) {
    const vehicle = await this.vehiclesRepository.findById(dto.vehicleId);
    if (!vehicle) {
      throw new DomainException('VEHICLE_NOT_FOUND', 'Veículo não encontrado', 404);
    }

    this.dataScope.assertVehicleAccess(vehicle, actor);

    if (vehicle.status === VehicleStatus.SOLD) {
      throw new DomainException(
        'VEHICLE_ALREADY_SOLD',
        'Veículo vendido não permite movimentação de estoque',
        403,
      );
    }

    const newStatus = dto.status ?? MOVEMENT_STATUS_MAP[dto.type];

    if (newStatus) {
      await this.vehiclesRepository.update(dto.vehicleId, { status: newStatus });
    }

    const movement = await this.stockRepository.createMovement({
      vehicleId: dto.vehicleId,
      type: dto.type,
      description: dto.description,
      reference: dto.reference,
      userId: actor.id,
    });

    return toStockMovementResponse(movement);
  }
}
