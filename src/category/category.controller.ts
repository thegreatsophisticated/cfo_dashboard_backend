import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
  ParseIntPipe,
  Delete,
  Patch,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import {
  CreateSubSubCategoryDto,
  CreateCategoryDto,
} from './dto/create-category.dto';
import { Category, CategoryLevel } from './entities/category.entity';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  // Get all main categories
  @Get('main')
  async getMainCategories(): Promise<Category[]> {
    return this.categoryService.getMainCategories();
  }

  // Get sub categories by main category ID
  @Get('main/:mainCategoryId/sub')
  async getSubCategories(
    @Param('mainCategoryId', ParseIntPipe) mainCategoryId: number,
  ): Promise<Category[]> {
    return this.categoryService.getSubCategories(mainCategoryId);
  }

  // Get sub-sub categories by sub category ID
  @Get('sub/:subCategoryId/sub-sub')
  async getSubSubCategories(
    @Param('subCategoryId', ParseIntPipe) subCategoryId: number,
  ): Promise<Category[]> {
    return this.categoryService.getSubSubCategories(subCategoryId);
  }

  // Get category hierarchy (tree structure)
  @Get('tree')
  async getCategoryTree(): Promise<Category[]> {
    return this.categoryService.getCategoryTree();
  }

  // Get all leaf categories (sub-sub level) for transaction selection
  @Get('leaf')
  async getLeafCategories(): Promise<Category[]> {
    return this.categoryService.getLeafCategories();
  }

  // Get category by ID with full hierarchy
  @Get(':id')
  async getCategoryById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Category> {
    return this.categoryService.getCategoryById(id);
  }

  // Get category hierarchy path (breadcrumb)
  @Get(':id/path')
  async getCategoryPath(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ main: Category; sub: Category; subSub: Category }> {
    return this.categoryService.getCategoryPath(id);
  }

  // Create a new sub-sub category
  @Post('sub-sub')
  async createSubSubCategory(
    @Body() createDto: CreateSubSubCategoryDto,
    @Request() req,
  ): Promise<Category> {
    return this.categoryService.createSubSubCategory(createDto, req.user);
  }

  // Create a new category (any level)
  @Post()
  async createCategory(
    @Body() createDto: CreateCategoryDto,
    @Request() req,
  ): Promise<Category> {
    return this.categoryService.createCategory(createDto, req.user);
  }

  // Validate category code uniqueness
  @Get('validate/code')
  async validateCode(
    @Query('code') code: string,
  ): Promise<{ available: boolean }> {
    const exists = await this.categoryService.codeExists(code);
    return { available: !exists };
  }

  // Get next available code for a parent category
  @Get('parent/:parentId/next-code')
  async getNextCode(
    @Param('parentId', ParseIntPipe) parentId: number,
  ): Promise<{ nextCode: string }> {
    const nextCode = await this.categoryService.getNextAvailableCode(parentId);
    return { nextCode };
  }

  // Soft delete a category
  @Delete(':id')
  async deleteCategory(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    await this.categoryService.deleteCategory(id);
    return { message: 'Category successfully deleted' };
  }

  // Restore a soft-deleted category
  @Patch(':id/restore')
  async restoreCategory(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Category> {
    return this.categoryService.restoreCategory(id);
  }
}
