import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomerEntity } from '@/database/entities/customer.entity';

describe('CustomersService', () => {
  let service: CustomersService;
  let customerRepo: {
    findAndCount: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(async () => {
    customerRepo = {
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((customer) => Promise.resolve({ id: 1, ...customer })),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        { provide: getRepositoryToken(CustomerEntity), useValue: customerRepo },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
  });

  it('should return paginated list of customers', async () => {
    customerRepo.findAndCount.mockResolvedValue([
      [{ id: 1, fullName: 'Nguyen Van An', phoneNumber: '0901234501' }],
      1,
    ]);

    const result = await service.findAll({ page: 1, limit: 10, order: 'DESC' });
    expect(result.items.length).toBe(1);
    expect(result.meta.totalItems).toBe(1);
  });

  it('should throw NotFoundException if customer does not exist', async () => {
    customerRepo.findOne.mockResolvedValue(null);
    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });

  it('should find customer by phone number', async () => {
    customerRepo.findOne.mockResolvedValue({ id: 1, phoneNumber: '0901234501' });
    const customer = await service.findByPhone('0901234501');
    expect(customer?.id).toBe(1);
  });

  it('should create a new customer', async () => {
    const dto = { fullName: 'Tran Thi Bich', phoneNumber: '0912345602' };
    const created = await service.create(dto);
    expect(created.id).toBe(1);
    expect(created.fullName).toBe('Tran Thi Bich');
  });
});
