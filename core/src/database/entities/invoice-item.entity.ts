import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { InvoiceEntity } from './invoice.entity';
import { PartEntity } from './part.entity';

/**
 * InvoiceItem entity representing individual parts attached to an invoice.
 */
@Entity({ name: 'invoice_items' })
@Index('ix_invoice_items_invoice_id', ['invoiceId'])
@Index('ix_invoice_items_part_id', ['partId'])
export class InvoiceItemEntity {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ name: 'invoice_id', type: 'int' })
  invoiceId: number;

  @Column({ name: 'part_id', type: 'int' })
  partId: number;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ name: 'unit_price', type: 'decimal', precision: 18, scale: 2 })
  unitPrice: number;

  // Persisted computed column in MSSQL
  @Column({ name: 'total_price', type: 'decimal', precision: 18, scale: 2, insert: false, update: false })
  totalPrice: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => InvoiceEntity, (invoice) => invoice.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invoice_id' })
  invoice: InvoiceEntity;

  @ManyToOne(() => PartEntity, (part) => part.invoiceItems, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'part_id' })
  part: PartEntity;
}
