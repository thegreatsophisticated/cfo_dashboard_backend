import {
  IsOptional,
  IsNumber,
  Min,
  MinLength,
  IsNotEmpty,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

// login dto
export class CreateAuthDto {
  @IsNotEmpty()
  @MinLength(4)
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
