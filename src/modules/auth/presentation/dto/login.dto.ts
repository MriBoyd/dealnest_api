// auth/dto/login.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'mriboyd1240@gmail.com', description: 'The email of the user' })
  email: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'password123', description: 'The password of the user' })
  password: string;
}
