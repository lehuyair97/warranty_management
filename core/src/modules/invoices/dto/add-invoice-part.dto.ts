import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, Min } from 'class-validator';

/**
 * Data Transfer Object for attaching a replacement part to an invoice.
 */
export class AddInvoicePartDto {
  @ApiProperty({ description: 'ID of the replacement spare part from inventory', example: 5 })
  @IsInt()
  @IsNotEmpty()
  partId: number;

  @ApiProperty({ description: 'Quantity of parts consumed', example: 1, default: 1 })
  @IsInt()
  @Min(1)
  quantity: number = 1;
}
