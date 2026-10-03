import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EmployeeRole } from '@/common/constants';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { AssignTechnicianDto } from './dto/assign-technician.dto';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { ProcessTicketDto } from './dto/process-ticket.dto';
import { TicketQueryDto } from './dto/ticket-query.dto';
import { TrackTicketDto } from './dto/track-ticket.dto';
import { TicketsService } from './tickets.service';

/**
 * Controller exposing ticket lifecycle workflows, technician assignments,
 * diagnosis notes, and public repair status lookups.
 */
@ApiTags('Tickets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Public()
  @Get('public/track')
  @ApiOperation({ summary: 'Public guest ticket tracking lookup by ticket code and phone number' })
  async trackPublic(@Query() query: TrackTicketDto) {
    return this.ticketsService.trackPublic(query.ticketCode, query.phoneNumber);
  }

  @Get()
  @Roles(EmployeeRole.MANAGER, EmployeeRole.RECEPTIONIST, EmployeeRole.TECHNICIAN)
  @ApiOperation({ summary: 'List tickets with pagination and multiple query filters' })
  async findAll(@Query() query: TicketQueryDto) {
    return this.ticketsService.findAll(query);
  }

  @Get(':id')
  @Roles(EmployeeRole.MANAGER, EmployeeRole.RECEPTIONIST, EmployeeRole.TECHNICIAN)
  @ApiOperation({ summary: 'Get full ticket details with device, customer, and invoices' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ticketsService.findOne(id);
  }

  @Post()
  @Roles(EmployeeRole.RECEPTIONIST, EmployeeRole.MANAGER)
  @ApiOperation({ summary: 'Receive a device and create a new repair ticket (Receptionist only)' })
  async create(
    @CurrentUser('id') receptionistId: number,
    @Body() createDto: CreateTicketDto,
  ) {
    return this.ticketsService.create(receptionistId, createDto);
  }

  @Patch(':id/assign-technician')
  @Roles(EmployeeRole.MANAGER, EmployeeRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Assign a technician to ticket' })
  async assignTechnician(
    @Param('id', ParseIntPipe) id: number,
    @Body() assignDto: AssignTechnicianDto,
  ) {
    return this.ticketsService.assignTechnician(id, assignDto);
  }

  @Patch(':id/process')
  @Roles(EmployeeRole.TECHNICIAN, EmployeeRole.MANAGER)
  @ApiOperation({ summary: 'Update ticket diagnosis, repair notes, cost estimate, or lifecycle status' })
  async processTicket(
    @Param('id', ParseIntPipe) id: number,
    @Body() processDto: ProcessTicketDto,
  ) {
    return this.ticketsService.processTicket(id, processDto);
  }

  @Delete(':id')
  @Roles(EmployeeRole.MANAGER)
  @ApiOperation({ summary: 'Delete a repair ticket (Manager only)' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.ticketsService.remove(id);
  }
}
