import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { EmployeeRole } from '@/common/constants';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';

/**
 * Query filter parameters for listing employees.
 */
export class EmployeeQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter employees by role',
    enum: EmployeeRole,
  })
  @IsOptional()
  @IsEnum(EmployeeRole)
  role?: EmployeeRole;

  @ApiPropertyOptional({
    description: 'Filter by active status',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;
}
