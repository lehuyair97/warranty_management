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
import { PaymentMethod } from '@/common/constants';
import { InvoiceItemEntity } from './invoice-item.entity';
import { TicketEntity } from './ticket.entity';

/**
 * Invoice entity representing billing details for a repair ticket.
 */
@Entity({ name: 'invoices' })
@Index('ix_invoices_ticket_id', ['ticketId'])
@Index('ix_invoices_created_at', ['createdAt'])
export class InvoiceEntity {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ name: 'ticket_id', type: 'int' })
  ticketId: number;

  @Column({ name: 'labor_fee', type: 'decimal', precision: 18, scale: 2, default: 0 })
  laborFee: number;

  @Column({ name: 'discount_amount', type: 'decimal', precision: 18, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ name: 'payment_method', type: 'varchar', length: 30, nullable: true })
  paymentMethod: PaymentMethod | null;

  @Column({ name: 'paid_at', type: 'datetime', nullable: true })
  paidAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => TicketEntity, (ticket) => ticket.invoices, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'ticket_id' })
  ticket: TicketEntity;

  @OneToMany(() => InvoiceItemEntity, (item) => item.invoice, { cascade: true })
  items: InvoiceItemEntity[];
}
