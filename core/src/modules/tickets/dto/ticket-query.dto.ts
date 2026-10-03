import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { TicketStatus, TicketType } from '@/common/constants';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';

/**
 * Filter parameters for querying tickets.
 */
export class TicketQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by ticket status',
    enum: TicketStatus,
  })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @ApiPropertyOptional({
    description: 'Filter by ticket classification type',
    enum: TicketType,
  })
  @IsOptional()
  @IsEnum(TicketType)
  ticketType?: TicketType;

  @ApiPropertyOptional({
    description: 'Filter tickets assigned to a specific technician ID',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  technicianId?: number;

  @ApiPropertyOptional({
    description: 'Filter tickets by customer ID',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  customerId?: number;

  @ApiPropertyOptional({
    description: 'Filter tickets by device ID',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  deviceId?: number;
}
