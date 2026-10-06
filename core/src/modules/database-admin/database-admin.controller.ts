import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FastifyReply } from 'fastify';
import * as fs from 'fs';
import { EmployeeRole } from '@/common/constants';
import { CurrentUser, AuthenticatedUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { DatabaseAdminService } from './database-admin.service';
import { ExportQueryDto } from './dto/export-query.dto';
import { ImportPartsDto } from './dto/import-parts.dto';
import { ImportTicketsDto } from './dto/import-tickets.dto';
import { RestoreDatabaseDto } from './dto/restore-database.dto';

/**
 * Controller providing administrative endpoints for native database maintenance:
 * - Backup and restore operations (Manager only)
 * - Bulk import and export operations (Manager / Staff)
 */
@ApiTags('Database Administration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('database-admin')
export class DatabaseAdminController {
  constructor(private readonly dbAdminService: DatabaseAdminService) {}

  @Post('backup')
  @Roles(EmployeeRole.MANAGER)
  @ApiOperation({ summary: 'Trigger native SQL Server full database backup to disk (Manager only)' })
  async backupDatabase() {
    return this.dbAdminService.backupDatabase();
  }

  @Get('backups')
  @Roles(EmployeeRole.MANAGER)
  @ApiOperation({ summary: 'List all physical .bak database backup files on server (Manager only)' })
  async listBackups() {
    return this.dbAdminService.listBackups();
  }

  @Get('backups/:fileName/download')
  @Roles(EmployeeRole.MANAGER)
  @ApiOperation({ summary: 'Download a physical .bak backup file (Manager only)' })
  async downloadBackup(
    @Param('fileName') fileName: string,
    @Res() res: FastifyReply,
  ) {
    const filePath = this.dbAdminService.getBackupFilePath(fileName);
    const stream = fs.createReadStream(filePath);

    res.header('Content-Type', 'application/octet-stream');
    res.header('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.send(stream);
  }

  @Delete('backups/:fileName')
  @Roles(EmployeeRole.MANAGER)
  @ApiOperation({ summary: 'Delete a physical .bak backup file (Manager only)' })
  async deleteBackup(@Param('fileName') fileName: string) {
    return this.dbAdminService.deleteBackup(fileName);
  }

  @Post('restore')
  @Roles(EmployeeRole.MANAGER)
  @ApiOperation({ summary: 'Restore database from an existing .bak file on server (Manager only)' })
  async restoreDatabase(@Body() body: RestoreDatabaseDto) {
    return this.dbAdminService.restoreDatabase(body.backupFileName);
  }

  @Post('import/parts')
  @Roles(EmployeeRole.MANAGER)
  @ApiOperation({ summary: 'Bulk import spare parts via native T-SQL BULK INSERT (Manager only)' })
  async importParts(@Body() body: ImportPartsDto) {
    return this.dbAdminService.importPartsBulk(body.csvContent);
  }

  @Post('import/tickets')
  @Roles(EmployeeRole.MANAGER, EmployeeRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Bulk import repair tickets via native T-SQL BULK INSERT (Manager/Receptionist)' })
  async importTickets(
    @Body() body: ImportTicketsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.dbAdminService.importTicketsBulk(body.csvContent, user?.id || 1);
  }

  @Get('export/parts')
  @Roles(EmployeeRole.MANAGER, EmployeeRole.RECEPTIONIST, EmployeeRole.TECHNICIAN)
  @ApiOperation({ summary: 'Export parts dataset as CSV or JSON format' })
  async exportParts(
    @Query() query: ExportQueryDto,
    @Res() res: FastifyReply,
  ) {
    const data = await this.dbAdminService.exportPartsData();
    if (query.format === 'json') {
      return res.send(data);
    }

    const csv = this.dbAdminService.convertToCsv(data);
    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.header('Content-Disposition', 'attachment; filename="parts_export.csv"');
    return res.send(csv);
  }

  @Get('export/invoices')
  @Roles(EmployeeRole.MANAGER, EmployeeRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Export invoices financial dataset as CSV or JSON format' })
  async exportInvoices(
    @Query() query: ExportQueryDto,
    @Res() res: FastifyReply,
  ) {
    const data = await this.dbAdminService.exportInvoicesData();
    if (query.format === 'json') {
      return res.send(data);
    }

    const csv = this.dbAdminService.convertToCsv(data);
    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.header('Content-Disposition', 'attachment; filename="invoices_export.csv"');
    return res.send(csv);
  }

  @Get('export/tickets')
  @Roles(EmployeeRole.MANAGER, EmployeeRole.RECEPTIONIST, EmployeeRole.TECHNICIAN)
  @ApiOperation({ summary: 'Export tickets repair dataset as CSV or JSON format' })
  async exportTickets(
    @Query() query: ExportQueryDto,
    @Res() res: FastifyReply,
  ) {
    const data = await this.dbAdminService.exportTicketsData();
    if (query.format === 'json') {
      return res.send(data);
    }

    const csv = this.dbAdminService.convertToCsv(data);
    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.header('Content-Disposition', 'attachment; filename="tickets_export.csv"');
    return res.send(csv);
  }
}
