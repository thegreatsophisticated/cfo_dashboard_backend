import {
  IsOptional,
  IsNumber,
  Min,
  MinLength,
  IsNotEmpty,
  IsString,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProfileDto {
  @IsOptional()
  @IsString({ message: 'Gender must be a string' })
  gender?: string;

  @IsOptional()
  @IsString({ message: 'Marital status must be a string' })
  maritalStatus?: string;

  @IsOptional()
  @IsString({ message: 'Position must be a string' })
  position?: string;

  @IsOptional()
  @IsDate({ message: 'Date of birth must be a valid date' })
  @Type(() => Date)
  dateOfBirth?: Date;

  @IsOptional()
  @IsString({ message: 'Profile image must be a string' })
  profileImage?: Buffer;
}
