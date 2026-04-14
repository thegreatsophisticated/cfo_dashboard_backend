// import { IsOptional, IsNumber, Min, MinLength, IsNotEmpty, IsString } from 'class-validator';
// import { Type } from 'class-transformer';
// import { CreateProfileDto } from 'src/profiles/dto/create-profile.dto';
// export class CreateUserDto {
//   @IsNotEmpty({ message: 'Name is required' })
//   @MinLength(4, { message: 'Name must be at least 4 characters long' })
//   name: string;

//   @IsNotEmpty({ message: 'Phone is required' })
//   phone: string;

//   @IsNotEmpty({ message: 'Email is required' })
//   email: string;

//   @IsNotEmpty({ message: 'Password is required' })
//   @MinLength(8, { message: 'Password must be at least 8 characters long' })
//   @IsString({ message: 'Password must be a string' })
//   password: string;

//   @IsNotEmpty({ message: 'Role is required' })
//   @IsString({ message: 'Role must be a string' })
//   role: string;

//  @IsOptional()
//   profile?: CreateProfileDto;

// }

import {
  IsOptional,
  IsNumber,
  Min,
  MinLength,
  IsNotEmpty,
  IsString,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateProfileDto } from 'src/profiles/dto/create-profile.dto';

export class CreateUserDto {
  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(4, { message: 'Name must be at least 4 characters long' })
  name: string;

  @IsNotEmpty({ message: 'Phone is required' })
  phone: string;

  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @IsString({ message: 'Password must be a string' })
  password: string;

  @IsNotEmpty({ message: 'Role is required' })
  @IsString({ message: 'Role must be a string' })
  role: string;

  @IsOptional()
  profile?: CreateProfileDto;

  // NEW: Optional company assignment
  @IsOptional()
  @IsInt({ message: 'Company ID must be an integer' })
  @Type(() => Number)
  companyId?: number;
}
