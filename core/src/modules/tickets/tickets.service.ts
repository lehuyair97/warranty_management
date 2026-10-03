import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { EmployeeRole, TicketStatus } from '@/common/constants';
import { PaginatedResultDto } from '@/common/dto/paginated-result.dto';
import {
  checkCanTransitionStatus,
  formatTicketCode,
  maskPhoneNumber,
  parseTicketCode,
} from '@/common/helpers/ticket-flow.helper';
import { buildPaginationMeta } from '@/common/utils/pagination.util';
import { DeviceEntity } from '@/database/entities/device.entity';
import { EmployeeEntity } from '@/database/entities/employee.entity';
import { InvoiceEntity } from '@/database/entities/invoice.entity';
import { TicketEntity } from '@/database/entities/ticket.entity';
import { AssignTechnicianDto } from './dto/assign-technician.dto';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { ProcessTicketDto } from './dto/process-ticket.dto';
import { TicketQueryDto } from './dto/ticket-query.dto';

/**
 * Service orchestrating repair ticket lifecycles, technician assignments,
 * diagnosis records, and public status tracking.
 */
@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(TicketEntity)
    private readonly ticketRepo: Repository<TicketEntity>,
    @InjectRepository(DeviceEntity)
    private readonly deviceRepo: Repository<DeviceEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepo: Repository<EmployeeEntity>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Retrieves a paginated list of tickets with optional status, technician, device, or customer filters.
   */
  async findAll(query: TicketQueryDto): Promise<PaginatedResultDto<TicketEntity>> {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      ticketType,
      technicianId,
      customerId,
      deviceId,
      order = 'DESC',
    } = query;
    const skip = (page - 1) * limit;

    const qb = this.ticketRepo
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.device', 'device')
      .leftJoinAndSelect('device.customer', 'customer')
      .leftJoinAndSelect('ticket.receptionist', 'receptionist')
      .leftJoinAndSelect('ticket.technician', 'technician')
      .leftJoinAndSelect('ticket.invoices', 'invoices')
      .leftJoinAndSelect('invoices.items', 'invoiceItems')
      .leftJoinAndSelect('invoiceItems.part', 'part');

    if (status) {
      qb.andWhere('ticket.status = :status', { status });
    }

    if (ticketType) {
      qb.andWhere('ticket.ticketType = :ticketType', { ticketType });
    }

    if (technicianId) {
      qb.andWhere('ticket.technicianId = :technicianId', { technicianId });
    }

    if (deviceId) {
      qb.andWhere('ticket.deviceId = :deviceId', { deviceId });
    }

    if (customerId) {
      qb.andWhere('customer.id = :customerId', { customerId });
    }

    if (search) {
      const parsedId = parseTicketCode(search);
      if (parsedId) {
        qb.andWhere('(ticket.id = :parsedId OR customer.phoneNumber LIKE :search OR customer.fullName LIKE :search OR device.serialNumber LIKE :search)', {
          parsedId,
          search: `%${search}%`,
        });
      } else {
        qb.andWhere('(customer.phoneNumber LIKE :search OR customer.fullName LIKE :search OR device.serialNumber LIKE :search OR device.deviceName LIKE :search)', {
          search: `%${search}%`,
        });
      }
    }

    qb.orderBy('ticket.id', order).skip(skip).take(limit);

    const [items, total] = await qb.getManyAndCount();
    const meta = buildPaginationMeta(total, page, limit);

    return new PaginatedResultDto(items, meta);
  }

  /**
   * Retrieves ticket details by primary key with relations.
   */
  async findOne(id: number): Promise<TicketEntity> {
    const ticket = await this.ticketRepo.findOne({
      where: { id },
      relations: [
        'device',
        'device.customer',
        'receptionist',
        'technician',
        'invoices',
        'invoices.items',
        'invoices.items.part',
      ],
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket #${id} not found`);
    }

    return ticket;
  }

  /**
   * Receives a device and generates a new repair ticket via stored procedure sp_receive_device.
   */
  async create(receptionistId: number, createDto: CreateTicketDto): Promise<TicketEntity> {
    const device = await this.deviceRepo.findOne({ where: { id: createDto.deviceId } });
    if (!device) {
      throw new NotFoundException(`Device #${createDto.deviceId} not found`);
    }

    const employee = await this.employeeRepo.findOne({
      where: {
        id: receptionistId,
        role: In([EmployeeRole.RECEPTIONIST, EmployeeRole.MANAGER]),
      },
    });
    if (!employee) {
      throw new ForbiddenException(
        'Only receptionist or manager employees can receive devices and create tickets',
      );
    }

    // Call T-SQL Stored Procedure dbo.sp_receive_device
    const rawResult: { ticket_id: number }[] = await this.dataSource.query(
      `
      DECLARE @out_id INT;
      EXEC dbo.sp_receive_device
        @device_id = @0,
        @receptionist_id = @1,
        @issue_description = @2,
        @initial_condition = @3,
        @accessories = @4,
        @ticket_type = @5,
        @ticket_id = @out_id OUTPUT;
      SELECT @out_id AS ticket_id;
      `,
      [
        createDto.deviceId,
        receptionistId,
        createDto.issueDescription,
        createDto.initialCondition || null,
        createDto.accessories || null,
        createDto.ticketType || 'repair',
      ],
    );

    const generatedId = rawResult?.[0]?.ticket_id;
    if (!generatedId) {
      throw new BadRequestException('Failed to generate ticket from stored procedure');
    }

    return this.findOne(generatedId);
  }

  /**
   * Assigns a technician to a repair ticket and transitions status to INSPECTING if currently RECEIVED.
   */
  async assignTechnician(ticketId: number, assignDto: AssignTechnicianDto): Promise<TicketEntity> {
    const ticket = await this.findOne(ticketId);

    const technician = await this.employeeRepo.findOne({
      where: { id: assignDto.technicianId, role: EmployeeRole.TECHNICIAN, isActive: true },
    });
    if (!technician) {
      throw new BadRequestException(`Technician #${assignDto.technicianId} is invalid or inactive`);
    }

    const nextStatus =
      ticket.status === TicketStatus.RECEIVED ? TicketStatus.INSPECTING : ticket.status;

    await this.dataSource.query(
      `
      EXEC dbo.sp_process_ticket
        @ticket_id = @0,
        @status = @1,
        @technician_id = @2;
      `,
      [ticketId, nextStatus, assignDto.technicianId],
    );

    return this.findOne(ticketId);
  }

  /**
   * Updates technical diagnosis, repair solution, quote estimate, and advances lifecycle status.
   */
  async processTicket(ticketId: number, processDto: ProcessTicketDto): Promise<TicketEntity> {
    const ticket = await this.findOne(ticketId);

    const canTransition = checkCanTransitionStatus(ticket.status, processDto.status);
    if (!canTransition) {
      throw new BadRequestException(
        `Invalid status transition from '${ticket.status}' to '${processDto.status}'`,
      );
    }

    if (processDto.technicianId) {
      const technician = await this.employeeRepo.findOne({
        where: { id: processDto.technicianId, role: EmployeeRole.TECHNICIAN, isActive: true },
      });
      if (!technician) {
        throw new BadRequestException(`Technician #${processDto.technicianId} is invalid or inactive`);
      }
    }

    await this.dataSource.query(
      `
      EXEC dbo.sp_process_ticket
        @ticket_id = @0,
        @status = @1,
        @technician_id = @2,
        @fault_cause = @3,
        @repair_solution = @4,
        @estimated_cost = @5;
      `,
      [
        ticketId,
        processDto.status,
        processDto.technicianId || null,
        processDto.faultCause || null,
        processDto.repairSolution || null,
        processDto.estimatedCost !== undefined ? processDto.estimatedCost : null,
      ],
    );

    return this.findOne(ticketId);
  }

  /**
   * Public tracking lookup by ticket code and registered customer phone number.
   * Does not require authentication. Sensitive fields are masked.
   */
  async trackPublic(ticketCode: string, phoneNumber: string) {
    const parsedId = parseTicketCode(ticketCode);
    if (!parsedId) {
      throw new BadRequestException('Invalid ticket code format');
    }

    const cleanPhone = (phoneNumber || '').trim();
    if (!cleanPhone) {
      throw new BadRequestException('Phone number is required');
    }

    const ticket = await this.ticketRepo
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.device', 'device')
      .leftJoinAndSelect('device.customer', 'customer')
      .leftJoinAndSelect('ticket.technician', 'technician')
      .leftJoinAndSelect('ticket.invoices', 'invoices')
      .where('ticket.id = :id', { id: parsedId })
      .andWhere('customer.phoneNumber = :phone', { phone: cleanPhone })
      .getOne();

    if (!ticket) {
      throw new NotFoundException('No matching ticket found for provided code and phone number');
    }

    return {
      ticketId: ticket.id,
      ticketCode: formatTicketCode(ticket.id),
      status: ticket.status,
      ticketType: ticket.ticketType,
      receivedAt: ticket.receivedAt,
      completedAt: ticket.completedAt,
      issueDescription: ticket.issueDescription,
      faultCause: ticket.faultCause,
      repairSolution: ticket.repairSolution,
      estimatedCost: Number(ticket.estimatedCost),
      device: {
        deviceName: ticket.device.deviceName,
        deviceType: ticket.device.deviceType,
        brand: ticket.device.brand,
        serialNumber: ticket.device.serialNumber,
      },
      customer: {
        fullName: ticket.device.customer.fullName,
        maskedPhone: maskPhoneNumber(ticket.device.customer.phoneNumber),
      },
      technician: ticket.technician
        ? {
            fullName: ticket.technician.fullName,
          }
        : null,
      invoices: ticket.invoices.map((inv) => ({
        id: inv.id,
        status: inv.status,
        laborFee: Number(inv.laborFee),
        discountAmount: Number(inv.discountAmount),
        totalAmount: Number(inv.totalAmount),
        paymentMethod: inv.paymentMethod,
        paidAt: inv.paidAt,
      })),
    };
  }

  /**
   * Deletes a repair ticket and associated unpaid invoices if no payment was made.
   */
  async remove(id: number): Promise<{ success: boolean; message: string }> {
    const ticket = await this.findOne(id);
    const hasPaidInvoice = ticket.invoices?.some((inv) => inv.status === 'paid');
    if (hasPaidInvoice) {
      throw new BadRequestException('Không thể xóa phiếu sửa chữa đã phát sinh hóa đơn đã thanh toán.');
    }

    await this.dataSource.transaction(async (manager) => {
      const invoices = await manager.find(InvoiceEntity, {
        where: { ticketId: id },
        relations: ['items'],
      });
      for (const inv of invoices) {
        if (inv.items && inv.items.length > 0) {
          await manager.remove(inv.items);
        }
        await manager.remove(inv);
      }
      await manager.remove(ticket);
    });

    return {
      success: true,
      message: `Phiếu sửa chữa #${formatTicketCode(id)} đã được xóa thành công.`,
    };
  }
}
