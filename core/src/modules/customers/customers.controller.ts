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
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '@/common/decorators/roles.decorator';
import { EmployeeRole } from '@/common/constants';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@ApiTags('Customers')
@ApiBearerAuth('JWT-auth')
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @Roles(EmployeeRole.RECEPTIONIST, EmployeeRole.MANAGER)
  @ApiOperation({ summary: 'List and search customers with pagination' })
  async findAll(@Query() query: PaginationQueryDto) {
    return this.customersService.findAll(query);
  }

  @Get('by-phone/:phoneNumber')
  @Roles(EmployeeRole.RECEPTIONIST, EmployeeRole.MANAGER)
  @ApiOperation({ summary: 'Fast phone number lookup for receptionist desk' })
  async findByPhone(@Param('phoneNumber') phoneNumber: string) {
    return this.customersService.findByPhone(phoneNumber);
  }

  @Get(':id')
  @Roles(EmployeeRole.RECEPTIONIST, EmployeeRole.MANAGER)
  @ApiOperation({ summary: 'Get customer profile and owned devices' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.customersService.findOne(id);
  }

  @Post()
  @Roles(EmployeeRole.RECEPTIONIST, EmployeeRole.MANAGER)
  @ApiOperation({ summary: 'Register a new customer profile' })
  async create(@Body() createDto: CreateCustomerDto) {
    return this.customersService.create(createDto);
  }

  @Patch(':id')
  @Roles(EmployeeRole.RECEPTIONIST, EmployeeRole.MANAGER)
  @ApiOperation({ summary: 'Update customer contact information' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateCustomerDto,
  ) {
    return this.customersService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(EmployeeRole.MANAGER)
  @ApiOperation({ summary: 'Delete customer profile (Manager only)' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.customersService.remove(id);
  }
}
