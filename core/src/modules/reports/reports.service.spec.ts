import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CustomerEntity } from '@/database/entities/customer.entity';
import { InvoiceEntity } from '@/database/entities/invoice.entity';
import { PartEntity } from '@/database/entities/part.entity';
import { TicketEntity } from '@/database/entities/ticket.entity';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  let service: ReportsService;
  let mockTicketRepo: any;
  let mockInvoiceRepo: any;
  let mockCustomerRepo: any;
  let mockPartRepo: any;
  let mockDataSource: any;

  beforeEach(async () => {
    mockTicketRepo = {
      count: jest.fn().mockResolvedValue(10),
      createQueryBuilder: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { status: 'received', count: '4' },
          { status: 'completed', count: '6' },
        ]),
      }),
    };

    mockInvoiceRepo = {
      createQueryBuilder: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total: '1500000.00' }),
      }),
    };

    mockCustomerRepo = {
      count: jest.fn().mockResolvedValue(20),
    };

    mockPartRepo = {
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(2),
      }),
    };

    mockDataSource = {
      query: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: getRepositoryToken(TicketEntity),
          useValue: mockTicketRepo,
        },
        {
          provide: getRepositoryToken(InvoiceEntity),
          useValue: mockInvoiceRepo,
        },
        {
          provide: getRepositoryToken(CustomerEntity),
          useValue: mockCustomerRepo,
        },
        {
          provide: getRepositoryToken(PartEntity),
          useValue: mockPartRepo,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDelayedTickets', () => {
    it('should execute sp_alert_delayed_tickets and return recordset', async () => {
      mockDataSource.query.mockResolvedValue([
        {
          ticket_id: 1,
          customer_name: 'Nguyen Van A',
          phone_number: '0901234567',
          device_name: 'Dell XPS',
          status: 'received',
          overdue_days: 18,
          assigned_technician: 'Tech A',
        },
      ]);

      const result = await service.getDelayedTickets(14);
      expect(result).toHaveLength(1);
      expect(result[0].ticket_id).toBe(1);
      expect(mockDataSource.query).toHaveBeenCalledWith(
        'EXEC dbo.sp_alert_delayed_tickets @delay_days = @0;',
        [14],
      );
    });
  });

  describe('auditInvoices', () => {
    it('should execute sp_audit_invoices and return discrepancies count', async () => {
      mockDataSource.query.mockResolvedValue([
        { discrepancies_found: 0, was_auto_fixed: false },
      ]);

      const result = await service.auditInvoices(false);
      expect(result.discrepanciesFound).toBe(0);
      expect(result.wasAutoFixed).toBe(false);
      expect(mockDataSource.query).toHaveBeenCalledWith(
        'EXEC dbo.sp_audit_invoices @auto_fix = @0;',
        [0],
      );
    });
  });

  describe('getDashboardSummary', () => {
    it('should aggregate metrics from repositories and include top technicians', async () => {
      mockDataSource.query.mockImplementation(async (sql: string) => {
        if (sql.includes('completedCount') || sql.includes('technician_id')) {
          return [
            { id: 7, name: 'Phan Anh Viet', totalHandled: '5', completedCount: '4' },
            { id: 8, name: 'Duong Van Xuan', totalHandled: '4', completedCount: '3' },
          ];
        }
        return [];
      });

      const summary = await service.getDashboardSummary();
      expect(summary.overview.totalTickets).toBe(10);
      expect(summary.overview.totalCustomers).toBe(20);
      expect(summary.overview.totalRevenue).toBe(1500000);
      expect(summary.overview.lowStockPartsCount).toBe(2);
      expect(summary.distribution.byStatus).toBeDefined();
      expect(summary.topTechnicians).toBeDefined();
      expect(summary.topTechnicians.length).toBe(2);
      expect(summary.topTechnicians[0].name).toBe('Phan Anh Viet');
      expect(summary.topTechnicians[0].completedCount).toBe(4);
    });
  });
});
