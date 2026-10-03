import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreatePartDto {
  @ApiProperty({ example: 'RAM DDR4 8GB 3200MHz', description: 'Spare part name' })
  @IsString()
  @IsNotEmpty()
  partName: string;

  @ApiProperty({ example: 'piece', description: 'Measurement unit' })
  @IsString()
  @IsNotEmpty()
  unit: string;

  @ApiProperty({ example: 650000, description: 'Selling price per unit in VND' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 25, description: 'Available stock quantity' })
  @IsInt()
  @Min(0)
  stockQuantity: number;
}
