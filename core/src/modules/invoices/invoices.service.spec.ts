import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { InvoiceStatus, PaymentMethod } from '@/common/constants';
import { InvoiceEntity } from '@/database/entities/invoice.entity';
import { TicketEntity } from '@/database/entities/ticket.entity';
import { InvoicesService } from './invoices.service';

describe('InvoicesService', () => {
  let service: InvoicesService;
  let mockInvoiceRepo: any;
  let mockTicketRepo: any;
  let mockDataSource: any;

  beforeEach(async () => {
    mockInvoiceRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([
          [
            {
              id: 1,
              status: InvoiceStatus.UNPAID,
              laborFee: 100000,
              totalAmount: 100000,
            },
          ],
          1,
        ]),
      }),
    };

    mockTicketRepo = {
      findOne: jest.fn(),
    };

    mockDataSource = {
      query: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoicesService,
        {
          provide: getRepositoryToken(InvoiceEntity),
          useValue: mockInvoiceRepo,
        },
        {
          provide: getRepositoryToken(TicketEntity),
          useValue: mockTicketRepo,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<InvoicesService>(InvoicesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated invoices', async () => {
      const result = await service.findAll({ page: 1, limit: 10 });
      expect(result.items).toHaveLength(1);
      expect(result.meta.totalItems).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return invoice when found', async () => {
      mockInvoiceRepo.findOne.mockResolvedValue({ id: 1, status: InvoiceStatus.UNPAID });
      const invoice = await service.findOne(1);
      expect(invoice.id).toBe(1);
    });

    it('should throw NotFoundException if invoice does not exist', async () => {
      mockInvoiceRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should execute sp_create_invoice and return generated invoice', async () => {
      mockTicketRepo.findOne.mockResolvedValue({ id: 5 });
      mockDataSource.query.mockResolvedValue([{ invoice_id: 10 }]);
      mockInvoiceRepo.findOne.mockResolvedValue({ id: 10, status: InvoiceStatus.UNPAID });

      const invoice = await service.create({ ticketId: 5, laborFee: 150000 });
      expect(invoice.id).toBe(10);
      expect(mockDataSource.query).toHaveBeenCalled();
    });

    it('should throw NotFoundException if ticket does not exist', async () => {
      mockTicketRepo.findOne.mockResolvedValue(null);
      await expect(service.create({ ticketId: 99, laborFee: 0 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('addPart', () => {
    it('should execute sp_add_invoice_part and return updated invoice', async () => {
      mockInvoiceRepo.findOne.mockResolvedValue({ id: 1, status: InvoiceStatus.UNPAID });
      mockDataSource.query.mockResolvedValue([]);

      const invoice = await service.addPart(1, { partId: 3, quantity: 2 });
      expect(invoice.id).toBe(1);
      expect(mockDataSource.query).toHaveBeenCalled();
    });
  });

  describe('checkout', () => {
    it('should execute sp_checkout_invoice and return updated invoice', async () => {
      mockInvoiceRepo.findOne.mockResolvedValue({ id: 1, status: InvoiceStatus.PAID });
      mockDataSource.query.mockResolvedValue([]);

      const invoice = await service.checkout(1, { paymentMethod: PaymentMethod.CASH });
      expect(invoice.id).toBe(1);
      expect(mockDataSource.query).toHaveBeenCalled();
    });
  });
});
