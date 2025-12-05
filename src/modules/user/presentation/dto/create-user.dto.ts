import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
  Matches,
} from 'class-validator';
import { Role } from 'src/common/enums/role.enum';

export class CreateUserDto {
  @IsString()
  @ValidateIf((o) => o.password)
  @IsNotEmpty()
  @Matches(/^\+251\d{9}$/, {
    message:
      'Phone number must be a valid Ethiopian mobile number (e.g. +251XXXXXXXXX)',
  })
  @ApiProperty({ example: '+251988328834', description: 'The phone number of the user' })
  phone_number: string | null;

  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({ example: 'mriboyd1240@gmail.com', description: 'The email of the user' })
  email: string;

  @MinLength(8)
  @ValidateIf((o) => !o.is_email_verified)
  @IsNotEmpty()
  @ApiProperty({ example: 'password123', description: 'The password of the user' })
  password: string | null;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'John', description: 'The name of the user' })
  name: string;

  @IsOptional()
  @IsString()
  business_name?: string;

  @IsNotEmpty()
  @IsEnum(Role)
  @ApiProperty({ example: 'individual_buyer', description: 'The role of the user' })
  role: Role;

  @IsOptional()
  is_email_verified?: boolean;
}
