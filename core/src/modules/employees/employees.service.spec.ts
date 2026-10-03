import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EmployeeRole } from '@/common/constants';
import { EmployeeEntity } from '@/database/entities/employee.entity';
import { EmployeesService } from './employees.service';

describe('EmployeesService', () => {
  let service: EmployeesService;
  let mockEmployeeRepo: any;

  beforeEach(async () => {
    mockEmployeeRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((item) => Promise.resolve({ id: 1, ...item })),
      createQueryBuilder: jest.fn().mockReturnValue({
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([
          [
            { id: 1, username: 'tech_huy', role: EmployeeRole.TECHNICIAN, fullName: 'Huy Le' },
          ],
          1,
        ]),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeesService,
        {
          provide: getRepositoryToken(EmployeeEntity),
          useValue: mockEmployeeRepo,
        },
      ],
    }).compile();

    service = module.get<EmployeesService>(EmployeesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated employees', async () => {
      const result = await service.findAll({ page: 1, limit: 10 });
      expect(result.items).toHaveLength(1);
      expect(result.meta.totalItems).toBe(1);
    });
  });

  describe('findTechnicians', () => {
    it('should return active technicians', async () => {
      mockEmployeeRepo.find.mockResolvedValue([
        { id: 1, username: 'tech_huy', role: EmployeeRole.TECHNICIAN, isActive: true },
      ]);

      const technicians = await service.findTechnicians();
      expect(technicians).toHaveLength(1);
      expect(technicians[0].role).toBe(EmployeeRole.TECHNICIAN);
    });
  });

  describe('findOne', () => {
    it('should return employee if found', async () => {
      mockEmployeeRepo.findOne.mockResolvedValue({ id: 1, username: 'tech_huy' });
      const employee = await service.findOne(1);
      expect(employee.id).toBe(1);
    });

    it('should throw NotFoundException if employee does not exist', async () => {
      mockEmployeeRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create employee if username is unique', async () => {
      mockEmployeeRepo.findOne.mockResolvedValue(null);

      const result = await service.create({
        username: 'new_user',
        password: 'password123',
        fullName: 'New User',
        role: EmployeeRole.RECEPTIONIST,
      });

      expect(result).toBeDefined();
      expect(mockEmployeeRepo.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if username already exists', async () => {
      mockEmployeeRepo.findOne.mockResolvedValue({ id: 2, username: 'new_user' });

      await expect(
        service.create({
          username: 'new_user',
          password: 'password123',
          fullName: 'New User',
          role: EmployeeRole.RECEPTIONIST,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('deactivate', () => {
    it('should deactivate employee and clear token hash', async () => {
      mockEmployeeRepo.findOne.mockResolvedValue({
        id: 1,
        username: 'tech_huy',
        isActive: true,
        refreshTokenHash: 'hash',
      });

      const result = await service.deactivate(1);
      expect(result.isActive).toBe(false);
      expect(result.refreshTokenHash).toBeNull();
    });
  });
});
