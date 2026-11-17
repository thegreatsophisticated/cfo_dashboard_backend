import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import {
  CreateMainCategoryDto,
  CreateSubCategoryDto,
  CreateSubSubCategoryDto,
  UpdateCategoryDto,
} from './dto/create-category.dto';
import { Category, CategoryType } from './entities/category.entity';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { User } from 'src/users/entities/user.entity';

@Controller('categories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  // ── Reads (any authenticated user) ──
  // Static routes must stay above the @Get(':id') routes

  @Get('main')
  getMainCategories(
    @Query('includeInactive') includeInactive?: string,
  ): Promise<Category[]> {
    return this.categoryService.getMainCategories(includeInactive === 'true');
  }

  @Get('main/:mainCategoryId/sub')
  getSubCategories(
    @Param('mainCategoryId', ParseIntPipe) mainCategoryId: number,
    @Query('includeInactive') includeInactive?: string,
  ): Promise<Category[]> {
    return this.categoryService.getSubCategories(
      mainCategoryId,
      includeInactive === 'true',
    );
  }

  @Get('sub/:subCategoryId/sub-sub')
  getSubSubCategories(
    @Param('subCategoryId', ParseIntPipe) subCategoryId: number,
    @Query('includeInactive') includeInactive?: string,
  ): Promise<Category[]> {
    return this.categoryService.getSubSubCategories(
      subCategoryId,
      includeInactive === 'true',
    );
  }

  @Get('tree')
  getCategoryTree(): Promise<Category[]> {
    return this.categoryService.getCategoryTree();
  }

  @Get('leaf')
  getLeafCategories(): Promise<Category[]> {
    return this.categoryService.getLeafCategories();
  }

  @Get('validate/code')
  async validateCode(@Query('code') code: string) {
    return { available: !(await this.categoryService.codeExists(code)) };
  }

  @Get('next-main-code')
  async getNextMainCode(@Query('categoryType') categoryType?: CategoryType) {
    return {
      nextCode: await this.categoryService.getNextMainCode(categoryType),
    };
  }

  @Get('parent/:parentId/next-code')
  async getNextCode(@Param('parentId', ParseIntPipe) parentId: number) {
    return {
      nextCode: await this.categoryService.getNextAvailableCode(parentId),
    };
  }

  @Get(':id/path')
  getCategoryPath(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.getCategoryPath(id);
  }

  @Get(':id')
  getCategoryById(@Param('id', ParseIntPipe) id: number): Promise<Category> {
    return this.categoryService.getCategoryById(id);
  }

  // ── Writes (admin only) ──

  @Post('main')
  @Roles('admin')
  createMain(@Body() dto: CreateMainCategoryDto, @CurrentUser() user: User) {
    return this.categoryService.createMainCategory(dto, user);
  }

  @Post('sub')
  @Roles('admin')
  createSub(@Body() dto: CreateSubCategoryDto, @CurrentUser() user: User) {
    return this.categoryService.createSubCategory(dto, user);
  }

  @Post('sub-sub')
  @Roles('admin')
  createSubSub(
    @Body() dto: CreateSubSubCategoryDto,
    @CurrentUser() user: User,
  ) {
    return this.categoryService.createSubSubCategory(dto, user);
  }

  // Edit main / sub / sub-sub: the level is read from the record itself
  @Patch(':id')
  @Roles('admin')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
  ): Promise<Category> {
    return this.categoryService.updateCategory(id, dto);
  }

  @Patch(':id/restore')
  @Roles('admin')
  restore(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.restoreCategory(id);
  }

  @Delete(':id')
  @Roles('admin')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.categoryService.deleteCategory(id);
    return { message: 'Category successfully deleted' };
  }
}
