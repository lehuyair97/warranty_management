import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Like, Repository } from 'typeorm';
import { EmployeeRole } from '@/common/constants';
import { PaginatedResultDto } from '@/common/dto/paginated-result.dto';
import { hashPassword } from '@/common/utils/crypto.util';
import { buildPaginationMeta } from '@/common/utils/pagination.util';
import { EmployeeEntity } from '@/database/entities/employee.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { EmployeeQueryDto } from './dto/employee-query.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

/**
 * Service managing employee accounts and staff allocations.
 */
@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepo: Repository<EmployeeEntity>,
  ) {}

  /**
   * Retrieves a paginated list of employees with optional role, active status, and search filters.
   */
  async findAll(query: EmployeeQueryDto): Promise<PaginatedResultDto<EmployeeEntity>> {
    const { page = 1, limit = 10, search, role, isActive } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.employeeRepo.createQueryBuilder('employee');

    if (role) {
      queryBuilder.andWhere('employee.role = :role', { role });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('employee.isActive = :isActive', { isActive });
    }

    if (search) {
      queryBuilder.andWhere(
        '(employee.fullName LIKE :search OR employee.username LIKE :search OR employee.phoneNumber LIKE :search OR employee.email LIKE :search)',
        { search: `%${search}%` },
      );
    }

    queryBuilder
      .orderBy('employee.id', 'ASC')
      .skip(skip)
      .take(limit);

    const [items, total] = await queryBuilder.getManyAndCount();
    const meta = buildPaginationMeta(total, page, limit);

    return new PaginatedResultDto(items, meta);
  }

  /**
   * Finds an active list of technicians for ticket assignment dropdowns.
   */
  async findTechnicians(): Promise<EmployeeEntity[]> {
    return this.employeeRepo.find({
      where: {
        role: EmployeeRole.TECHNICIAN,
        isActive: true,
      },
      order: {
        fullName: 'ASC',
      },
    });
  }

  /**
   * Finds a single employee by primary key identifier.
   */
  async findOne(id: number): Promise<EmployeeEntity> {
    const employee = await this.employeeRepo.findOne({
      where: { id },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    return employee;
  }

  /**
   * Registers a new employee into the system.
   */
  async create(createDto: CreateEmployeeDto): Promise<EmployeeEntity> {
    const existing = await this.employeeRepo.findOne({
      where: { username: createDto.username },
    });

    if (existing) {
      throw new ConflictException(`Username '${createDto.username}' is already in use`);
    }

    const passwordHash = await hashPassword(createDto.password);

    const newEmployee = this.employeeRepo.create({
      username: createDto.username,
      passwordHash,
      fullName: createDto.fullName,
      role: createDto.role,
      phoneNumber: createDto.phoneNumber ?? null,
      email: createDto.email ?? null,
      isActive: createDto.isActive ?? true,
    });

    return this.employeeRepo.save(newEmployee);
  }

  /**
   * Updates an existing employee profile or credentials.
   */
  async update(id: number, updateDto: UpdateEmployeeDto): Promise<EmployeeEntity> {
    const employee = await this.findOne(id);

    if (updateDto.password) {
      employee.passwordHash = await hashPassword(updateDto.password);
    }

    if (updateDto.fullName !== undefined) {
      employee.fullName = updateDto.fullName;
    }

    if (updateDto.role !== undefined) {
      employee.role = updateDto.role;
    }

    if (updateDto.phoneNumber !== undefined) {
      employee.phoneNumber = updateDto.phoneNumber;
    }

    if (updateDto.email !== undefined) {
      employee.email = updateDto.email;
    }

    if (updateDto.isActive !== undefined) {
      employee.isActive = updateDto.isActive;
    }

    return this.employeeRepo.save(employee);
  }

  /**
   * Deactivates an employee account instead of hard deleting to preserve audit history.
   */
  async deactivate(id: number): Promise<EmployeeEntity> {
    const employee = await this.findOne(id);
    employee.isActive = false;
    employee.refreshTokenHash = null; // Invalidate current session
    return this.employeeRepo.save(employee);
  }
}
