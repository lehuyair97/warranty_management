import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Data Transfer Object for bulk importing repair tickets from CSV text.
 */
export class ImportTicketsDto {
  @ApiProperty({
    description:
      'Raw CSV text content with header: device_id,ticket_type,issue_description,initial_condition,accessories,estimated_cost',
    example:
      'device_id,ticket_type,issue_description,initial_condition,accessories,estimated_cost\n1,repair,Screen flickering,Minor scratches,Charger,350000',
  })
  @IsString()
  @IsNotEmpty()
  csvContent: string;
}
