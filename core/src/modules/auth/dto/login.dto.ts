import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * Payload required for employee authentication.
 */
export class LoginDto {
  @ApiProperty({ example: 'admin', description: 'Employee username' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: '123456', description: 'Plain text password' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
