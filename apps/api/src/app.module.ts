import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import configuration from './config/configuration';
import { validateEnv } from './config/env.validation';
import { resolveApiEnvFilePath } from './config/resolve-env-files';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { TenantGuard } from './common/guards/tenant.guard';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TenantContextInterceptor } from './common/interceptors/tenant-context.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { TenantContextMiddleware } from './infrastructure/tenant/tenant-context.middleware';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { TenantModule } from './infrastructure/tenant/tenant.module';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { UsersModule } from './modules/users/users.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { StockModule } from './modules/stock/stock.module';
import { CustomersModule } from './modules/customers/customers.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { FinancialModule } from './modules/financial/financial.module';
import { CostsModule } from './modules/costs/costs.module';
import { SalesModule } from './modules/sales/sales.module';
import { CommissionsModule } from './modules/commissions/commissions.module';
import { SettingsModule } from './modules/settings/settings.module';
import { DashboardsModule } from './modules/dashboards/dashboards.module';
import { ReportsModule } from './modules/reports/reports.module';
import { PlatformModule } from './modules/platform/platform.module';
import { PurchaseIntelligenceModule } from './modules/purchase-intelligence/purchase-intelligence.module';
import { PricingIntelligenceModule } from './modules/pricing-intelligence/pricing-intelligence.module';
import { CrmModule } from './modules/crm/crm.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { MailModule } from './infrastructure/mail/mail.module';
import { StorageModule } from './infrastructure/storage/storage.module';
import { FilesModule } from './modules/files/files.module';
import { AuditModule } from './modules/audit/audit.module';
import { CacheModule } from './infrastructure/cache/cache.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60_000, limit: 120 },
      { name: 'auth', ttl: 60_000, limit: 15 },
    ]),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: resolveApiEnvFilePath(),
      load: [configuration],
      validate: validateEnv,
    }),
    CacheModule,
    AuditModule,
    AuthModule,
    PrismaModule,
    TenantModule,
    MailModule,
    NotificationsModule,
    HealthModule,
    StorageModule,
    FilesModule,
    TenantsModule,
    UsersModule,
    VehiclesModule,
    StockModule,
    CustomersModule,
    SuppliersModule,
    FinancialModule,
    CostsModule,
    SalesModule,
    CommissionsModule,
    SettingsModule,
    DashboardsModule,
    ReportsModule,
    PlatformModule,
    PurchaseIntelligenceModule,
    PricingIntelligenceModule,
    CrmModule,
  ],
  providers: [
    TenantContextInterceptor,
    TenantGuard,
    RolesGuard,
    PermissionsGuard,
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useExisting: JwtAuthGuard },
    { provide: APP_GUARD, useExisting: TenantGuard },
    { provide: APP_GUARD, useExisting: RolesGuard },
    { provide: APP_GUARD, useExisting: PermissionsGuard },
    { provide: APP_INTERCEPTOR, useExisting: TenantContextInterceptor },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantContextMiddleware).forRoutes({
      path: '*',
      method: RequestMethod.ALL,
    });
  }
}
