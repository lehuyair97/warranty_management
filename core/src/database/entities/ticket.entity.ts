import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TicketStatus, TicketType } from '@/common/constants';
import { DeviceEntity } from './device.entity';
import { EmployeeEntity } from './employee.entity';
import { InvoiceEntity } from './invoice.entity';
import { TicketStatusHistoryEntity } from './ticket-status-history.entity';
import { TicketItemEntity } from './ticket-item.entity';

/**
 * Ticket entity representing repair orders.
 */
@Entity({ name: 'tickets' })
@Index('ix_tickets_device_id', ['deviceId'])
@Index('ix_tickets_receptionist_id', ['receptionistId'])
@Index('ix_tickets_technician_id', ['technicianId'])
@Index('ix_tickets_status', ['status'])
@Index('ix_tickets_received_at', ['receivedAt'])
@Index('ix_tickets_status_received_at', ['status', 'receivedAt'])
export class TicketEntity {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ name: 'device_id', type: 'int' })
  deviceId: number;

  @Column({ name: 'receptionist_id', type: 'int' })
  receptionistId: number;

  @Column({ name: 'technician_id', type: 'int', nullable: true })
  technicianId: number | null;

  @Column({ name: 'ticket_type', type: 'varchar', length: 20, default: TicketType.REPAIR })
  ticketType: TicketType;

  @Column({ name: 'issue_description', type: 'nvarchar', length: 500, nullable: true })
  issueDescription: string | null;

  @Column({ name: 'initial_condition', type: 'nvarchar', length: 200, nullable: true })
  initialCondition: string | null;

  @Column({ type: 'nvarchar', length: 200, nullable: true })
  accessories: string | null;

  @Column({ name: 'received_at', type: 'datetime' })
  receivedAt: Date;

  @Column({ name: 'fault_cause', type: 'nvarchar', length: 500, nullable: true })
  faultCause: string | null;

  @Column({ name: 'repair_solution', type: 'nvarchar', length: 500, nullable: true })
  repairSolution: string | null;

  @Column({ name: 'estimated_cost', type: 'decimal', precision: 18, scale: 2, default: 0 })
  estimatedCost: number;

  @Column({ type: 'varchar', length: 30, default: TicketStatus.RECEIVED })
  status: TicketStatus;

  @Column({ name: 'completed_at', type: 'datetime', nullable: true })
  completedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => DeviceEntity, (device) => device.tickets, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'device_id' })
  device: DeviceEntity;

  @ManyToOne(() => EmployeeEntity, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'receptionist_id' })
  receptionist: EmployeeEntity;

  @ManyToOne(() => EmployeeEntity, { onDelete: 'NO ACTION', nullable: true })
  @JoinColumn({ name: 'technician_id' })
  technician: EmployeeEntity | null;

  @OneToMany(() => InvoiceEntity, (invoice) => invoice.ticket)
  invoices: InvoiceEntity[];

  @OneToMany(() => TicketStatusHistoryEntity, (history) => history.ticket)
  statusHistory: TicketStatusHistoryEntity[];

  @OneToMany(() => TicketItemEntity, (item) => item.ticket, { cascade: true })
  items: TicketItemEntity[];
}
