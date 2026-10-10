import { Test, TestingModule } from '@nestjs/testing';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { TicketStatus } from '@/common/constants';

describe('TicketsController', () => {
  let controller: TicketsController;
  let service: jest.Mocked<TicketsService>;

  beforeEach(async () => {
    const mockService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      getStatusHistory: jest.fn(),
      create: jest.fn(),
      assignTechnician: jest.fn(),
      processTicket: jest.fn(),
      addPart: jest.fn(),
      checkout: jest.fn(),
      remove: jest.fn(),
      trackPublic: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TicketsController],
      providers: [
        {
          provide: TicketsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<TicketsController>(TicketsController);
    service = module.get(TicketsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('processTicket', () => {
    it('should forward processTicket payload to ticketsService.processTicket', async () => {
      const mockResult = { id: 19, status: TicketStatus.REPAIRING } as any;
      service.processTicket.mockResolvedValue(mockResult);

      const dto = {
        status: TicketStatus.REPAIRING,
        faultCause: 'Burnt drain pump motor',
        repairSolution: 'Replaced drain pump assembly',
        estimatedCost: 630000,
      };
      const user = { id: 11, username: 'tech5', role: 'technician' } as any;

      const result = await controller.processTicket(19, dto, user);

      expect(service.processTicket).toHaveBeenCalledWith(19, dto, user);
      expect(result).toEqual(mockResult);
    });
  });

  describe('addPart', () => {
    it('should forward addPart payload to ticketsService.addPart', async () => {
      const mockResult = { id: 19 } as any;
      service.addPart.mockResolvedValue(mockResult);

      const result = await controller.addPart(19, { partId: 8, quantity: 2 });

      expect(service.addPart).toHaveBeenCalledWith(19, 8, 2);
      expect(result).toEqual(mockResult);
    });
  });

  describe('checkout', () => {
    it('should forward checkout payload to ticketsService.checkout', async () => {
      const mockResult = { invoice_id: 10 } as any;
      service.checkout.mockResolvedValue(mockResult);

      const result = await controller.checkout(19, { laborFee: 200000, paymentMethod: 'cash' }, 5);

      expect(service.checkout).toHaveBeenCalledWith(19, 200000, 'cash', 5);
      expect(result).toEqual(mockResult);
    });
  });
});
