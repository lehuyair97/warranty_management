import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PartEntity } from './part.entity';
import { TicketEntity } from './ticket.entity';

@Entity({ name: 'ticket_items' })
export class TicketItemEntity {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ name: 'ticket_id', type: 'int' })
  ticketId: number;

  @Column({ name: 'part_id', type: 'int' })
  partId: number;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ name: 'unit_price', type: 'decimal', precision: 18, scale: 2 })
  unitPrice: number;

  @Column({ name: 'total_price', type: 'decimal', precision: 18, scale: 2, insert: false, update: false })
  totalPrice: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => TicketEntity, (ticket) => ticket.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticket_id' })
  ticket: TicketEntity;

  @ManyToOne(() => PartEntity, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'part_id' })
  part: PartEntity;
}
