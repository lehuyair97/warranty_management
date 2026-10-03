import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty } from 'class-validator';

/**
 * Data Transfer Object for assigning a technician to a repair ticket.
 */
export class AssignTechnicianDto {
  @ApiProperty({ description: 'ID of the assigned technician', example: 3 })
  @IsInt()
  @IsNotEmpty()
  technicianId: number;
}
