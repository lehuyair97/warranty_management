import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { PartsService } from './parts.service';
import { PartEntity } from '@/database/entities/part.entity';

describe('PartsService', () => {
  let service: PartsService;
  let partRepo: {
    findAndCount: jest.Mock;
    findOne: jest.Mock;
    find: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };

  beforeEach(async () => {
    partRepo = {
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((part) => Promise.resolve({ id: 1, ...part })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PartsService,
        { provide: getRepositoryToken(PartEntity), useValue: partRepo },
      ],
    }).compile();

    service = module.get<PartsService>(PartsService);
  });

  it('should find low stock parts below threshold', async () => {
    partRepo.find.mockResolvedValue([
      { id: 10, partName: 'TV Mainboard 4K', stockQuantity: 4 },
      { id: 18, partName: 'AC Inverter PCB', stockQuantity: 5 },
    ]);

    const lowStock = await service.findLowStock(5);
    expect(lowStock.length).toBe(2);
    expect(lowStock[0].stockQuantity).toBeLessThanOrEqual(5);
  });

  it('should throw NotFoundException when part is missing', async () => {
    partRepo.findOne.mockResolvedValue(null);
    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });
});
