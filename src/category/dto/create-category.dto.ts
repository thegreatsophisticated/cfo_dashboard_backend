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
import { CategoryLevel, CategoryType } from '../entities/category.entity';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(20)
  @Matches(/^[0-9]+$/, { message: 'Code must contain only numbers' })
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

  @IsEnum(CategoryLevel)
  @IsNotEmpty()
  level: CategoryLevel;

  @IsEnum(CategoryType)
  @IsNotEmpty()
  categoryType: CategoryType;

  @IsInt()
  @IsOptional()
  parentId?: number;

  @IsInt()
  @IsOptional()
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CreateSubSubCategoryDto {
  @IsInt()
  @IsNotEmpty()
  subCategoryId: number;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(20)
  @Matches(/^[0-9]+$/, { message: 'Code must contain only numbers' })
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

  @IsInt()
  @IsOptional()
  sortOrder?: number;
}

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

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsInt()
  @IsOptional()
  sortOrder?: number;
}
