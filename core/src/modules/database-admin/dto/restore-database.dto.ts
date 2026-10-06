import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Data Transfer Object for requesting a database restoration from a specific .bak file.
 */
export class RestoreDatabaseDto {
  @ApiProperty({
    description: 'Name of the .bak file located in the exchange directory',
    example: 'warranty_backup_2026-10-06_04-14-23.bak',
  })
  @IsString()
  @IsNotEmpty()
  backupFileName: string;
}
