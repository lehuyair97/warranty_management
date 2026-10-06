import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

/**
 * Query parameters for data export endpoints.
 */
export class ExportQueryDto {
  @ApiPropertyOptional({
    description: 'Format to export data: csv or json',
    enum: ['csv', 'json'],
    default: 'csv',
  })
  @IsOptional()
  @IsString()
  @IsIn(['csv', 'json'])
  format?: 'csv' | 'json' = 'csv';
}
