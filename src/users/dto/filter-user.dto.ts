import { IsOptional, IsNumber, Min, MinLength, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterUserDto {
  @IsOptional()
  gender?: string;

  @IsOptional()
  isMarried?: boolean | string;

  @IsOptional()
  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(4,{message: 'Name must be at least 4 characters long' })
  name?: string;

  @IsOptional()
  id?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;
}