import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { TicketType } from '@/common/constants';

/**
 * Data Transfer Object for device reception and ticket creation.
 */
export class CreateTicketDto {
  @ApiProperty({ description: 'ID of the device being checked in', example: 1 })
  @IsInt()
  @IsNotEmpty()
  deviceId: number;

  @ApiPropertyOptional({
    description: 'Ticket classification type',
    enum: TicketType,
    default: TicketType.REPAIR,
  })
  @IsOptional()
  @IsEnum(TicketType)
  ticketType?: TicketType;

  @ApiProperty({
    description: 'Detailed description of symptoms reported by the customer',
    example: 'Laptop display flickers and turns black after 5 minutes of usage',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  issueDescription: string;

  @ApiPropertyOptional({
    description: 'Physical cosmetic condition upon reception',
    example: 'Scratch on top lid, minor dent on lower corner',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  initialCondition?: string;

  @ApiPropertyOptional({
    description: 'Accessories handed in along with the device',
    example: 'Original 65W USB-C charger, padded sleeve',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  accessories?: string;
}
