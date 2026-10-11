import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsNumber, Min } from 'class-validator';

/**
 * Data Transfer Object for creating a billing invoice for a repair ticket.
 */
export class CreateInvoiceDto {
  @ApiProperty({ description: 'ID of the ticket to be billed', example: 1 })
  @IsInt()
  @IsNotEmpty()
  ticketId: number;

  @ApiProperty({ description: 'Labor fee in VND', example: 150000, default: 0 })
  @IsNumber()
  @Min(0)
  laborFee: number = 0;
}
