import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDeviceDto {
  @ApiProperty({ example: 1, description: 'ID of owner customer' })
  @IsInt()
  @IsNotEmpty()
  customerId: number;

  @ApiProperty({ example: 'Dell Inspiron 15 3520', description: 'Equipment model or name' })
  @IsString()
  @IsNotEmpty()
  deviceName: string;

  @ApiPropertyOptional({ example: 'Laptop', description: 'Category of device' })
  @IsOptional()
  @IsString()
  deviceType?: string;

  @ApiPropertyOptional({ example: 'Dell', description: 'Brand manufacturer' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ example: 'DL3520A1001', description: 'Serial number or IMEI' })
  @IsOptional()
  @IsString()
  serialNumber?: string;

  @ApiPropertyOptional({ example: false, description: 'Initial warranty flag' })
  @IsOptional()
  @IsBoolean()
  isUnderWarranty?: boolean;

  @ApiPropertyOptional({ example: '2027-11-20', description: 'Warranty expiry date' })
  @IsOptional()
  @IsDateString()
  warrantyExpiryDate?: string;
}
