import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Like, Repository } from 'typeorm';
import { DeviceEntity } from '@/database/entities/device.entity';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';
import { PaginatedResultDto } from '@/common/dto/paginated-result.dto';
import { buildPaginationMeta } from '@/common/utils/pagination.util';
import { checkIsUnderWarranty } from '@/common/helpers/warranty.helper';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(DeviceEntity)
    private readonly deviceRepo: Repository<DeviceEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(query: PaginationQueryDto): Promise<PaginatedResultDto<DeviceEntity>> {
    const { page = 1, limit = 10, search, order = 'DESC' } = query;
    const skip = (page - 1) * limit;

    const where = search
      ? [
          { deviceName: Like(`%${search}%`) },
          { serialNumber: Like(`%${search}%`) },
          { brand: Like(`%${search}%`) },
        ]
      : {};

    const [items, totalItems] = await this.deviceRepo.findAndCount({
      where,
      order: { createdAt: order },
      skip,
      take: limit,
      relations: ['customer'],
    });

    const meta = buildPaginationMeta(totalItems, page, limit);
    return new PaginatedResultDto(items, meta);
  }

  async findOne(id: number): Promise<DeviceEntity> {
    const device = await this.deviceRepo.findOne({
      where: { id },
      relations: ['customer', 'tickets'],
    });

    if (!device) {
      throw new NotFoundException(`Device with ID ${id} not found`);
    }

    return device;
  }

  async findBySerial(serialNumber: string): Promise<DeviceEntity | null> {
    return this.deviceRepo.findOne({
      where: { serialNumber },
      relations: ['customer'],
    });
  }

  async create(dto: CreateDeviceDto): Promise<DeviceEntity> {
    const device = this.deviceRepo.create(dto);
    return this.deviceRepo.save(device);
  }

  async update(id: number, dto: UpdateDeviceDto): Promise<DeviceEntity> {
    const device = await this.findOne(id);
    Object.assign(device, dto);
    return this.deviceRepo.save(device);
  }

  async checkWarranty(id: number, targetDate: Date = new Date()): Promise<{
    deviceId: number;
    isUnderWarranty: boolean;
    warrantyExpiryDate: string | null;
  }> {
    const device = await this.findOne(id);
    const isValid = checkIsUnderWarranty(device.isUnderWarranty, device.warrantyExpiryDate, targetDate);

    return {
      deviceId: device.id,
      isUnderWarranty: isValid,
      warrantyExpiryDate: device.warrantyExpiryDate,
    };
  }

  async getRepairHistory(id: number): Promise<unknown[]> {
    await this.findOne(id);
    // Execute T-SQL Table-Valued Function fn_get_device_repair_history
    return this.dataSource.query('SELECT * FROM dbo.fn_get_device_repair_history(@0) ORDER BY received_at DESC', [id]);
  }
}
