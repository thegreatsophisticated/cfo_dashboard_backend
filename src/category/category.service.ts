import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Category,
  CategoryLevel,
  CategoryType,
} from './entities/category.entity';
import {
  CreateSubSubCategoryDto,
  CreateCategoryDto,
  UpdateCategoryDto,
} from './dto/create-category.dto';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  // Get all main categories
  async getMainCategories(): Promise<Category[]> {
    return this.categoryRepository.find({
      where: {
        level: CategoryLevel.MAIN,
        isActive: true,
      },
      order: {
        sortOrder: 'ASC',
        code: 'ASC',
      },
    });
  }

  // Get sub categories by main category ID
  async getSubCategories(mainCategoryId: number): Promise<Category[]> {
    const mainCategory = await this.categoryRepository.findOne({
      where: { id: mainCategoryId },
    });

    if (!mainCategory) {
      throw new NotFoundException('Main category not found');
    }

    return this.categoryRepository.find({
      where: {
        parent: { id: mainCategoryId },
        level: CategoryLevel.SUB,
        isActive: true,
      },
      order: {
        sortOrder: 'ASC',
        code: 'ASC',
      },
    });
  }

  // Get sub-sub categories by sub category ID
  async getSubSubCategories(subCategoryId: number): Promise<Category[]> {
    const subCategory = await this.categoryRepository.findOne({
      where: { id: subCategoryId },
    });

    if (!subCategory) {
      throw new NotFoundException('Sub category not found');
    }

    return this.categoryRepository.find({
      where: {
        parent: { id: subCategoryId },
        level: CategoryLevel.SUB_SUB,
        isActive: true,
      },
      order: {
        sortOrder: 'ASC',
        code: 'ASC',
      },
    });
  }

  // Get category tree structure
  async getCategoryTree(): Promise<Category[]> {
    const mainCategories = await this.categoryRepository.find({
      where: {
        level: CategoryLevel.MAIN,
        isActive: true,
      },
      relations: ['children', 'children.children'],
      order: {
        sortOrder: 'ASC',
        code: 'ASC',
      },
    });

    return mainCategories;
  }

  // Get all leaf categories (sub-sub level) for transactions
  async getLeafCategories(): Promise<Category[]> {
    return this.categoryRepository.find({
      where: {
        level: CategoryLevel.SUB_SUB,
        allowTransactions: true,
        isActive: true,
      },
      relations: ['parent', 'parent.parent'],
      order: {
        code: 'ASC',
      },
    });
  }

  // Get category by ID
  async getCategoryById(id: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['parent', 'parent.parent', 'children'],
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  // Alias for backward compatibility with transaction service
  async findCategoryByID(id: number): Promise<Category> {
    return this.getCategoryById(id);
  }

  // Get full category path (breadcrumb)
  async getCategoryPath(
    id: number,
  ): Promise<{ main: Category; sub: Category; subSub: Category }> {
    const category = await this.getCategoryById(id);

    if (category.level === CategoryLevel.MAIN) {
      throw new BadRequestException('Cannot get path for main category');
    }

    let subSub: Category | undefined;
    let sub: Category | undefined;
    let main: Category | undefined;

    if (category.level === CategoryLevel.SUB_SUB) {
      subSub = category;
      sub = category.parent;
      main = sub?.parent;
    } else if (category.level === CategoryLevel.SUB) {
      sub = category;
      main = category.parent;
    }

    if (!main) {
      throw new BadRequestException('Invalid category hierarchy');
    }

    return {
      main,
      sub: sub,
      subSub: subSub,
    };
  }

  // Create a new sub-sub category
  async createSubSubCategory(
    createDto: CreateSubSubCategoryDto,
    user: User,
  ): Promise<Category> {
    // Validate parent sub category exists
    const subCategory = await this.categoryRepository.findOne({
      where: { id: createDto.subCategoryId },
      relations: ['parent'],
    });

    if (!subCategory) {
      throw new NotFoundException('Sub category not found');
    }

    if (subCategory.level !== CategoryLevel.SUB) {
      throw new BadRequestException('Parent must be a sub category');
    }

    // Check if code already exists
    const codeExists = await this.codeExists(createDto.code);
    if (codeExists) {
      throw new ConflictException(
        `Category code ${createDto.code} already exists`,
      );
    }

    // Validate code format (should start with parent's code)
    if (!createDto.code.startsWith(subCategory.code)) {
      throw new BadRequestException(
        `Sub-sub category code must start with parent code (${subCategory.code})`,
      );
    }

    // Create the sub-sub category
    const newCategory = this.categoryRepository.create({
      code: createDto.code,
      name: createDto.name,
      description: createDto.description,
      level: CategoryLevel.SUB_SUB,
      categoryType: subCategory.categoryType, // Inherit from parent
      sortOrder: createDto.sortOrder || 0,
      parent: subCategory,
      createdBy: user,
      allowTransactions: true, // Sub-sub categories allow transactions
      isActive: true,
    });

    return this.categoryRepository.save(newCategory);
  }

  // Create a new category (any level)
  async createCategory(
    createDto: CreateCategoryDto,
    user: User,
  ): Promise<Category> {
    // Check if code already exists
    const codeExists = await this.codeExists(createDto.code);
    if (codeExists) {
      throw new ConflictException(
        `Category code ${createDto.code} already exists`,
      );
    }

    // Validate parent if provided
    let parent: Category | null = null;
    if (createDto.parentId) {
      const foundParent = await this.categoryRepository.findOne({
        where: { id: createDto.parentId },
      });

      if (!foundParent) {
        throw new NotFoundException('Parent category not found');
      }

      parent = foundParent;

      // Validate level hierarchy
      if (
        createDto.level === CategoryLevel.SUB &&
        parent.level !== CategoryLevel.MAIN
      ) {
        throw new BadRequestException(
          'Sub category parent must be a main category',
        );
      }

      if (
        createDto.level === CategoryLevel.SUB_SUB &&
        parent.level !== CategoryLevel.SUB
      ) {
        throw new BadRequestException(
          'Sub-sub category parent must be a sub category',
        );
      }

      // Validate code format
      if (!createDto.code.startsWith(parent.code)) {
        throw new BadRequestException(
          `Category code must start with parent code (${parent.code})`,
        );
      }

      // Inherit category type from parent
      if (createDto.categoryType !== parent.categoryType) {
        throw new BadRequestException(
          'Category type must match parent category type',
        );
      }
    }

    // Determine if transactions are allowed
    const allowTransactions = createDto.level === CategoryLevel.SUB_SUB;

    // Create the category
    const newCategory = this.categoryRepository.create({
      code: createDto.code,
      name: createDto.name,
      description: createDto.description,
      level: createDto.level,
      categoryType: createDto.categoryType,
      sortOrder: createDto.sortOrder || 0,
      parent: parent || undefined,
      createdBy: user,
      allowTransactions,
      isActive: createDto.isActive !== undefined ? createDto.isActive : true,
    });

    return this.categoryRepository.save(newCategory);
  }

  // Update category
  async updateCategory(
    id: number,
    updateDto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.getCategoryById(id);

    Object.assign(category, updateDto);

    return this.categoryRepository.save(category);
  }

  // Check if category code exists
  async codeExists(code: string): Promise<boolean> {
    const count = await this.categoryRepository.count({
      where: {
        code,
      },
    });

    return count > 0;
  }

  // Get next available code for a parent category
  async getNextAvailableCode(parentId: number): Promise<string> {
    const parent = await this.getCategoryById(parentId);

    // Get all children codes
    const children = await this.categoryRepository.find({
      where: {
        parent: { id: parentId },
      },
      order: {
        code: 'DESC',
      },
      take: 1,
    });

    if (children.length === 0) {
      // First child
      if (parent.level === CategoryLevel.MAIN) {
        return `${parent.code}0`; // e.g., 100 -> 1000
      } else {
        return `${parent.code}0`; // e.g., 1000 -> 10000
      }
    }

    // Increment last code
    const lastCode = children[0].code;
    const lastNumber = parseInt(lastCode);
    const nextNumber = lastNumber + 10; // Increment by 10 for spacing

    return nextNumber.toString();
  }

  // Soft delete category
  async deleteCategory(id: number): Promise<void> {
    const category = await this.getCategoryById(id);

    // Check if category has children
    const childrenCount = await this.categoryRepository.count({
      where: { parent: { id } },
    });

    if (childrenCount > 0) {
      throw new BadRequestException(
        'Cannot delete category with sub-categories',
      );
    }

    // Check if category has transactions
    if (category.transactions && category.transactions.length > 0) {
      throw new BadRequestException(
        'Cannot delete category with existing transactions',
      );
    }

    await this.categoryRepository.softDelete(id);
  }

  // Restore soft-deleted category
  async restoreCategory(id: number): Promise<Category> {
    await this.categoryRepository.restore(id);
    return this.getCategoryById(id);
  }
}
