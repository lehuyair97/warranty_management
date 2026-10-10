import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { EmployeeRole, TicketStatus, TicketType } from '@/common/constants';
import { DeviceEntity } from '@/database/entities/device.entity';
import { EmployeeEntity } from '@/database/entities/employee.entity';
import { TicketEntity } from '@/database/entities/ticket.entity';
import { TicketStatusHistoryEntity } from '@/database/entities/ticket-status-history.entity';
import { TicketsService } from './tickets.service';

describe('TicketsService', () => {
  let service: TicketsService;
  let mockTicketRepo: any;
  let mockDeviceRepo: any;
  let mockEmployeeRepo: any;
  let mockStatusHistoryRepo: any;
  let mockDataSource: any;

  beforeEach(async () => {
    mockTicketRepo = {
      findOne: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([
          [
            {
              id: 1,
              status: TicketStatus.RECEIVED,
              ticketType: TicketType.REPAIR,
              device: { id: 1, deviceName: 'MacBook Pro' },
            },
          ],
          1,
        ]),
        getOne: jest.fn(),
      }),
    };

    mockDeviceRepo = {
      findOne: jest.fn(),
    };

    mockEmployeeRepo = {
      findOne: jest.fn(),
    };

    mockStatusHistoryRepo = {
      save: jest.fn().mockResolvedValue({ id: 1 }),
      create: jest.fn().mockReturnValue({ id: 1 }),
      find: jest.fn().mockResolvedValue([]),
    };

    mockDataSource = {
      query: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        {
          provide: getRepositoryToken(TicketEntity),
          useValue: mockTicketRepo,
        },
        {
          provide: getRepositoryToken(DeviceEntity),
          useValue: mockDeviceRepo,
        },
        {
          provide: getRepositoryToken(EmployeeEntity),
          useValue: mockEmployeeRepo,
        },
        {
          provide: getRepositoryToken(TicketStatusHistoryEntity),
          useValue: mockStatusHistoryRepo,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated tickets', async () => {
      const result = await service.findAll({ page: 1, limit: 10 });
      expect(result.items).toHaveLength(1);
      expect(result.meta.totalItems).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return ticket if found', async () => {
      mockTicketRepo.findOne.mockResolvedValue({ id: 1, status: TicketStatus.RECEIVED });
      const ticket = await service.findOne(1);
      expect(ticket.id).toBe(1);
    });

    it('should throw NotFoundException if ticket does not exist', async () => {
      mockTicketRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should successfully execute sp_receive_device when receptionist creates ticket', async () => {
      mockDeviceRepo.findOne.mockResolvedValue({ id: 1 });
      mockEmployeeRepo.findOne.mockResolvedValue({ id: 2, role: EmployeeRole.RECEPTIONIST });
      mockDataSource.query.mockResolvedValue([{ ticket_id: 10 }]);
      mockTicketRepo.findOne.mockResolvedValue({ id: 10, status: TicketStatus.RECEIVED });

      const result = await service.create(2, {
        deviceId: 1,
        issueDescription: 'Battery drain fast',
      });

      expect(result.id).toBe(10);
      expect(mockDataSource.query).toHaveBeenCalled();
    });

    it('should successfully execute sp_receive_device when manager creates ticket', async () => {
      mockDeviceRepo.findOne.mockResolvedValue({ id: 1 });
      mockEmployeeRepo.findOne.mockResolvedValue({ id: 1, role: EmployeeRole.MANAGER });
      mockDataSource.query.mockResolvedValue([{ ticket_id: 11 }]);
      mockTicketRepo.findOne.mockResolvedValue({ id: 11, status: TicketStatus.RECEIVED });

      const result = await service.create(1, {
        deviceId: 1,
        issueDescription: 'Battery drain fast',
      });

      expect(result.id).toBe(11);
      expect(mockDataSource.query).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user is neither receptionist nor manager', async () => {
      mockDeviceRepo.findOne.mockResolvedValue({ id: 1 });
      mockEmployeeRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create(5, {
          deviceId: 1,
          issueDescription: 'Broken screen',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('assignTechnician', () => {
    it('should allow manager or receptionist to assign technician', async () => {
      mockTicketRepo.findOne
        .mockResolvedValueOnce({ id: 1, status: TicketStatus.RECEIVED, technicianId: null })
        .mockResolvedValueOnce({ id: 1, status: TicketStatus.INSPECTING, technicianId: 7 });

      mockEmployeeRepo.findOne.mockResolvedValue({ id: 7, role: EmployeeRole.TECHNICIAN, isActive: true });
      mockDataSource.query.mockResolvedValue([]);

      const result = await service.assignTechnician(
        1,
        { technicianId: 7 },
        { id: 2, username: 'reception1', role: EmployeeRole.RECEPTIONIST, full_name: 'Receptionist' },
      );

      expect(mockDataSource.query).toHaveBeenCalled();
      expect(result.id).toBe(1);
    });

    it('should forbid technician from assigning another technician', async () => {
      mockTicketRepo.findOne.mockResolvedValue({ id: 1, status: TicketStatus.RECEIVED, technicianId: null });

      await expect(
        service.assignTechnician(
          1,
          { technicianId: 8 },
          { id: 7, username: 'tech1', role: EmployeeRole.TECHNICIAN, full_name: 'Tech 1' },
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should forbid technician from reassigning an already assigned ticket', async () => {
      mockTicketRepo.findOne.mockResolvedValue({ id: 1, status: TicketStatus.INSPECTING, technicianId: 7 });

      await expect(
        service.assignTechnician(
          1,
          { technicianId: 7 },
          { id: 7, username: 'tech1', role: EmployeeRole.TECHNICIAN, full_name: 'Tech 1' },
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('processTicket', () => {
    it('should execute procedure when transition is valid', async () => {
      mockTicketRepo.findOne
        .mockResolvedValueOnce({ id: 1, status: TicketStatus.RECEIVED, technicianId: null })
        .mockResolvedValueOnce({ id: 1, status: TicketStatus.INSPECTING, technicianId: 3 });

      mockEmployeeRepo.findOne.mockResolvedValue({ id: 3, role: EmployeeRole.TECHNICIAN, isActive: true });
      mockDataSource.query.mockResolvedValue([]);

      const result = await service.processTicket(1, {
        status: TicketStatus.INSPECTING,
        technicianId: 3,
        faultCause: 'Blown capacitor',
      });

      expect(result.status).toBe(TicketStatus.INSPECTING);
      expect(mockDataSource.query).toHaveBeenCalled();
    });

    it('should reject invalid status transition', async () => {
      mockTicketRepo.findOne.mockResolvedValue({ id: 1, status: TicketStatus.RECEIVED, technicianId: null });

      await expect(
        service.processTicket(1, {
          status: TicketStatus.DELIVERED,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should forbid technician from modifying another technician ticket', async () => {
      mockTicketRepo.findOne.mockResolvedValue({ id: 1, status: TicketStatus.INSPECTING, technicianId: 8 });

      await expect(
        service.processTicket(
          1,
          { status: TicketStatus.REPAIRING },
          { id: 7, username: 'tech1', role: EmployeeRole.TECHNICIAN, full_name: 'Tech 1' },
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('trackPublic', () => {
    it('should return masked public tracking payload when code and phone match', async () => {
      const qb = mockTicketRepo.createQueryBuilder();
      qb.getOne.mockResolvedValue({
        id: 15,
        status: TicketStatus.REPAIRING,
        ticketType: TicketType.REPAIR,
        receivedAt: new Date(),
        completedAt: null,
        issueDescription: 'No power',
        faultCause: 'Short on power rail',
        repairSolution: 'Replace MOSFET',
        estimatedCost: 500000,
        device: {
          deviceName: 'Dell XPS 15',
          model: '9520',
          serialNumber: 'DL12345',
          customer: {
            fullName: 'Nguyen Van A',
            phoneNumber: '0901234567',
          },
        },
        technician: {
          fullName: 'Tran Van Tech',
        },
        invoices: [],
      });

      const tracking = await service.trackPublic('TK-0015', '0901234567');
      expect(tracking.ticketId).toBe(15);
      expect(tracking.ticketCode).toBe('TK-0015');
      expect(tracking.customer.maskedPhone).toBe('09****4567');
      expect(tracking.device.deviceName).toBe('Dell XPS 15');
    });

    it('should throw NotFoundException when no ticket matches phone number', async () => {
      const qb = mockTicketRepo.createQueryBuilder();
      qb.getOne.mockResolvedValue(null);

      await expect(service.trackPublic('TK-0015', '0999999999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('addPart', () => {
    it('should execute dbo.sp_add_ticket_part and return ticket', async () => {
      mockDataSource.query.mockResolvedValue([{ ticket_id: 1 }]);
      mockTicketRepo.findOne.mockResolvedValue({ id: 1, items: [] });

      const result = await service.addPart(1, 2, 3);
      expect(result).toBeDefined();
      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('dbo.sp_add_ticket_part'),
        [1, 2, 3],
      );
    });
  });

  describe('checkout', () => {
    it('should execute dbo.sp_checkout_ticket and return invoice result', async () => {
      mockDataSource.query.mockResolvedValue([{ invoice_id: 10 }]);

      const result = await service.checkout(1, 200000, 'cash', 5);
      expect(result).toEqual({ invoice_id: 10 });
      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('dbo.sp_checkout_ticket'),
        [1, 200000, 'cash', 5],
      );
    });

    it('should throw NotFoundException when checkout returns empty', async () => {
      mockDataSource.query.mockResolvedValue([]);

      await expect(service.checkout(1, 200000, 'cash', 5)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
