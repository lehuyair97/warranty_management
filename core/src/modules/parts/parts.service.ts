import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Like, Repository } from 'typeorm';
import { InvoiceItemEntity } from '@/database/entities/invoice-item.entity';
import { PartEntity } from '@/database/entities/part.entity';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';
import { PaginatedResultDto } from '@/common/dto/paginated-result.dto';
import { buildPaginationMeta } from '@/common/utils/pagination.util';
import { CreatePartDto } from './dto/create-part.dto';
import { UpdatePartDto } from './dto/update-part.dto';

@Injectable()
export class PartsService {
  constructor(
    @InjectRepository(PartEntity)
    private readonly partRepo: Repository<PartEntity>,
  ) {}

  async findAll(query: PaginationQueryDto): Promise<PaginatedResultDto<PartEntity>> {
    const { page = 1, limit = 10, search, order = 'DESC' } = query;
    const skip = (page - 1) * limit;

    const where = search ? { partName: Like(`%${search}%`) } : {};

    const [items, totalItems] = await this.partRepo.findAndCount({
      where,
      order: { createdAt: order },
      skip,
      take: limit,
    });

    const meta = buildPaginationMeta(totalItems, page, limit);
    return new PaginatedResultDto(items, meta);
  }

  async findOne(id: number): Promise<PartEntity> {
    const part = await this.partRepo.findOne({ where: { id } });
    if (!part) {
      throw new NotFoundException(`Spare part with ID ${id} not found`);
    }
    return part;
  }

  async findLowStock(threshold: number = 5): Promise<PartEntity[]> {
    return this.partRepo.find({
      where: {
        stockQuantity: LessThanOrEqual(threshold),
      },
      order: { stockQuantity: 'ASC' },
    });
  }

  async create(dto: CreatePartDto): Promise<PartEntity> {
    const part = this.partRepo.create(dto);
    return this.partRepo.save(part);
  }

  async update(id: number, dto: UpdatePartDto): Promise<PartEntity> {
    const part = await this.findOne(id);
    Object.assign(part, dto);
    return this.partRepo.save(part);
  }

  async adjustStock(id: number, delta: number): Promise<PartEntity> {
    const part = await this.findOne(id);
    part.stockQuantity = Math.max(0, part.stockQuantity + delta);
    return this.partRepo.save(part);
  }

  async delete(id: number): Promise<{ success: boolean; message: string }> {
    const part = await this.findOne(id);
    const invoiceItemCount = await this.partRepo.manager
      .createQueryBuilder(InvoiceItemEntity, 'item')
      .where('item.partId = :id', { id })
      .getCount();

    if (invoiceItemCount > 0) {
      throw new BadRequestException('Không thể xóa linh kiện đã có trong hóa đơn dịch vụ.');
    }

    await this.partRepo.remove(part);
    return { success: true, message: `Linh kiện #${id} đã được xóa thành công.` };
  }
}
