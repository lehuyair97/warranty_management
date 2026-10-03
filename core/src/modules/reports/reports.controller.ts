import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EmployeeRole } from '@/common/constants';
import { Roles } from '@/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { AuditInvoicesDto } from './dto/audit-invoices.dto';
import { DelayedTicketsQueryDto } from './dto/delayed-tickets-query.dto';
import { ReportsService } from './reports.service';

/**
 * Controller providing operational reports, audit reconciliations, and dashboard analytics.
 */
@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @Roles(EmployeeRole.MANAGER, EmployeeRole.RECEPTIONIST, EmployeeRole.TECHNICIAN)
  @ApiOperation({ summary: 'Get high-level dashboard metrics and volume distributions' })
  async getDashboardSummary() {
    return this.reportsService.getDashboardSummary();
  }

  @Get('delayed-tickets')
  @Roles(EmployeeRole.MANAGER, EmployeeRole.RECEPTIONIST, EmployeeRole.TECHNICIAN)
  @ApiOperation({ summary: 'Get overdue delayed tickets exceeding threshold days (sp_alert_delayed_tickets)' })
  async getDelayedTickets(@Query() query: DelayedTicketsQueryDto) {
    return this.reportsService.getDelayedTickets(query.delayDays);
  }

  @Post('audit-invoices')
  @Roles(EmployeeRole.MANAGER)
  @ApiOperation({ summary: 'Execute invoice reconciliation cursor audit with optional auto-fix (Manager only)' })
  async auditInvoices(@Body() body: AuditInvoicesDto) {
    return this.reportsService.auditInvoices(body.autoFix);
  }
}
