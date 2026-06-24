import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CommissionRuleType, UserRole, AuditAction } from '@prisma/client';
import { DomainException } from '../../domain/exceptions/domain.exception';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { toUserResponse } from '../../common/mappers/user.mapper';
import { TenantContextService } from '../../infrastructure/tenant/tenant-context.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { TENANT_USER_ROLES, CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateUserPermissionsDto } from './dto/update-user-permissions.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UsersRepository } from './repositories/users.repository';
import { AuditService } from '../audit/audit.service';
import { EmailDispatchService } from '../notifications/email-dispatch.service';
import { JwtUserLoaderService } from '../auth/services/jwt-user-loader.service';
import { PermissionsService } from '../auth/services/permissions.service';

@Injectable()
export class UsersService {
  private readonly BCRYPT_ROUNDS = 10;

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly tenantContext: TenantContextService,
    private readonly prisma: PrismaService,
    private readonly emailDispatch: EmailDispatchService,
    private readonly jwtUserLoader: JwtUserLoaderService,
    private readonly permissionsService: PermissionsService,
    private readonly audit: AuditService,
  ) {}

  private invalidateAuthCache(userId: string) {
    void this.jwtUserLoader.invalidate(userId);
    void this.permissionsService.invalidateForUser(userId);
  }

  async findAll(query: ListUsersQueryDto) {
    if (query.role === UserRole.MODERATOR) {
      throw new DomainException(
        'INVALID_ROLE_FILTER',
        'Perfil indisponível para consulta',
        400,
      );
    }

    const { data, total, page, limit } =
      await this.usersRepository.findManyPaginated(query);

    return new PaginatedResponseDto(
      data.map(toUserResponse),
      total,
      page,
      limit,
    );
  }

  async findById(id: string) {
    const user = await this.usersRepository.findByIdInTenant(id);
    if (!user) {
      throw new DomainException('USER_NOT_FOUND', 'Usuário não encontrado', 404);
    }
    return toUserResponse(user);
  }

  async create(dto: CreateUserDto, actor: AuthenticatedUser) {
    this.assertTenantRole(dto.role);

    const tenantId = this.tenantContext.requireTenantId();
    const existing = await this.usersRepository.findByEmailInTenant(dto.email);

    if (existing) {
      throw new DomainException('EMAIL_ALREADY_EXISTS', 'E-mail já cadastrado', 409);
    }

    const passwordHash = await bcrypt.hash(dto.password, this.BCRYPT_ROUNDS);
    const branchId = await this.resolveBranchIdForRole(dto.role, dto.branchId, {
      required: true,
    });

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          tenantId,
          name: dto.name,
          email: dto.email.toLowerCase(),
          passwordHash,
          role: dto.role,
          phone: dto.phone?.trim() || null,
          address: dto.address?.trim() || null,
          branchId,
          active: true,
          createdById: actor.id,
          updatedById: actor.id,
        },
        include: {
          branch: { select: { id: true, name: true } },
          rolePermissions: { include: { permission: true } },
        },
      });

      if (dto.role === UserRole.SELLER && dto.commissionType) {
        const value =
          dto.commissionType === CommissionRuleType.CUSTOM_PER_VEHICLE
            ? 0
            : Number(dto.commissionValue ?? 0);

        await tx.sellerCommissionRule.upsert({
          where: { sellerId: created.id },
          create: {
            tenantId,
            sellerId: created.id,
            type: dto.commissionType,
            value,
            active: true,
          },
          update: {
            type: dto.commissionType,
            value,
            active: true,
          },
        });
      }

      return created;
    });

    void this.sendWelcomeEmail(tenantId, user);

    return toUserResponse(user);
  }

  private async sendWelcomeEmail(
    tenantId: string,
    user: { name: string; email: string },
  ) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true },
    });

    await this.emailDispatch.sendTypedEmail({
      tenantId,
      code: 'user_welcome',
      to: user.email,
      variables: {
        userName: user.name,
        userEmail: user.email,
        companyName: tenant?.name ?? 'WPS Car',
      },
    });
  }

  async update(id: string, dto: UpdateUserDto, actor: AuthenticatedUser) {
    const user = await this.usersRepository.findByIdInTenant(id);
    if (!user) {
      throw new DomainException('USER_NOT_FOUND', 'Usuário não encontrado', 404);
    }

    if (dto.role) {
      this.assertTenantRole(dto.role);
    }

    if (dto.active === false) {
      await this.assertCanDeactivate(user.id, user.role, actor.id);
    }

    if (dto.email && dto.email.toLowerCase() !== user.email) {
      const existing = await this.usersRepository.findByEmailInTenant(dto.email);
      if (existing && existing.id !== id) {
        throw new DomainException('EMAIL_ALREADY_EXISTS', 'E-mail já cadastrado', 409);
      }
    }

    if (dto.role && user.role === UserRole.ADMIN && dto.role !== UserRole.ADMIN) {
      await this.assertHasAnotherAdmin(user.tenantId!, user.id);
    }

    const isActivating = dto.active === true && user.active === false;

    const nextRole = dto.role ?? user.role;
    const branchId = await this.resolveBranchIdForUpdate(
      user.role,
      nextRole,
      user.branchId,
      dto.branchId,
    );

    const updated = await this.usersRepository.update(id, {
      name: dto.name,
      email: dto.email?.toLowerCase(),
      phone: dto.phone?.trim(),
      address: dto.address?.trim(),
      role: dto.role,
      ...(branchId !== undefined && { branchId }),
      active: dto.active,
      ...(isActivating
        ? { deactivationReason: null, deactivatedAt: null }
        : { deactivationReason: dto.deactivationReason }),
      updatedById: actor.id,
    });

    if (dto.commissionType) {
      if (updated.role !== UserRole.SELLER) {
        throw new DomainException(
          'COMMISSION_ONLY_FOR_SELLER',
          'Comissão só pode ser configurada para vendedor',
          400,
        );
      }

      const value =
        dto.commissionType === CommissionRuleType.CUSTOM_PER_VEHICLE
          ? 0
          : Number(dto.commissionValue ?? 0);

      await this.prisma.sellerCommissionRule.upsert({
        where: { sellerId: updated.id },
        create: {
          tenantId: updated.tenantId!,
          sellerId: updated.id,
          type: dto.commissionType,
          value,
          active: true,
        },
        update: { type: dto.commissionType, value, active: true },
      });
    }

    if (dto.active === false) {
      await this.usersRepository.revokeAllSessions(id);
    }

    this.invalidateAuthCache(id);

    return toUserResponse(updated);
  }

  async deactivate(
    id: string,
    dto: { reason: string },
    actor: AuthenticatedUser,
  ) {
    const reason = dto.reason?.trim();
    if (!reason) {
      throw new DomainException('REASON_REQUIRED', 'Motivo é obrigatório', 400);
    }

    const updated = await this.update(
      id,
      {
        active: false,
        deactivationReason: reason,
        deactivatedAt: new Date(),
      } as any,
      actor,
    );
    return updated;
  }

  async resetPassword(id: string, dto: ResetPasswordDto, actor: AuthenticatedUser) {
    const user = await this.usersRepository.findByIdInTenant(id);
    if (!user) {
      throw new DomainException('USER_NOT_FOUND', 'Usuário não encontrado', 404);
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, this.BCRYPT_ROUNDS);

    await this.usersRepository.update(id, {
      passwordHash,
      updatedById: actor.id,
    });

    await this.usersRepository.revokeAllSessions(id);

    this.invalidateAuthCache(id);

    await this.audit.log({
      action: AuditAction.USER_PASSWORD_RESET,
      userId: actor.id,
      tenantId: actor.tenantId,
      entityType: 'user',
      entityId: id,
      metadata: { targetEmail: user.email },
    });

    return { message: 'Senha redefinida com sucesso' };
  }

  async updatePermissions(
    id: string,
    dto: UpdateUserPermissionsDto,
    actor: AuthenticatedUser,
  ) {
    const user = await this.usersRepository.findByIdInTenant(id);
    if (!user) {
      throw new DomainException('USER_NOT_FOUND', 'Usuário não encontrado', 404);
    }

    if (user.role === UserRole.MODERATOR) {
      throw new DomainException(
        'CANNOT_OVERRIDE_MODERATOR',
        'Não é possível alterar permissões de moderador',
        403,
      );
    }

    const allPermissions = await this.prisma.permission.findMany();
    const codeToId = new Map(allPermissions.map((p) => [p.code, p.id]));

    const overrides: { permissionId: string; granted: boolean }[] = [];

    for (const item of dto.permissions) {
      const permissionId = codeToId.get(item.code);
      if (!permissionId) {
        throw new DomainException(
          'PERMISSION_NOT_FOUND',
          `Permissão não encontrada: ${item.code}`,
          400,
        );
      }
      overrides.push({ permissionId, granted: item.granted });
    }

    const updated = await this.usersRepository.replacePermissionOverrides(
      id,
      overrides,
    );

    await this.usersRepository.update(id, { updatedById: actor.id });

    this.invalidateAuthCache(id);

    await this.audit.log({
      action: AuditAction.USER_PERMISSIONS_UPDATED,
      userId: actor.id,
      tenantId: actor.tenantId,
      entityType: 'user',
      entityId: id,
      metadata: {
        overrides: dto.permissions.map((item) => ({
          code: item.code,
          granted: item.granted,
        })),
      },
    });

    return toUserResponse(updated);
  }

  private async resolveBranchIdForRole(
    role: UserRole,
    branchId: string | null | undefined,
    options: { required: boolean },
  ): Promise<string | null> {
    if (role === UserRole.ADMIN) {
      return null;
    }

    if (role === UserRole.MANAGER || role === UserRole.SELLER) {
      if (options.required && branchId === undefined) {
        throw new DomainException(
          'BRANCH_ASSIGNMENT_REQUIRED',
          'Gerente e vendedor devem estar vinculados à matriz ou a uma única filial',
          400,
        );
      }

      return this.resolveBranchId(branchId ?? null);
    }

    return this.resolveBranchId(branchId);
  }

  private async resolveBranchIdForUpdate(
    currentRole: UserRole,
    nextRole: UserRole,
    currentBranchId: string | null,
    dtoBranchId: string | null | undefined,
  ): Promise<string | null | undefined> {
    if (nextRole === UserRole.ADMIN) {
      return null;
    }

    if (nextRole === UserRole.MANAGER || nextRole === UserRole.SELLER) {
      if (dtoBranchId !== undefined) {
        return this.resolveBranchId(dtoBranchId);
      }

      if (
        currentRole === UserRole.ADMIN &&
        (nextRole === UserRole.MANAGER || nextRole === UserRole.SELLER)
      ) {
        throw new DomainException(
          'BRANCH_ASSIGNMENT_REQUIRED',
          'Informe a matriz ou a filial ao alterar o perfil para gerente ou vendedor',
          400,
        );
      }

      return undefined;
    }

    return dtoBranchId === undefined
      ? undefined
      : this.resolveBranchId(dtoBranchId);
  }

  private async resolveBranchId(branchId?: string | null): Promise<string | null> {
    if (!branchId) {
      return null;
    }

    const tenantId = this.tenantContext.requireTenantId();
    const branch = await this.prisma.tenantBranch.findFirst({
      where: { id: branchId, tenantId },
    });

    if (!branch) {
      throw new DomainException(
        'BRANCH_NOT_FOUND',
        'Filial não encontrada ou não pertence à empresa',
        400,
      );
    }

    return branch.id;
  }

  private assertTenantRole(role: UserRole) {
    if (!TENANT_USER_ROLES.includes(role as (typeof TENANT_USER_ROLES)[number])) {
      throw new DomainException(
        'INVALID_ROLE',
        'Perfil inválido para usuário de revenda',
        400,
      );
    }
  }

  private async assertCanDeactivate(
    targetId: string,
    targetRole: UserRole,
    actorId: string,
  ) {
    if (targetId === actorId) {
      throw new DomainException(
        'CANNOT_DEACTIVATE_SELF',
        'Você não pode inativar sua própria conta',
        403,
      );
    }

    if (targetRole === UserRole.ADMIN) {
      const tenantId = this.tenantContext.requireTenantId();
      await this.assertHasAnotherAdmin(tenantId, targetId);
    }
  }

  private async assertHasAnotherAdmin(tenantId: string, excludeUserId: string) {
    const count = await this.usersRepository.countAdminsInTenant(
      tenantId,
      excludeUserId,
    );

    if (count === 0) {
      throw new DomainException(
        'LAST_ADMIN',
        'A empresa deve ter pelo menos um administrador ativo',
        403,
      );
    }
  }
}
