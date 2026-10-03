import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { CustomerEntity } from '@/database/entities/customer.entity';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';
import { PaginatedResultDto } from '@/common/dto/paginated-result.dto';
import { buildPaginationMeta } from '@/common/utils/pagination.util';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(CustomerEntity)
    private readonly customerRepo: Repository<CustomerEntity>,
  ) {}

  async findAll(query: PaginationQueryDto): Promise<PaginatedResultDto<CustomerEntity>> {
    const { page = 1, limit = 10, search, order = 'DESC' } = query;
    const skip = (page - 1) * limit;

    const where = search
      ? [
          { fullName: Like(`%${search}%`) },
          { phoneNumber: Like(`%${search}%`) },
          { email: Like(`%${search}%`) },
        ]
      : {};

    const [items, totalItems] = await this.customerRepo.findAndCount({
      where,
      order: { createdAt: order },
      skip,
      take: limit,
      relations: ['devices'],
    });

    const meta = buildPaginationMeta(totalItems, page, limit);
    return new PaginatedResultDto(items, meta);
  }

  async findOne(id: number): Promise<CustomerEntity> {
    const customer = await this.customerRepo.findOne({
      where: { id },
      relations: ['devices'],
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    return customer;
  }

  async findByPhone(phoneNumber: string): Promise<CustomerEntity | null> {
    return this.customerRepo.findOne({
      where: { phoneNumber },
      relations: ['devices'],
    });
  }

  async create(dto: CreateCustomerDto): Promise<CustomerEntity> {
    const customer = this.customerRepo.create(dto);
    return this.customerRepo.save(customer);
  }

  async update(id: number, dto: UpdateCustomerDto): Promise<CustomerEntity> {
    const customer = await this.findOne(id);
    Object.assign(customer, dto);
    return this.customerRepo.save(customer);
  }

  async remove(id: number): Promise<{ success: boolean; message: string }> {
    await this.findOne(id);
    await this.customerRepo.delete(id);
    return { success: true, message: `Customer #${id} deleted successfully` };
  }
}
