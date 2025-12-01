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
  @Matches(/^\+2519\d{8}$/, {
    message:
      'Phone number must be a valid Ethiopian mobile number (e.g. +2519XXXXXXXX)',
  })
  phone_number: string | null;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @MinLength(8)
  @ValidateIf((o) => !o.is_email_verified)
  @IsNotEmpty()
  password: string | null;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  business_name?: string;

  @IsNotEmpty()
  @IsEnum(Role)
  role: Role;

  @IsOptional()
  is_email_verified?: boolean;
}
