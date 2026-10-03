import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Query DTO for public guest repair lookup.
 */
export class TrackTicketDto {
  @ApiProperty({
    description: 'Ticket code (e.g. 10 or TK-0010)',
    example: '10',
  })
  @IsString()
  @IsNotEmpty()
  ticketCode: string;

  @ApiProperty({
    description: 'Customer contact phone number matching ticket registration',
    example: '0901234567',
  })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;
}
