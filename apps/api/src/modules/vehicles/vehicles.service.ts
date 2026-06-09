import { Injectable } from '@nestjs/common';
import { VehicleStatus } from '@prisma/client';
import { DomainException } from '../../domain/exceptions/domain.exception';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { toVehicleResponse } from '../../common/mappers/vehicle.mapper';
import {
  isValidLicensePlate,
  normalizeLicensePlate,
} from '../../common/utils/license-plate.util';
import { DataScopeService } from '../../infrastructure/scope/data-scope.service';
import { TenantContextService } from '../../infrastructure/tenant/tenant-context.service';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { ListVehiclesQueryDto } from './dto/list-vehicles-query.dto';
import { VehiclesRepository } from './repositories/vehicles.repository';
import { FinancialRecalculationService } from '../financial/services/financial-recalculation.service';

@Injectable()
export class VehiclesService {
  constructor(
    private readonly vehiclesRepository: VehiclesRepository,
    private readonly tenantContext: TenantContextService,
    private readonly dataScope: DataScopeService,
    private readonly recalculationService: FinancialRecalculationService,
  ) {}

  async findAll(query: ListVehiclesQueryDto, actor: AuthenticatedUser) {
    const scope = await this.dataScope.buildVehicleScope(actor, {
      branchId: query.branchId,
    });
    const { data, total, page, limit } =
      await this.vehiclesRepository.findManyPaginated(query, scope);

    return new PaginatedResponseDto(
      data.map(toVehicleResponse),
      total,
      page,
      limit,
    );
  }

  async findById(id: string, actor: AuthenticatedUser) {
    const vehicle = await this.vehiclesRepository.findById(id);
    if (!vehicle) {
      throw new DomainException('VEHICLE_NOT_FOUND', 'Veículo não encontrado', 404);
    }
    this.dataScope.assertVehicleAccess(vehicle, actor);
    return toVehicleResponse(vehicle);
  }

  async findByPlate(licensePlate: string, actor: AuthenticatedUser) {
    const vehicle = await this.vehiclesRepository.findByLicensePlate(licensePlate);
    if (!vehicle) {
      throw new DomainException('VEHICLE_NOT_FOUND', 'Veículo não encontrado', 404);
    }
    this.dataScope.assertVehicleAccess(vehicle, actor);
    return toVehicleResponse(vehicle);
  }

  async create(dto: CreateVehicleDto, actor: AuthenticatedUser) {
    const tenantId = this.tenantContext.requireTenantId();

    let licensePlate: string | undefined;
    if (dto.licensePlate) {
      if (!isValidLicensePlate(dto.licensePlate)) {
        throw new DomainException('INVALID_LICENSE_PLATE', 'Placa inválida');
      }
      licensePlate = normalizeLicensePlate(dto.licensePlate);
      const existing = await this.vehiclesRepository.findByLicensePlate(licensePlate);
      if (existing) {
        throw new DomainException('LICENSE_PLATE_EXISTS', 'Placa já cadastrada', 409);
      }
    }

    const chassis = dto.chassis?.trim() || undefined;
    if (chassis) {
      const existingChassis = await this.vehiclesRepository.findByChassis(chassis);
      if (existingChassis) {
        throw new DomainException('CHASSIS_EXISTS', 'Chassi já cadastrado', 409);
      }
    }

    const branchId = await this.dataScope.resolveVehicleBranchId(actor, dto.branchId);

    const vehicle = await this.vehiclesRepository.createWithFinancial(
      {
        tenantId,
        branchId,
        type: dto.type,
        brand: dto.brand,
        model: dto.model,
        version: dto.version,
        manufactureYear: dto.manufactureYear,
        modelYear: dto.modelYear,
        licensePlate,
        renavam: dto.renavam,
        chassis,
        color: dto.color,
        mileage: dto.mileage,
        fuel: dto.fuel,
        transmission: dto.transmission,
        doors: dto.doors,
        category: dto.category,
        status: dto.status ?? VehicleStatus.IN_STOCK,
        notes: dto.notes,
        createdById: actor.id,
        updatedById: actor.id,
      },
      {
        purchaseValue: dto.purchaseValue,
        purchaseDate: dto.purchaseDate ?? new Date(),
        listedValue: dto.listedValue,
      },
    );

    await this.recalculationService.recalculate(vehicle.id);
    const withFinancial = await this.vehiclesRepository.findById(vehicle.id);
    return toVehicleResponse(withFinancial!);
  }

  async update(id: string, dto: UpdateVehicleDto, actor: AuthenticatedUser) {
    const vehicle = await this.vehiclesRepository.findById(id);
    if (!vehicle) {
      throw new DomainException('VEHICLE_NOT_FOUND', 'Veículo não encontrado', 404);
    }

    this.dataScope.assertVehicleAccess(vehicle, actor);

    if (vehicle.status === VehicleStatus.SOLD) {
      throw new DomainException(
        'VEHICLE_ALREADY_SOLD',
        'Veículo vendido não pode ser alterado',
        403,
      );
    }

    let licensePlate = vehicle.licensePlate;
    if (dto.licensePlate !== undefined) {
      if (dto.licensePlate === '' || dto.licensePlate === null) {
        licensePlate = null;
      } else {
        if (!isValidLicensePlate(dto.licensePlate)) {
          throw new DomainException('INVALID_LICENSE_PLATE', 'Placa inválida');
        }
        licensePlate = normalizeLicensePlate(dto.licensePlate);
        if (licensePlate !== vehicle.licensePlate) {
          const existing = await this.vehiclesRepository.findByLicensePlate(licensePlate);
          if (existing && existing.id !== id) {
            throw new DomainException('LICENSE_PLATE_EXISTS', 'Placa já cadastrada', 409);
          }
        }
      }
    }

    if (dto.chassis) {
      const existingChassis = await this.vehiclesRepository.findByChassis(dto.chassis, id);
      if (existingChassis) {
        throw new DomainException('CHASSIS_EXISTS', 'Chassi já cadastrado', 409);
      }
    }

    const {
      purchaseValue,
      purchaseDate,
      listedValue,
      minimumValue,
      saleValue,
      ...vehicleFields
    } = dto;

    const updated = await this.vehiclesRepository.update(id, {
      ...vehicleFields,
      licensePlate,
      updatedById: actor.id,
    });

    const financialTouched =
      purchaseValue !== undefined ||
      purchaseDate !== undefined ||
      listedValue !== undefined ||
      minimumValue !== undefined ||
      saleValue !== undefined;

    if (financialTouched) {
      await this.vehiclesRepository.updateFinancial(id, {
        ...(purchaseValue !== undefined && { purchaseValue }),
        ...(purchaseDate !== undefined && { purchaseDate }),
        ...(listedValue !== undefined && { listedValue }),
        ...(minimumValue !== undefined && { minimumValue }),
        ...(saleValue !== undefined && { saleValue }),
      });
      await this.recalculationService.recalculate(id);
    }

    const refreshed = await this.vehiclesRepository.findById(id);
    return toVehicleResponse(refreshed!);
  }

  async remove(id: string) {
    const vehicle = await this.vehiclesRepository.findById(id);
    if (!vehicle) {
      throw new DomainException('VEHICLE_NOT_FOUND', 'Veículo não encontrado', 404);
    }

    if (vehicle.status === VehicleStatus.SOLD) {
      throw new DomainException(
        'VEHICLE_CANNOT_DELETE',
        'Veículo vendido não pode ser excluído',
        403,
      );
    }

    await this.vehiclesRepository.delete(id);
    return { message: 'Veículo excluído' };
  }
}
