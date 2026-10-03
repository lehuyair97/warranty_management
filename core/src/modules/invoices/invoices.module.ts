import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvoiceItemEntity } from '@/database/entities/invoice-item.entity';
import { InvoiceEntity } from '@/database/entities/invoice.entity';
import { PartEntity } from '@/database/entities/part.entity';
import { TicketEntity } from '@/database/entities/ticket.entity';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';

/**
 * Module encapsulating invoice management, parts billing, and cashier checkouts.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      InvoiceEntity,
      InvoiceItemEntity,
      TicketEntity,
      PartEntity,
    ]),
  ],
  controllers: [InvoicesController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
