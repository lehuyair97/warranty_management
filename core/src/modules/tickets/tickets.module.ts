import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceEntity } from '@/database/entities/device.entity';
import { EmployeeEntity } from '@/database/entities/employee.entity';
import { InvoiceEntity } from '@/database/entities/invoice.entity';
import { TicketEntity } from '@/database/entities/ticket.entity';
import { TicketStatusHistoryEntity } from '@/database/entities/ticket-status-history.entity';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';

/**
 * Module encapsulating ticket workflow processing and status inquiries.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      TicketEntity,
      DeviceEntity,
      EmployeeEntity,
      InvoiceEntity,
      TicketStatusHistoryEntity,
    ]),
  ],
  controllers: [TicketsController],
  providers: [TicketsService],
  exports: [TicketsService],
})
export class TicketsModule {}
