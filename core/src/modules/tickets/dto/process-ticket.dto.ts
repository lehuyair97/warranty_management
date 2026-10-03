import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { TicketStatus } from '@/common/constants';

/**
 * Data Transfer Object for progressing ticket status, recording diagnosis, and quotes.
 */
export class ProcessTicketDto {
  @ApiProperty({
    description: 'Target lifecycle status for the ticket',
    enum: TicketStatus,
    example: TicketStatus.INSPECTING,
  })
  @IsEnum(TicketStatus)
  @IsNotEmpty()
  status: TicketStatus;

  @ApiPropertyOptional({ description: 'Optional technician re-assignment ID' })
  @IsOptional()
  @IsInt()
  technicianId?: number;

  @ApiPropertyOptional({
    description: 'Root cause identified during technical inspection',
    example: 'Damaged eDP display cable connector and swollen battery',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  faultCause?: string;

  @ApiPropertyOptional({
    description: 'Proposed or executed repair solution',
    example: 'Replace eDP flexible cable and replace OEM battery module',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  repairSolution?: string;

  @ApiPropertyOptional({
    description: 'Estimated total cost communicated to the customer',
    example: 850000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedCost?: number;
}
