import { 
  IsOptional, 
  IsNumber, 
  Min, 
  MinLength, 
  IsNotEmpty,
  IsEmail,
  IsUrl,
  IsEnum,
  IsString,
  MaxLength,
  IsPhoneNumber,
  ValidateNested,
  IsBoolean,
  Max,
  IsInt
} from 'class-validator';
import { Type } from 'class-transformer';

export enum CompanyType {
  SOLE_PROPRIETORSHIP = 'sole_proprietorship',
  PARTNERSHIP = 'partnership',
  LLC = 'llc',
  CORPORATION = 'corporation',
  NON_PROFIT = 'non_profit'
}

export enum IndustryType {
  TECHNOLOGY = 'technology',
  HEALTHCARE = 'healthcare',
  FINANCE = 'finance',
  RETAIL = 'retail',
  MANUFACTURING = 'manufacturing',
  EDUCATION = 'education',
  OTHER = 'other'
}

export class AddressDto {
  @IsOptional()
  @IsString()
  street?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  zipCode?: string;

  @IsOptional()
  @IsString()
  country?: string;
}

export class CreateCompanyDto {
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000000)
  employeeCount?: number;

  @IsOptional()
  @Type(() => Date)
  establishedDate?: Date;

  @IsNotEmpty()
  @IsEnum(CompanyType)
  companyType: CompanyType;

  @IsOptional()
  @IsEnum(IndustryType)
  industry?: IndustryType;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsPhoneNumber()
  phoneNumber?: string;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsOptional()
  @IsString()
  @MinLength(9)
  @MaxLength(15)
  taxId?: string;

  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  // @IsOptional()
  // @IsBoolean()
  // isActive?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  annualRevenue?: number;

  @IsOptional()
  @IsString()
  ceo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  // User relationship - will be set from authenticated user in controller
  @IsNotEmpty()
  @IsInt()
  createdBy: number;
}