import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

/**
 * Data Transfer Object for an authenticated employee updating their own profile.
 */
export class UpdateProfileDto {
  @ApiPropertyOptional({ description: 'Display name', example: 'Admin Manager' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({ description: 'Contact phone number', example: '0901234567' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ description: 'Contact email address', example: 'admin@uitcare.vn' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Current password for verification if changing password' })
  @IsOptional()
  @IsString()
  currentPassword?: string;

  @ApiPropertyOptional({ description: 'New password if changing credentials', example: 'NewPass123!' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}
