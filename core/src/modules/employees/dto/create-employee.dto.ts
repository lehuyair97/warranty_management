import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { EmployeeRole } from '@/common/constants';

/**
 * Data Transfer Object for creating an employee account.
 */
export class CreateEmployeeDto {
  @ApiProperty({ description: 'Unique username for employee login', example: 'tech_huy' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ description: 'Plain text password for initial account creation', example: 'P@ssword123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ description: 'Full legal or display name of the employee', example: 'Huy Le' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({
    description: 'System role determining RBAC permissions',
    enum: EmployeeRole,
    example: EmployeeRole.TECHNICIAN,
  })
  @IsEnum(EmployeeRole)
  role: EmployeeRole;

  @ApiPropertyOptional({ description: 'Direct contact phone number', example: '0901234567' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ description: 'Company or personal email address', example: 'huy@company.vn' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Account active status', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
