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
import { CustomerEntity } from './customer.entity';
import { TicketEntity } from './ticket.entity';

/**
 * Device entity representing physical equipment brought for repair.
 */
@Entity({ name: 'devices' })
@Index('uq_devices_serial_number', ['serialNumber'], { unique: true })
@Index('ix_devices_customer_id', ['customerId'])
export class DeviceEntity {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ name: 'customer_id', type: 'int' })
  customerId: number;

  @Column({ name: 'device_name', type: 'nvarchar', length: 100 })
  deviceName: string;

  @Column({ name: 'device_type', type: 'nvarchar', length: 50, nullable: true })
  deviceType: string | null;

  @Column({ type: 'nvarchar', length: 50, nullable: true })
  brand: string | null;

  @Column({ name: 'serial_number', type: 'varchar', length: 50, nullable: true })
  serialNumber: string | null;

  @Column({ name: 'is_under_warranty', type: 'bit', default: false })
  isUnderWarranty: boolean;

  @Column({ name: 'warranty_expiry_date', type: 'date', nullable: true })
  warrantyExpiryDate: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => CustomerEntity, (customer) => customer.devices, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'customer_id' })
  customer: CustomerEntity;

  @OneToMany(() => TicketEntity, (ticket) => ticket.device)
  tickets: TicketEntity[];
}
