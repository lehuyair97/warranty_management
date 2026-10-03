import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

/**
 * Parameters for executing the invoice cursor audit procedure.
 */
export class AuditInvoicesDto {
  @ApiPropertyOptional({
    description: 'Whether to automatically reconcile and correct discovered financial discrepancies',
    default: false,
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true || value === 1 || value === '1')
  @IsBoolean()
  autoFix?: boolean = false;
}
