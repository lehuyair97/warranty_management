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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '@/common/decorators/roles.decorator';
import { EmployeeRole } from '@/common/constants';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';
import { PartsService } from './parts.service';
import { CreatePartDto } from './dto/create-part.dto';
import { UpdatePartDto } from './dto/update-part.dto';

@ApiTags('Parts')
@ApiBearerAuth('JWT-auth')
@Controller('parts')
export class PartsController {
  constructor(private readonly partsService: PartsService) {}

  @Get()
  @Roles(EmployeeRole.RECEPTIONIST, EmployeeRole.TECHNICIAN, EmployeeRole.MANAGER)
  @ApiOperation({ summary: 'List and search spare parts inventory' })
  async findAll(@Query() query: PaginationQueryDto) {
    return this.partsService.findAll(query);
  }

  @Get('low-stock')
  @Roles(EmployeeRole.TECHNICIAN, EmployeeRole.MANAGER)
  @ApiOperation({ summary: 'Get parts with low stock inventory (<= 5)' })
  async findLowStock(@Query('threshold') threshold?: number) {
    return this.partsService.findLowStock(threshold ? Number(threshold) : 5);
  }

  @Get(':id')
  @Roles(EmployeeRole.RECEPTIONIST, EmployeeRole.TECHNICIAN, EmployeeRole.MANAGER)
  @ApiOperation({ summary: 'Get spare part details' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.partsService.findOne(id);
  }

  @Post()
  @Roles(EmployeeRole.MANAGER)
  @ApiOperation({ summary: 'Add a new spare part to inventory (Manager only)' })
  async create(@Body() createDto: CreatePartDto) {
    return this.partsService.create(createDto);
  }

  @Patch(':id')
  @Roles(EmployeeRole.MANAGER)
  @ApiOperation({ summary: 'Update part details or price (Manager only)' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdatePartDto,
  ) {
    return this.partsService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(EmployeeRole.MANAGER)
  @ApiOperation({ summary: 'Delete a spare part from inventory (Manager only)' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.partsService.delete(id);
  }
}
