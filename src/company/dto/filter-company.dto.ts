// dto/filter-company.dto.ts
import {
  IsOptional,
  IsString,
  IsInt,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CompanyType, IndustryType } from './create-company.dto';

export class FilterCompanyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(CompanyType)
  companyType?: CompanyType;

  @IsOptional()
  @IsEnum(IndustryType)
  industry?: IndustryType;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number;
}
