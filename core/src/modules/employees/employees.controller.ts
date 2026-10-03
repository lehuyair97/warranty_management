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
import { Roles } from '@/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { EmployeeQueryDto } from './dto/employee-query.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeesService } from './employees.service';

/**
 * Controller handling employee profile management and team discovery.
 */
@ApiTags('Employees')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  @Roles(EmployeeRole.MANAGER)
  @ApiOperation({ summary: 'List employees with pagination and filters (Manager only)' })
  async findAll(@Query() query: EmployeeQueryDto) {
    return this.employeesService.findAll(query);
  }

  @Get('technicians')
  @Roles(EmployeeRole.MANAGER, EmployeeRole.RECEPTIONIST, EmployeeRole.TECHNICIAN)
  @ApiOperation({ summary: 'List all active technicians for ticket assignments' })
  async findTechnicians() {
    return this.employeesService.findTechnicians();
  }

  @Get(':id')
  @Roles(EmployeeRole.MANAGER)
  @ApiOperation({ summary: 'Get employee details by ID (Manager only)' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.employeesService.findOne(id);
  }

  @Post()
  @Roles(EmployeeRole.MANAGER)
  @ApiOperation({ summary: 'Create a new employee account (Manager only)' })
  async create(@Body() createDto: CreateEmployeeDto) {
    return this.employeesService.create(createDto);
  }

  @Patch(':id')
  @Roles(EmployeeRole.MANAGER)
  @ApiOperation({ summary: 'Update employee account details (Manager only)' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateEmployeeDto,
  ) {
    return this.employeesService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(EmployeeRole.MANAGER)
  @ApiOperation({ summary: 'Deactivate employee account (Manager only)' })
  async deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.employeesService.deactivate(id);
  }
}
