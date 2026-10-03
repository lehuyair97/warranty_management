import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { EmployeeRole } from '@/common/constants';

/**
 * Data Transfer Object for updating employee records.
 */
export class UpdateEmployeeDto {
  @ApiPropertyOptional({ description: 'Updated password if changing credentials', example: 'NewSecret123' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({ description: 'Updated display name', example: 'Huy Le Senior' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({
    description: 'Updated system role',
    enum: EmployeeRole,
    example: EmployeeRole.MANAGER,
  })
  @IsOptional()
  @IsEnum(EmployeeRole)
  role?: EmployeeRole;

  @ApiPropertyOptional({ description: 'Updated contact phone number', example: '0987654321' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ description: 'Updated email address', example: 'huy.senior@company.vn' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Updated active flag', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
