import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { PaymentMethod } from '@/common/constants';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';

/**
 * Filter parameters for querying invoices.
 */
export class InvoiceQueryDto extends PaginationQueryDto {

  @ApiPropertyOptional({
    description: 'Filter by payment method',
    enum: PaymentMethod,
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({
    description: 'Filter invoices for a specific ticket ID',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  ticketId?: number;
}
