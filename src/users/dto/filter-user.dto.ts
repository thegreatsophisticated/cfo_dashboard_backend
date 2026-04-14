import { IsOptional, IsNumber, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterUserDto {
  @IsOptional()
  gender?: string;

  @IsOptional()
  isMarried?: boolean | string;

  @IsOptional()
  @IsString()
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
