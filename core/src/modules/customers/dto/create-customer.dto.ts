import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ example: 'Nguyen Van An', description: 'Customer full name' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: '0901234501', description: 'Customer mobile phone number' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]{10,15}$/, { message: 'Phone number must contain 10-15 digits' })
  phoneNumber: string;

  @ApiPropertyOptional({ example: 'an.nguyen@gmail.com', description: 'Customer email' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '12 Nguyen Hue, District 1, HCMC', description: 'Customer address' })
  @IsOptional()
  @IsString()
  address?: string;
}
