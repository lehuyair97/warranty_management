import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Data Transfer Object for bulk importing spare parts from CSV text.
 */
export class ImportPartsDto {
  @ApiProperty({
    description: 'Raw CSV text content including header: part_name,unit,price,stock_quantity',
    example: 'part_name,unit,price,stock_quantity\nRAM DDR4 16GB,piece,1250000,10',
  })
  @IsString()
  @IsNotEmpty()
  csvContent: string;
}
