import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '@/common/decorators/roles.decorator';
import { EmployeeRole } from '@/common/constants';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';
import { DevicesService } from './devices.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';

@ApiTags('Devices')
@ApiBearerAuth('JWT-auth')
@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Get()
  @Roles(EmployeeRole.RECEPTIONIST, EmployeeRole.TECHNICIAN, EmployeeRole.MANAGER)
  @ApiOperation({ summary: 'List and search registered devices with pagination' })
  async findAll(@Query() query: PaginationQueryDto) {
    return this.devicesService.findAll(query);
  }

  @Get('by-serial/:serialNumber')
  @Roles(EmployeeRole.RECEPTIONIST, EmployeeRole.TECHNICIAN, EmployeeRole.MANAGER)
  @ApiOperation({ summary: 'Lookup device by serial number or IMEI' })
  async findBySerial(@Param('serialNumber') serialNumber: string) {
    return this.devicesService.findBySerial(serialNumber);
  }

  @Get(':id')
  @Roles(EmployeeRole.RECEPTIONIST, EmployeeRole.TECHNICIAN, EmployeeRole.MANAGER)
  @ApiOperation({ summary: 'Get device details, customer owner, and tickets' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.devicesService.findOne(id);
  }

  @Get(':id/warranty-status')
  @Roles(EmployeeRole.RECEPTIONIST, EmployeeRole.TECHNICIAN, EmployeeRole.MANAGER)
  @ApiOperation({ summary: 'Check warranty validity for a device' })
  async checkWarranty(@Param('id', ParseIntPipe) id: number) {
    return this.devicesService.checkWarranty(id);
  }

  @Get(':id/repair-history')
  @Roles(EmployeeRole.RECEPTIONIST, EmployeeRole.TECHNICIAN, EmployeeRole.MANAGER)
  @ApiOperation({ summary: 'Get full historical repair logs for a device' })
  async getRepairHistory(@Param('id', ParseIntPipe) id: number) {
    return this.devicesService.getRepairHistory(id);
  }

  @Post()
  @Roles(EmployeeRole.RECEPTIONIST, EmployeeRole.MANAGER)
  @ApiOperation({ summary: 'Register a new device' })
  async create(@Body() createDto: CreateDeviceDto) {
    return this.devicesService.create(createDto);
  }

  @Patch(':id')
  @Roles(EmployeeRole.RECEPTIONIST, EmployeeRole.TECHNICIAN, EmployeeRole.MANAGER)
  @ApiOperation({ summary: 'Update device information or warranty date' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateDeviceDto,
  ) {
    return this.devicesService.update(id, updateDto);
  }
}
