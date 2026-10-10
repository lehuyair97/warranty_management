import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EmployeeRole } from '@/common/constants';
import { Roles } from '@/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { InvoiceQueryDto } from './dto/invoice-query.dto';
import { InvoicesService } from './invoices.service';

/**
 * Controller handling billing invoices, spare part attachments, and payment checkouts.
 */
@ApiTags('Invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  @Roles(EmployeeRole.MANAGER, EmployeeRole.RECEPTIONIST)
  @ApiOperation({ summary: 'List invoices with pagination and filters' })
  async findAll(@Query() query: InvoiceQueryDto) {
    return this.invoicesService.findAll(query);
  }

  @Get(':id')
  @Roles(EmployeeRole.MANAGER, EmployeeRole.RECEPTIONIST, EmployeeRole.TECHNICIAN)
  @ApiOperation({ summary: 'Get detailed invoice with spare part items' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.invoicesService.findOne(id);
  }

  @Get('ticket/:ticketId')
  @Roles(EmployeeRole.MANAGER, EmployeeRole.RECEPTIONIST, EmployeeRole.TECHNICIAN)
  @ApiOperation({ summary: 'Get all invoices belonging to a specific ticket' })
  async findByTicketId(@Param('ticketId', ParseIntPipe) ticketId: number) {
    return this.invoicesService.findByTicketId(ticketId);
  }

  
  }
