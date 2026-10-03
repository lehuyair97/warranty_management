import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

/**
 * Filter parameters for querying overdue/delayed tickets.
 */
export class DelayedTicketsQueryDto {
  @ApiPropertyOptional({
    description: 'Threshold in elapsed days without ticket completion to flag as delayed',
    default: 14,
    example: 7,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  delayDays: number = 14;
}
