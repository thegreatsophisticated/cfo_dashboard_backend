import {
  IsOptional,
  IsEmail,
  MinLength,
  IsNotEmpty,
  ValidateIf,
} from 'class-validator';

export class LoginDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @MinLength(10)
  phone?: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ValidateIf((o) => !o.email && !o.phone)
  @IsNotEmpty({ message: 'Either email or phone must be provided' })
  emailOrPhone?: never;
}
