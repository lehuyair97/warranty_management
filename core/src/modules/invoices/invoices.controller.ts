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
import { AddInvoicePartDto } from './dto/add-invoice-part.dto';
import { CheckoutInvoiceDto } from './dto/checkout-invoice.dto';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
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

  @Post()
  @Roles(EmployeeRole.MANAGER, EmployeeRole.RECEPTIONIST, EmployeeRole.TECHNICIAN)
  @ApiOperation({ summary: 'Create a new invoice for a ticket' })
  async create(@Body() createDto: CreateInvoiceDto) {
    return this.invoicesService.create(createDto);
  }

  @Post(':id/parts')
  @Roles(EmployeeRole.MANAGER, EmployeeRole.TECHNICIAN, EmployeeRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Add a spare part to an unpaid invoice' })
  async addPart(
    @Param('id', ParseIntPipe) id: number,
    @Body() addDto: AddInvoicePartDto,
  ) {
    return this.invoicesService.addPart(id, addDto);
  }

  @Delete(':id/parts/:partId')
  @Roles(EmployeeRole.MANAGER, EmployeeRole.TECHNICIAN, EmployeeRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Remove a spare part from an unpaid invoice' })
  async removePart(
    @Param('id', ParseIntPipe) id: number,
    @Param('partId', ParseIntPipe) partId: number,
  ) {
    return this.invoicesService.removePart(id, partId);
  }

  @Post(':id/checkout')
  @Roles(EmployeeRole.RECEPTIONIST, EmployeeRole.MANAGER)
  @ApiOperation({ summary: 'Process invoice checkout payment and mark ticket as delivered' })
  async checkout(
    @Param('id', ParseIntPipe) id: number,
    @Body() checkoutDto: CheckoutInvoiceDto,
  ) {
    return this.invoicesService.checkout(id, checkoutDto);
  }
}
