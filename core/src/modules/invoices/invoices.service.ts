import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PaginatedResultDto } from '@/common/dto/paginated-result.dto';
import { buildPaginationMeta } from '@/common/utils/pagination.util';
import { InvoiceEntity } from '@/database/entities/invoice.entity';
import { TicketEntity } from '@/database/entities/ticket.entity';
import { InvoiceQueryDto } from './dto/invoice-query.dto';

/**
 * Service managing billing invoices, spare part attachments, and payment checkout settlement.
 */
@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(InvoiceEntity)
    private readonly invoiceRepo: Repository<InvoiceEntity>,
    @InjectRepository(TicketEntity)
    private readonly ticketRepo: Repository<TicketEntity>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Retrieves a paginated list of invoices with customer and device associations.
   */
  async findAll(query: InvoiceQueryDto): Promise<PaginatedResultDto<InvoiceEntity>> {
    const {
      page = 1,
      limit = 10,
      search,
      paymentMethod,
      ticketId,
      order = 'DESC',
    } = query;
    const skip = (page - 1) * limit;

    const qb = this.invoiceRepo
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.ticket', 'ticket')
      .leftJoinAndSelect('ticket.device', 'device')
      .leftJoinAndSelect('device.customer', 'customer')
      .leftJoinAndSelect('invoice.items', 'items')
      .leftJoinAndSelect('items.part', 'part');

    
    if (paymentMethod) {
      qb.andWhere('invoice.paymentMethod = :paymentMethod', { paymentMethod });
    }

    if (ticketId) {
      qb.andWhere('invoice.ticketId = :ticketId', { ticketId });
    }

    if (search) {
      qb.andWhere(
        '(customer.phoneNumber LIKE :search OR customer.fullName LIKE :search OR device.serialNumber LIKE :search)',
        { search: `%${search}%` },
      );
    }

    qb.orderBy('invoice.id', order).skip(skip).take(limit);

    const [items, total] = await qb.getManyAndCount();
    const meta = buildPaginationMeta(total, page, limit);

    return new PaginatedResultDto(items, meta);
  }

  /**
   * Finds an invoice by its primary key with complete itemized parts and customer context.
   */
  async findOne(id: number): Promise<InvoiceEntity> {
    const invoice = await this.invoiceRepo.findOne({
      where: { id },
      relations: [
        'ticket',
        'ticket.device',
        'ticket.device.customer',
        'ticket.technician',
        'items',
        'items.part',
      ],
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice #${id} not found`);
    }

    return invoice;
  }

  /**
   * Retrieves all invoices tied to a specific ticket.
   */
  async findByTicketId(ticketId: number): Promise<InvoiceEntity[]> {
    return this.invoiceRepo.find({
      where: { ticketId },
      relations: ['items', 'items.part'],
      order: { id: 'DESC' },
    });
  }

  /**
   * Creates an invoice using stored procedure sp_create_invoice.
   * Stored procedure handles automatic warranty 100% labor discount.
   */
  /**
   * Settles invoice payment via stored procedure sp_checkout_invoice.
   * Automatically advances ticket status to DELIVERED once all associated invoices are paid.
   */

}
