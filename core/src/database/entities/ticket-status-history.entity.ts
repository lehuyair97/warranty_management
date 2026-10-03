import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EmployeeEntity } from './employee.entity';
import { TicketEntity } from './ticket.entity';

/**
 * Audit trail entity automatically recorded by database trigger trg_tickets_audit_history.
 */
@Entity({ name: 'ticket_status_history' })
@Index('ix_ticket_status_history_ticket_id', ['ticketId'])
export class TicketStatusHistoryEntity {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ name: 'ticket_id', type: 'int' })
  ticketId: number;

  @Column({ name: 'old_status', type: 'varchar', length: 30, nullable: true })
  oldStatus: string | null;

  @Column({ name: 'new_status', type: 'varchar', length: 30 })
  newStatus: string;

  @Column({ name: 'technician_id', type: 'int', nullable: true })
  technicianId: number | null;

  @Column({ type: 'nvarchar', length: 500, nullable: true })
  note: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @ManyToOne(() => TicketEntity, (ticket) => ticket.statusHistory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticket_id' })
  ticket: TicketEntity;

  @ManyToOne(() => EmployeeEntity, { nullable: true })
  @JoinColumn({ name: 'technician_id' })
  technician: EmployeeEntity | null;
}
