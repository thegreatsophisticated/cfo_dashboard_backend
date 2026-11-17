import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsInt,
  IsBoolean,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { CategoryType } from '../entities/category.entity';

const CODE_REGEX = /^[0-9]+$/;

export class CreateMainCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @Matches(CODE_REGEX, { message: 'Code must contain only numbers' })
  code: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsEnum(CategoryType)
  categoryType: CategoryType;

  @IsInt()
  @IsOptional()
  sortOrder?: number;
}

export class CreateSubCategoryDto {
  @IsInt()
  mainCategoryId: number;

  // Optional: auto-generated when omitted
  @IsString()
  @IsOptional()
  @MaxLength(20)
  @Matches(CODE_REGEX, { message: 'Code must contain only numbers' })
  code?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsInt()
  @IsOptional()
  sortOrder?: number;
}

export class CreateSubSubCategoryDto {
  @IsInt()
  subCategoryId: number;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  @Matches(CODE_REGEX, { message: 'Code must contain only numbers' })
  code?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsInt()
  @IsOptional()
  sortOrder?: number;
}

// Level and parent are intentionally NOT editable
export class UpdateCategoryDto {
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(200)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  @Matches(CODE_REGEX, { message: 'Code must contain only numbers' })
  code?: string;

  // Only accepted on main categories; cascades to all descendants
  @IsEnum(CategoryType)
  @IsOptional()
  categoryType?: CategoryType;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsInt()
  @IsOptional()
  sortOrder?: number;
}
