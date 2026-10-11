import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AllExceptionsFilter } from '@/common/filters/all-exceptions.filter';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { LoggingInterceptor } from '@/common/interceptors/logging.interceptor';
import { TransformResponseInterceptor } from '@/common/interceptors/transform-response.interceptor';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { appConfig } from '@/config/app.config';
import { authConfig } from '@/config/auth.config';
import { corsConfig } from '@/config/cors.config';
import { databaseConfig } from '@/config/database.config';
import {
  CustomerEntity,
  DeviceEntity,
  EmployeeEntity,
  InvoiceEntity,
  InvoiceItemEntity,
  PartEntity,
  TicketEntity,
  TicketStatusHistoryEntity,
} from '@/database/entities';
import { AuthModule } from '@/modules/auth/auth.module';
import { CustomersModule } from '@/modules/customers/customers.module';
import { DevicesModule } from '@/modules/devices/devices.module';
import { EmployeesModule } from '@/modules/employees/employees.module';
import { DatabaseAdminModule } from '@/modules/database-admin/database-admin.module';
import { InvoicesModule } from '@/modules/invoices/invoices.module';
import { PartsModule } from '@/modules/parts/parts.module';
import { ReportsModule } from '@/modules/reports/reports.module';
import { TicketsModule } from '@/modules/tickets/tickets.module';

/**
 * Root Application Module orchestrating configuration, database persistence,
 * global interceptors/guards/filters, and feature modules.
 */
@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, authConfig, corsConfig],
    }),

    // TypeORM with MSSQL
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const dbConfig = config.get('database');
        return {
          ...dbConfig,
          entities: [
            CustomerEntity,
            EmployeeEntity,
            DeviceEntity,
            PartEntity,
            TicketEntity,
            InvoiceEntity,
            InvoiceItemEntity,
            TicketStatusHistoryEntity,
          ],
        };
      },
    }),

    // Rate Limiting (100 req/minute baseline for internal API safety)
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    // Feature Modules
    AuthModule,
    EmployeesModule,
    CustomersModule,
    DevicesModule,
    TicketsModule,
    PartsModule,
    InvoicesModule,
    ReportsModule,
    DatabaseAdminModule,
  ],
  providers: [
    // Global Exception Filter
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    // Global Rate Limiting Guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Global JWT Authentication Guard (handles @Public() routes)
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Global RBAC Roles Guard
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    // Global Response Serialization Interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformResponseInterceptor,
    },
    // Global HTTP Logging Interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
