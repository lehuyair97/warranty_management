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
import { AddInvoicePartDto } from './dto/add-invoice-part.dto';
import { CheckoutInvoiceDto } from './dto/checkout-invoice.dto';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
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
      status,
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

    if (status) {
      qb.andWhere('invoice.status = :status', { status });
    }

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
  async create(createDto: CreateInvoiceDto): Promise<InvoiceEntity> {
    const ticket = await this.ticketRepo.findOne({ where: { id: createDto.ticketId } });
    if (!ticket) {
      throw new NotFoundException(`Ticket #${createDto.ticketId} not found`);
    }

    const rawResult: { invoice_id: number }[] = await this.dataSource.query(
      `
      DECLARE @out_id INT;
      EXEC dbo.sp_create_invoice
        @ticket_id = @0,
        @labor_fee = @1,
        @invoice_id = @out_id OUTPUT;
      SELECT @out_id AS invoice_id;
      `,
      [createDto.ticketId, createDto.laborFee || 0],
    );

    const invoiceId = rawResult?.[0]?.invoice_id;
    if (!invoiceId) {
      throw new BadRequestException('Failed to generate invoice from stored procedure');
    }

    return this.findOne(invoiceId);
  }

  /**
   * Adds replacement spare parts to an invoice via stored procedure sp_add_invoice_part.
   * Deducts inventory stock and recalculates invoice totals through DB triggers.
   */
  async addPart(invoiceId: number, addDto: AddInvoicePartDto): Promise<InvoiceEntity> {
    await this.findOne(invoiceId);

    await this.dataSource.query(
      `
      EXEC dbo.sp_add_invoice_part
        @invoice_id = @0,
        @part_id = @1,
        @quantity = @2;
      `,
      [invoiceId, addDto.partId, addDto.quantity || 1],
    );

    return this.findOne(invoiceId);
  }

  /**
   * Removes a replacement spare part from an invoice.
   * Restores inventory stock and recalculates invoice totals through DB trigger trg_invoice_items_stock.
   */
  async removePart(invoiceId: number, partId: number): Promise<InvoiceEntity> {
    await this.findOne(invoiceId);

    await this.dataSource.query(
      `DELETE FROM dbo.invoice_items WHERE invoice_id = @0 AND part_id = @1;`,
      [invoiceId, partId],
    );

    return this.findOne(invoiceId);
  }

  /**
   * Settles invoice payment via stored procedure sp_checkout_invoice.
   * Automatically advances ticket status to DELIVERED once all associated invoices are paid.
   */
  async checkout(invoiceId: number, checkoutDto: CheckoutInvoiceDto): Promise<InvoiceEntity> {
    await this.findOne(invoiceId);

    await this.dataSource.query(
      `
      EXEC dbo.sp_checkout_invoice
        @invoice_id = @0,
        @payment_method = @1;
      `,
      [invoiceId, checkoutDto.paymentMethod],
    );

    return this.findOne(invoiceId);
  }
}
