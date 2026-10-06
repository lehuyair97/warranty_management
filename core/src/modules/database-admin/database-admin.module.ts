import { Module } from '@nestjs/common';
import { DatabaseAdminController } from './database-admin.controller';
import { DatabaseAdminService } from './database-admin.service';

/**
 * Module encapsulating native database management operations:
 * Backup, restore, and high-performance bulk data import/export.
 */
@Module({
  controllers: [DatabaseAdminController],
  providers: [DatabaseAdminService],
  exports: [DatabaseAdminService],
})
export class DatabaseAdminModule {}
