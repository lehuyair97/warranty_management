import { ApiProperty } from '@nestjs/swagger';

/**
 * Standard API response wrapper.
 */
export class ApiResponseDto<T> {
  @ApiProperty({ default: true })
  success: boolean;

  @ApiProperty({ default: 200 })
  statusCode: number;

  @ApiProperty({ default: 'Operation completed successfully' })
  message: string;

  @ApiProperty({ required: false })
  data?: T;

  @ApiProperty({ default: new Date().toISOString() })
  timestamp: string;

  constructor(statusCode: number, message: string, data?: T) {
    this.success = statusCode >= 200 && statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }
}
