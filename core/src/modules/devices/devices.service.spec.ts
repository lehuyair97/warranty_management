import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { DeviceEntity } from '@/database/entities/device.entity';

describe('DevicesService', () => {
  let service: DevicesService;
  let deviceRepo: {
    findAndCount: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let dataSource: { query: jest.Mock };

  beforeEach(async () => {
    deviceRepo = {
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((device) => Promise.resolve({ id: 1, ...device })),
    };

    dataSource = {
      query: jest.fn().mockResolvedValue([
        { ticket_id: 1, fault_cause: 'Dead battery', repair_solution: 'Battery replacement' },
      ]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DevicesService,
        { provide: getRepositoryToken(DeviceEntity), useValue: deviceRepo },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<DevicesService>(DevicesService);
  });

  it('should find device by serial number', async () => {
    deviceRepo.findOne.mockResolvedValue({ id: 1, serialNumber: 'DL3520A1001' });
    const device = await service.findBySerial('DL3520A1001');
    expect(device?.serialNumber).toBe('DL3520A1001');
  });

  it('should check active warranty status correctly', async () => {
    deviceRepo.findOne.mockResolvedValue({
      id: 2,
      isUnderWarranty: true,
      warrantyExpiryDate: '2027-11-20',
    });

    const status = await service.checkWarranty(2, new Date('2026-10-02'));
    expect(status.isUnderWarranty).toBe(true);
  });

  it('should query repair history using TVF', async () => {
    deviceRepo.findOne.mockResolvedValue({ id: 1 });
    const history = await service.getRepairHistory(1);
    expect(history.length).toBe(1);
    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('fn_get_device_repair_history'),
      [1],
    );
  });
});
