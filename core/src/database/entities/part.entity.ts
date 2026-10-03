import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { InvoiceItemEntity } from './invoice-item.entity';

/**
 * Part entity representing spare components in inventory.
 */
@Entity({ name: 'parts' })
@Index('ix_parts_part_name', ['partName'])
@Index('ix_parts_stock_quantity', ['stockQuantity'])
export class PartEntity {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ name: 'part_name', type: 'nvarchar', length: 100 })
  partName: string;

  @Column({ type: 'varchar', length: 20 })
  unit: string;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  price: number;

  @Column({ name: 'stock_quantity', type: 'int' })
  stockQuantity: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => InvoiceItemEntity, (item) => item.part)
  invoiceItems: InvoiceItemEntity[];
}
