import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerEntity } from '@/database/entities/customer.entity';
import { InvoiceEntity } from '@/database/entities/invoice.entity';
import { PartEntity } from '@/database/entities/part.entity';
import { TicketEntity } from '@/database/entities/ticket.entity';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

/**
 * Module providing reporting services, data audits, and executive business summaries.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      TicketEntity,
      InvoiceEntity,
      CustomerEntity,
      PartEntity,
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
