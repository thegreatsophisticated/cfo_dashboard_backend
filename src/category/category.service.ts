import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, In, Not, Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import {
  Category,
  CategoryLevel,
  CategoryType,
} from './entities/category.entity';
import { Transaction } from 'src/transaction/entities/transaction.entity';
import {
  CreateMainCategoryDto,
  CreateSubCategoryDto,
  CreateSubSubCategoryDto,
  UpdateCategoryDto,
} from './dto/create-category.dto';
import { User } from 'src/users/entities/user.entity';

type ChildInput = {
  code?: string;
  name: string;
  description?: string;
  sortOrder?: number;
};

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
  ) {}

  // ─── Reads ───────────────────────────────────────────────────────────────

  async getMainCategories(includeInactive = false): Promise<Category[]> {
    return this.categoryRepository.find({
      where: {
        level: CategoryLevel.MAIN,
        ...(includeInactive ? {} : { isActive: true }),
      },
      order: { sortOrder: 'ASC', code: 'ASC' },
    });
  }

  async getSubCategories(
    mainCategoryId: number,
    includeInactive = false,
  ): Promise<Category[]> {
    const main = await this.categoryRepository.findOne({
      where: { id: mainCategoryId },
    });
    if (!main) throw new NotFoundException('Main category not found');

    return this.categoryRepository.find({
      where: {
        parent: { id: mainCategoryId },
        level: CategoryLevel.SUB,
        ...(includeInactive ? {} : { isActive: true }),
      },
      order: { sortOrder: 'ASC', code: 'ASC' },
    });
  }

  async getSubSubCategories(
    subCategoryId: number,
    includeInactive = false,
  ): Promise<Category[]> {
    const sub = await this.categoryRepository.findOne({
      where: { id: subCategoryId },
    });
    if (!sub) throw new NotFoundException('Sub category not found');

    return this.categoryRepository.find({
      where: {
        parent: { id: subCategoryId },
        level: CategoryLevel.SUB_SUB,
        ...(includeInactive ? {} : { isActive: true }),
      },
      order: { sortOrder: 'ASC', code: 'ASC' },
    });
  }

  async getCategoryTree(): Promise<Category[]> {
    return this.categoryRepository.find({
      where: { level: CategoryLevel.MAIN, isActive: true },
      relations: ['children', 'children.children'],
      order: { sortOrder: 'ASC', code: 'ASC' },
    });
  }

  // Leaf categories used when posting transactions
  async getLeafCategories(): Promise<Category[]> {
    return this.categoryRepository.find({
      where: {
        level: CategoryLevel.SUB_SUB,
        allowTransactions: true,
        isActive: true,
      },
      relations: ['parent', 'parent.parent'],
      order: { code: 'ASC' },
    });
  }

  async getCategoryById(id: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['parent', 'parent.parent', 'children'],
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  // Used by TransactionService
  async findCategoryByID(id: number): Promise<Category> {
    return this.getCategoryById(id);
  }

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
    } else {
      sub = category;
      main = category.parent;
    }

    if (!main) throw new BadRequestException('Invalid category hierarchy');

    return { main, sub, subSub };
  }

  // ─── Create ──────────────────────────────────────────────────────────────

  async createMainCategory(dto: CreateMainCategoryDto, user: User) {
    await this.assertCodeAvailable(dto.code);
    await this.assertNameFreeAmongSiblings(dto.name, null);

    const category = this.categoryRepository.create({
      code: dto.code,
      name: dto.name,
      description: dto.description,
      level: CategoryLevel.MAIN,
      categoryType: dto.categoryType,
      sortOrder: dto.sortOrder ?? Number(dto.code),
      allowTransactions: false,
      isActive: true,
      createdBy: user,
    });
    return this.categoryRepository.save(category);
  }

  // Add a sub category under an EXISTING main category
  async createSubCategory(dto: CreateSubCategoryDto, user: User) {
    const main = await this.categoryRepository.findOne({
      where: { id: dto.mainCategoryId },
    });
    if (!main) throw new NotFoundException('Main category not found');
    if (main.level !== CategoryLevel.MAIN) {
      throw new BadRequestException('Parent must be a main category');
    }
    return this.createChild(main, CategoryLevel.SUB, dto, user);
  }

  // Add a sub-sub category under an EXISTING sub category
  async createSubSubCategory(dto: CreateSubSubCategoryDto, user: User) {
    const sub = await this.categoryRepository.findOne({
      where: { id: dto.subCategoryId },
    });
    if (!sub) throw new NotFoundException('Sub category not found');
    if (sub.level !== CategoryLevel.SUB) {
      throw new BadRequestException('Parent must be a sub category');
    }
    return this.createChild(sub, CategoryLevel.SUB_SUB, dto, user);
  }

  private async createChild(
    parent: Category,
    level: CategoryLevel.SUB | CategoryLevel.SUB_SUB,
    dto: ChildInput,
    user: User,
  ) {
    if (!parent.isActive) {
      throw new BadRequestException(
        'Cannot add a category to an inactive parent',
      );
    }

    const code = dto.code ?? (await this.generateNextCode(parent));
    this.assertCodeMatchesParent(code, parent);
    await this.assertCodeAvailable(code);
    await this.assertNameFreeAmongSiblings(dto.name, parent.id);

    const category = this.categoryRepository.create({
      code,
      name: dto.name,
      description: dto.description,
      level,
      categoryType: parent.categoryType, // always inherited
      sortOrder: dto.sortOrder ?? Number(code),
      parent,
      createdBy: user,
      allowTransactions: level === CategoryLevel.SUB_SUB,
      isActive: true,
    });
    return this.categoryRepository.save(category);
  }

  // ─── Update ──────────────────────────────────────────────────────────────

  async updateCategory(id: number, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['parent'],
    });
    if (!category) throw new NotFoundException('Category not found');

    const codeChanged = dto.code !== undefined && dto.code !== category.code;
    const typeChanged =
      dto.categoryType !== undefined &&
      dto.categoryType !== category.categoryType;
    const deactivating = dto.isActive === false && category.isActive;

    if (typeChanged && category.level !== CategoryLevel.MAIN) {
      throw new BadRequestException(
        'Category type can only be changed on the main category',
      );
    }
    if (dto.isActive === true && category.parent && !category.parent.isActive) {
      throw new BadRequestException('Activate the parent category first');
    }
    if (codeChanged && category.parent) {
      this.assertCodeMatchesParent(dto.code as string, category.parent);
    }
    if (dto.name && dto.name !== category.name) {
      await this.assertNameFreeAmongSiblings(
        dto.name,
        category.parent?.id ?? null,
        id,
      );
    }

    // Fields that apply to this row only
    const fields: QueryDeepPartialEntity<Category> = {};
    if (dto.name !== undefined) fields.name = dto.name;
    if (dto.description !== undefined) fields.description = dto.description;
    if (dto.sortOrder !== undefined) fields.sortOrder = dto.sortOrder;
    if (dto.isActive !== undefined) fields.isActive = dto.isActive;
    if (typeChanged) fields.categoryType = dto.categoryType;

    // Simple edit: one UPDATE, no transaction, no tree work, no reload
    if (!codeChanged && !typeChanged && !deactivating) {
      if (Object.keys(fields).length > 0) {
        await this.categoryRepository.update(id, fields);
      }
      return Object.assign(category, fields) as Category;
    }

    // Cascading edit
    const descendants = (
      await this.categoryRepository.manager
        .getTreeRepository(Category)
        .findDescendants(category)
    ).filter((d) => d.id !== id);
    const descendantIds = descendants.map((d) => d.id);
    const oldCode = category.code;

    if (codeChanged) {
      const newCode = dto.code as string;
      const newCodes = [
        newCode,
        ...descendants.map((d) => newCode + d.code.slice(oldCode.length)),
      ];
      const clash = await this.categoryRepository.find({
        where: { code: In(newCodes), id: Not(In([id, ...descendantIds])) },
        withDeleted: true,
      });
      if (clash.length) {
        throw new ConflictException(
          `Code(s) already in use: ${clash.map((c) => c.code).join(', ')}`,
        );
      }
    }

    await this.categoryRepository.manager.transaction(async (em) => {
      if (codeChanged) {
        const newCode = dto.code as string;
        // Two phases so a new code can never collide with an old one
        // inside the same subtree (e.g. 100 → 1000 while a child is 1000)
        for (const sid of [id, ...descendantIds]) {
          await em.update(Category, sid, { code: `tmp-${sid}` });
        }
        await em.update(Category, id, { code: newCode });
        for (const d of descendants) {
          await em.update(Category, d.id, {
            code: newCode + d.code.slice(oldCode.length),
          });
        }
      }

      if (descendantIds.length > 0) {
        if (typeChanged) {
          await em.update(
            Category,
            { id: In(descendantIds) },
            { categoryType: dto.categoryType },
          );
        }
        if (deactivating) {
          await em.update(
            Category,
            { id: In(descendantIds) },
            { isActive: false },
          );
        }
      }

      if (Object.keys(fields).length > 0) {
        await em.update(Category, id, fields);
      }
    });

    return this.getCategoryById(id);
  }

  // ─── Codes ───────────────────────────────────────────────────────────────

  // Includes soft-deleted rows, because `code` is unique at DB level
  async codeExists(code: string, excludeId?: number): Promise<boolean> {
    const count = await this.categoryRepository.count({
      where: excludeId ? { code, id: Not(excludeId) } : { code },
      withDeleted: true,
    });
    return count > 0;
  }

  // Suggests the next free 3-digit main code. When a type is given, it
  // continues after the highest main code of that type (equity 131 → 132),
  // otherwise after the highest main code overall.
  async getNextMainCode(categoryType?: CategoryType): Promise<string> {
    const mains = await this.categoryRepository.find({
      where: { level: CategoryLevel.MAIN },
      withDeleted: true, // codes of deleted rows stay reserved
    });

    const sameType = categoryType
      ? mains.filter((c) => c.categoryType === categoryType)
      : [];
    const pool = sameType.length ? sameType : mains;

    const used = pool
      .map((c) => parseInt(c.code, 10))
      .filter((n) => !isNaN(n));

    let next = used.length ? Math.max(...used) + 1 : 100;
    while (next < 1000 && (await this.codeExists(String(next)))) next += 1;

    if (next >= 1000) {
      throw new ConflictException(
        'No free 3-digit main codes left; enter a code manually',
      );
    }
    return String(next);
  }

  async getNextAvailableCode(parentId: number): Promise<string> {
    const parent = await this.getCategoryById(parentId);
    return this.generateNextCode(parent);
  }

  // main 100 → sub 1000, 1001, ...   |   sub 1000 → sub-sub 100010, 100020, ...
  private async generateNextCode(parent: Category): Promise<string> {
    if (parent.level === CategoryLevel.SUB_SUB) {
      throw new BadRequestException('Sub-sub categories cannot have children');
    }

    const width = parent.level === CategoryLevel.MAIN ? 1 : 2;
    const limit = 10 ** width;

    const children = await this.categoryRepository.find({
      where: { parent: { id: parent.id } },
      withDeleted: true,
    });

    const used = children
      .map((c) => parseInt(c.code.slice(parent.code.length), 10))
      .filter((n) => !isNaN(n));

    let next = 0;
    if (used.length) {
      const max = Math.max(...used);
      next = width === 2 && max % 10 === 0 ? max + 10 : max + 1;
    } else if (width === 2) {
      next = 10;
    }

    while (next < limit) {
      const code = parent.code + String(next).padStart(width, '0');
      if (!(await this.codeExists(code))) return code;
      next += 1; // slot taken: fall back to the next number
    }

    throw new ConflictException(
      `No free codes left under ${parent.code}; provide a code manually`,
    );
  }

  private assertCodeMatchesParent(code: string, parent: Category) {
    if (!code.startsWith(parent.code) || code.length <= parent.code.length) {
      throw new BadRequestException(
        `Code must start with the parent code (${parent.code}) and be longer`,
      );
    }
  }

  private async assertCodeAvailable(code: string, excludeId?: number) {
    if (await this.codeExists(code, excludeId)) {
      throw new ConflictException(`Category code ${code} already exists`);
    }
  }

  private async assertNameFreeAmongSiblings(
    name: string,
    parentId: number | null,
    excludeId?: number,
  ) {
    const where: any = { name: ILike(name) };
    if (parentId) where.parent = { id: parentId };
    else where.level = CategoryLevel.MAIN;
    if (excludeId) where.id = Not(excludeId);

    if ((await this.categoryRepository.count({ where })) > 0) {
      throw new ConflictException(
        `A category named "${name}" already exists at this level`,
      );
    }
  }

  // ─── Delete / restore ────────────────────────────────────────────────────

  async deleteCategory(id: number): Promise<void> {
    await this.getCategoryById(id);

    const childrenCount = await this.categoryRepository.count({
      where: { parent: { id } },
    });
    if (childrenCount > 0) {
      throw new BadRequestException(
        'Cannot delete category with sub-categories',
      );
    }

    const txCount = await this.transactionRepository.count({
      where: { category: { id } },
    });
    if (txCount > 0) {
      throw new BadRequestException(
        `Cannot delete category with ${txCount} existing transaction(s). Deactivate it instead.`,
      );
    }

    await this.categoryRepository.softDelete(id);
  }

  async restoreCategory(id: number): Promise<Category> {
    await this.categoryRepository.restore(id);
    return this.getCategoryById(id);
  }
}
