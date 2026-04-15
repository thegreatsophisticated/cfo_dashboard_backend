import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { PaginationDto, paginate } from './dto/pagination.dto';
import { Transaction, TransactionStatus } from './entities/transaction.entity';
import { UsersService } from 'src/users/users.service';
import { CompanyService } from 'src/company/company.service';
import { CategoryService } from 'src/category/category.service';
import {
  CategoryLevel,
  CategoryType,
} from 'src/category/entities/category.entity';
import { User } from 'src/users/entities/user.entity';
import { RecurringTransactionService } from './services/recurring-transaction.service';

@Injectable()
export class TransactionService {
  constructor(
    private readonly usersService: UsersService,
    private readonly companyService: CompanyService,
    private readonly categoryService: CategoryService,
    private readonly recurringTransactionService: RecurringTransactionService,

    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // ─── Access helpers ───────────────────────────────────────────────────────

  private async validateUserCompanyAccess(
    currentUser: User,
    companyId: number,
  ): Promise<void> {
    if (currentUser.role === 'admin') return;

    const user = await this.userRepository.findOne({
      where: { id: currentUser.id },
      relations: ['company'],
    });

    if (!user || !user.company) {
      throw new ForbiddenException('You are not assigned to any company');
    }

    if (user.company.id !== companyId) {
      throw new ForbiddenException(
        'You can only access transactions for your assigned company',
      );
    }
  }

  private async getUserCompanyIds(currentUser: User): Promise<number[] | null> {
    if (currentUser.role === 'admin') return null; // null = all companies

    const user = await this.userRepository.findOne({
      where: { id: currentUser.id },
      relations: ['company'],
    });

    return user?.company ? [user.company.id] : [];
  }

  // ─── Create ───────────────────────────────────────────────────────────────

  async createTransaction(
    createTransactionDto: CreateTransactionDto,
    currentUser: User,
  ) {
    await this.validateUserCompanyAccess(
      currentUser,
      createTransactionDto.companyId,
    );

    const user = await this.userRepository.findOne({
      where: { id: createTransactionDto.createdBy },
    });
    if (!user) {
      throw new NotFoundException(
        `User with ID ${createTransactionDto.createdBy} not found`,
      );
    }

    const company = await this.companyService.findCompanyByID(
      createTransactionDto.companyId,
    );
    if (!company) {
      throw new NotFoundException(
        `Company with ID ${createTransactionDto.companyId} not found`,
      );
    }

    const category = await this.categoryService.findCategoryByID(
      createTransactionDto.categoryId,
    );
    if (!category) {
      throw new NotFoundException(
        `Category with ID ${createTransactionDto.categoryId} not found`,
      );
    }

    if (category.level !== CategoryLevel.SUB_SUB) {
      throw new BadRequestException(
        `Category "${category.name}" is not a transaction-level category. ` +
          `Please select a sub-sub category (leaf level). ` +
          `Current level: ${category.level}`,
      );
    }

    if (!category.allowTransactions) {
      throw new BadRequestException(
        `Category "${category.name}" does not allow transactions.`,
      );
    }

    let taxAmount = createTransactionDto.taxAmount || 0;
    if (createTransactionDto.taxRate && !createTransactionDto.taxAmount) {
      taxAmount =
        (createTransactionDto.amount * createTransactionDto.taxRate) / 100;
    }

    const transaction = this.transactionRepository.create({
      date: new Date(createTransactionDto.date),
      transactionType: createTransactionDto.transactionType,
      amount: createTransactionDto.amount,
      description: createTransactionDto.description,
      referenceNumber: createTransactionDto.referenceNumber,
      paymentMethod: createTransactionDto.paymentMethod,
      status: createTransactionDto.status || TransactionStatus.COMPLETED,
      counterparty: createTransactionDto.counterparty,
      invoiceNumber: createTransactionDto.invoiceNumber,
      dueDate: createTransactionDto.dueDate
        ? new Date(createTransactionDto.dueDate)
        : undefined,
      taxRate: createTransactionDto.taxRate || 0,
      taxAmount,
      notes: createTransactionDto.notes,
      attachments: createTransactionDto.attachments,
      isRecurring: createTransactionDto.isRecurring || false,
      recurringFrequency: createTransactionDto.recurringFrequency || null,
      recurringEndDate: createTransactionDto.recurringEndDate
        ? new Date(createTransactionDto.recurringEndDate)
        : null,
      recurringExecutionCount:
        createTransactionDto.recurringExecutionCount || null,
      isRecurringActive: createTransactionDto.isRecurring || false,
      createdBy: user,
      company,
      category,
    });

    try {
      const savedTransaction =
        await this.transactionRepository.save(transaction);
      const fullCategory = await this.categoryService.getCategoryById(
        category.id,
      );

      return {
        status: 201,
        message: 'Transaction created successfully',
        transaction: {
          ...savedTransaction,
          category: fullCategory,
          categoryPath: fullCategory.getFullPath(),
        },
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to create transaction: ${error.message}`,
      );
    }
  }

  // ─── Find All ─────────────────────────────────────────────────────────────

  async findAllTransactions(currentUser: User, pagination: PaginationDto) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    try {
      const companyIds = await this.getUserCompanyIds(currentUser);

      if (companyIds !== null && companyIds.length === 0) {
        return {
          status: 200,
          message: 'No transactions available',
          ...paginate([], 0, page, limit),
        };
      }

      const queryBuilder = this.transactionRepository
        .createQueryBuilder('transaction')
        .leftJoinAndSelect('transaction.company', 'company')
        .leftJoinAndSelect('transaction.category', 'category')
        .leftJoinAndSelect('category.parent', 'parent')
        .leftJoinAndSelect('parent.parent', 'grandparent')
        .leftJoinAndSelect('transaction.createdBy', 'createdBy')
        .orderBy('transaction.date', 'DESC')
        .skip(skip)
        .take(limit);

      if (companyIds !== null && companyIds.length > 0) {
        queryBuilder.andWhere('company.id IN (:...companyIds)', { companyIds });
      }

      const [transactions, total] = await queryBuilder.getManyAndCount();

      return {
        status: 200,
        message: 'Transactions retrieved successfully',
        ...paginate(
          transactions.map((t) => ({
            ...t,
            categoryPath: t.category.getFullPath(),
          })),
          total,
          page,
          limit,
        ),
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to retrieve transactions: ${error.message}`,
      );
    }
  }

  // ─── Find One ─────────────────────────────────────────────────────────────

  async findTransactionById(id: number, currentUser: User) {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: [
        'company',
        'category',
        'category.parent',
        'category.parent.parent',
        'createdBy',
      ],
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    await this.validateUserCompanyAccess(currentUser, transaction.company.id);

    return {
      status: 200,
      message: 'Transaction retrieved successfully',
      transaction: {
        ...transaction,
        categoryPath: transaction.category.getFullPath(),
      },
    };
  }

  // ─── Find By Company ──────────────────────────────────────────────────────

  async findTransactionsByCompany(
    companyId: number,
    currentUser: User,
    pagination: PaginationDto,
  ) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    await this.validateUserCompanyAccess(currentUser, companyId);

    const company = await this.companyService.findCompanyByID(companyId);
    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }

    const [transactions, total] = await this.transactionRepository.findAndCount(
      {
        where: { company: { id: companyId } },
        relations: [
          'company',
          'category',
          'category.parent',
          'category.parent.parent',
          'createdBy',
        ],
        order: { date: 'DESC' },
        skip,
        take: limit,
      },
    );

    return {
      status: 200,
      message: `Transactions for company ${company.name} retrieved successfully`,
      ...paginate(
        transactions.map((t) => ({
          ...t,
          categoryPath: t.category.getFullPath(),
        })),
        total,
        page,
        limit,
      ),
    };
  }

  // ─── Find By Category ─────────────────────────────────────────────────────

  async findTransactionsByCategory(
    categoryId: number,
    currentUser: User,
    pagination: PaginationDto,
  ) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const category = await this.categoryService.findCategoryByID(categoryId);
    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    const companyIds = await this.getUserCompanyIds(currentUser);

    const queryBuilder = this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.company', 'company')
      .leftJoinAndSelect('transaction.category', 'category')
      .leftJoinAndSelect('category.parent', 'parent')
      .leftJoinAndSelect('parent.parent', 'grandparent')
      .leftJoinAndSelect('transaction.createdBy', 'createdBy')
      .where('category.id = :categoryId', { categoryId })
      .orderBy('transaction.date', 'DESC')
      .skip(skip)
      .take(limit);

    if (companyIds !== null && companyIds.length > 0) {
      queryBuilder.andWhere('company.id IN (:...companyIds)', { companyIds });
    }

    const [transactions, total] = await queryBuilder.getManyAndCount();

    return {
      status: 200,
      message: `Transactions for category ${category.name} retrieved successfully`,
      ...paginate(transactions, total, page, limit),
    };
  }

  // ─── Find By Date Range ───────────────────────────────────────────────────

  async findTransactionsByDateRange(
    companyId: number,
    startDate: string,
    endDate: string,
    currentUser: User,
    pagination: PaginationDto,
  ) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    await this.validateUserCompanyAccess(currentUser, companyId);

    const company = await this.companyService.findCompanyByID(companyId);
    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }

    const [transactions, total] = await this.transactionRepository.findAndCount(
      {
        where: {
          company: { id: companyId },
          date: Between(new Date(startDate), new Date(endDate)),
        },
        relations: ['category', 'category.parent', 'category.parent.parent'],
        order: { date: 'ASC' },
        skip,
        take: limit,
      },
    );

    return {
      status: 200,
      message: 'Transactions retrieved successfully',
      dateRange: { startDate, endDate },
      ...paginate(
        transactions.map((t) => ({
          ...t,
          categoryPath: t.category.getFullPath(),
        })),
        total,
        page,
        limit,
      ),
    };
  }

  // ─── Recurring ────────────────────────────────────────────────────────────

  async getRecurringTransactions(currentUser: User, pagination: PaginationDto) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const companyIds = await this.getUserCompanyIds(currentUser);

    if (companyIds !== null && companyIds.length === 0) {
      return {
        status: 200,
        message: 'No recurring transactions available',
        ...paginate([], 0, page, limit),
      };
    }

    const queryBuilder = this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.company', 'company')
      .leftJoinAndSelect('transaction.category', 'category')
      .leftJoinAndSelect('category.parent', 'parent')
      .leftJoinAndSelect('parent.parent', 'grandparent')
      .leftJoinAndSelect('transaction.createdBy', 'createdBy')
      .where('transaction.isRecurring = :isRecurring', { isRecurring: true })
      .orderBy('transaction.date', 'DESC')
      .skip(skip)
      .take(limit);

    if (companyIds !== null && companyIds.length > 0) {
      queryBuilder.andWhere('company.id IN (:...companyIds)', { companyIds });
    }

    const [transactions, total] = await queryBuilder.getManyAndCount();

    return {
      status: 200,
      message: 'Recurring transactions retrieved successfully',
      ...paginate(
        transactions.map((t) => ({
          ...t,
          categoryPath: t.category.getFullPath(),
        })),
        total,
        page,
        limit,
      ),
    };
  }

  async getRecurringTransactionsByCompany(
    companyId: number,
    currentUser: User,
    pagination: PaginationDto,
  ) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    await this.validateUserCompanyAccess(currentUser, companyId);

    const company = await this.companyService.findCompanyByID(companyId);
    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }

    const [transactions, total] = await this.transactionRepository.findAndCount(
      {
        where: { company: { id: companyId }, isRecurring: true },
        relations: ['category', 'category.parent', 'category.parent.parent'],
        order: { date: 'DESC' },
        skip,
        take: limit,
      },
    );

    return {
      status: 200,
      message: `Recurring transactions for ${company.name}`,
      ...paginate(
        transactions.map((t) => ({
          ...t,
          categoryPath: t.category.getFullPath(),
        })),
        total,
        page,
        limit,
      ),
    };
  }

  async executeRecurringTransaction(id: number, currentUser: User) {
    const template = await this.transactionRepository.findOne({
      where: { id },
      relations: ['company', 'category', 'createdBy'],
    });

    if (!template) {
      throw new NotFoundException(
        `Recurring transaction template with ID ${id} not found`,
      );
    }

    await this.validateUserCompanyAccess(currentUser, template.company.id);

    if (!template.isRecurring) {
      throw new BadRequestException('This is not a recurring transaction');
    }

    const newTransaction = this.transactionRepository.create({
      date: new Date(),
      transactionType: template.transactionType,
      amount: template.amount,
      description: `${template.description} (Auto-generated from recurring)`,
      referenceNumber: template.referenceNumber
        ? `${template.referenceNumber}-AUTO-${Date.now()}`
        : undefined,
      paymentMethod: template.paymentMethod,
      status: template.status,
      counterparty: template.counterparty,
      taxRate: template.taxRate,
      taxAmount: template.taxAmount,
      notes: template.notes,
      isRecurring: false,
      company: template.company,
      category: template.category,
      createdBy: template.createdBy,
    });

    const savedTransaction =
      await this.transactionRepository.save(newTransaction);

    return {
      status: 201,
      message: 'Recurring transaction executed successfully',
      transaction: savedTransaction,
      template: {
        id: template.id,
        description: template.description,
        frequency: template.recurringFrequency,
      },
    };
  }

  // ─── Financial Reports ────────────────────────────────────────────────────

  async getIncomeStatement(companyId: number, year: number, currentUser: User) {
    await this.validateUserCompanyAccess(currentUser, companyId);

    const company = await this.companyService.findCompanyByID(companyId);
    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }

    const transactions = await this.transactionRepository.find({
      where: {
        company: { id: companyId },
        financialYear: year,
        status: TransactionStatus.COMPLETED,
      },
      relations: ['category', 'category.parent', 'category.parent.parent'],
    });

    const revenue = transactions
      .filter((t) => t.category.categoryType === CategoryType.REVENUE)
      .reduce((sum, t) => sum + Number(t.totalAmount), 0);

    const costOfSales = transactions
      .filter((t) => t.category.categoryType === CategoryType.COST_OF_SALES)
      .reduce((sum, t) => sum + Number(t.totalAmount), 0);

    const expenses = transactions
      .filter((t) => t.category.categoryType === CategoryType.EXPENSE)
      .reduce((sum, t) => sum + Number(t.totalAmount), 0);

    const grossProfit = revenue - costOfSales;
    const netProfit = grossProfit - expenses;

    return {
      status: 200,
      message: `Income Statement for ${company.name} - Year ${year}`,
      incomeStatement: {
        companyName: company.name,
        period: year,
        revenue: {
          total: revenue,
          breakdown: this.groupByCategory(
            transactions.filter(
              (t) => t.category.categoryType === CategoryType.REVENUE,
            ),
          ),
        },
        costOfSales: {
          total: costOfSales,
          breakdown: this.groupByCategory(
            transactions.filter(
              (t) => t.category.categoryType === CategoryType.COST_OF_SALES,
            ),
          ),
        },
        grossProfit,
        operatingExpenses: {
          total: expenses,
          breakdown: this.groupByCategory(
            transactions.filter(
              (t) => t.category.categoryType === CategoryType.EXPENSE,
            ),
          ),
        },
        netProfit,
        profitMargin:
          revenue > 0 ? ((netProfit / revenue) * 100).toFixed(2) + '%' : '0%',
      },
    };
  }

  async getBalanceSheet(
    companyId: number,
    asOfDate: string,
    currentUser: User,
  ) {
    await this.validateUserCompanyAccess(currentUser, companyId);

    const company = await this.companyService.findCompanyByID(companyId);
    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }

    const transactions = await this.transactionRepository.find({
      where: {
        company: { id: companyId },
        status: TransactionStatus.COMPLETED,
      },
      relations: ['category', 'category.parent', 'category.parent.parent'],
    });

    const filtered = transactions.filter(
      (t) => new Date(t.date) <= new Date(asOfDate),
    );

    const assetTxns = filtered.filter(
      (t) => t.category.categoryType === CategoryType.ASSET,
    );
    const liabilityTxns = filtered.filter(
      (t) => t.category.categoryType === CategoryType.LIABILITY,
    );
    const equityTxns = filtered.filter(
      (t) => t.category.categoryType === CategoryType.EQUITY,
    );

    const totalAssets = this.calculateNetAmount(assetTxns);
    const totalLiabilities = this.calculateNetAmount(liabilityTxns);
    const totalEquity = this.calculateNetAmount(equityTxns);

    const revenueTotal = filtered
      .filter((t) => t.category.categoryType === CategoryType.REVENUE)
      .reduce((sum, t) => sum + Number(t.totalAmount), 0);
    const expenseTotal = filtered
      .filter((t) => t.category.categoryType === CategoryType.EXPENSE)
      .reduce((sum, t) => sum + Number(t.totalAmount), 0);
    const costOfSalesTotal = filtered
      .filter((t) => t.category.categoryType === CategoryType.COST_OF_SALES)
      .reduce((sum, t) => sum + Number(t.totalAmount), 0);

    const retainedEarnings = revenueTotal - expenseTotal - costOfSalesTotal;
    const totalEquityWithRetained = totalEquity + retainedEarnings;

    return {
      status: 200,
      message: `Balance Sheet for ${company.name} as of ${asOfDate}`,
      balanceSheet: {
        companyName: company.name,
        asOfDate,
        assets: {
          total: totalAssets,
          breakdown: this.groupByCategory(assetTxns),
        },
        liabilities: {
          total: totalLiabilities,
          breakdown: this.groupByCategory(liabilityTxns),
        },
        equity: {
          capitalContributed: totalEquity,
          retainedEarnings,
          total: totalEquityWithRetained,
          breakdown: this.groupByCategory(equityTxns),
        },
        totalLiabilitiesAndEquity: totalLiabilities + totalEquityWithRetained,
        balanceCheck:
          Math.abs(totalAssets - (totalLiabilities + totalEquityWithRetained)) <
          0.01
            ? 'BALANCED'
            : 'UNBALANCED',
      },
    };
  }

  async getCashBook(
    companyId: number,
    startDate: string,
    endDate: string,
    currentUser: User,
    pagination: PaginationDto,
  ) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    await this.validateUserCompanyAccess(currentUser, companyId);

    const company = await this.companyService.findCompanyByID(companyId);
    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }

    // Fetch ALL transactions to calculate running balance correctly, then paginate presentation
    const allTransactions = await this.transactionRepository.find({
      where: {
        company: { id: companyId },
        date: Between(new Date(startDate), new Date(endDate)),
        status: TransactionStatus.COMPLETED,
      },
      relations: ['category', 'category.parent', 'category.parent.parent'],
      order: { date: 'ASC' },
    });

    let runningBalance = 0;
    const allCashFlows = allTransactions.map((t) => {
      const isCashIn = t.transactionType === 'debit';
      const amount = Number(t.totalAmount);
      runningBalance += isCashIn ? amount : -amount;
      return {
        date: t.date,
        description: t.description,
        reference: t.referenceNumber,
        category: t.category.getFullPath(),
        paymentMethod: t.paymentMethod,
        cashIn: isCashIn ? amount : 0,
        cashOut: isCashIn ? 0 : amount,
        balance: runningBalance,
        counterparty: t.counterparty,
      };
    });

    const total = allCashFlows.length;
    const paginatedFlows = allCashFlows.slice(skip, skip + limit);
    const totalCashIn = allCashFlows.reduce((sum, cf) => sum + cf.cashIn, 0);
    const totalCashOut = allCashFlows.reduce((sum, cf) => sum + cf.cashOut, 0);

    return {
      status: 200,
      message: `Cash Book for ${company.name}`,
      cashBook: {
        companyName: company.name,
        period: { startDate, endDate },
        openingBalance: 0,
        totalCashIn,
        totalCashOut,
        closingBalance: runningBalance,
      },
      ...paginate(paginatedFlows, total, page, limit),
    };
  }

  // ─── Update / Delete ──────────────────────────────────────────────────────

  async updateTransaction(
    id: number,
    updateTransactionDto: UpdateTransactionDto,
    currentUser: User,
  ) {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: ['company', 'category', 'createdBy'],
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    await this.validateUserCompanyAccess(currentUser, transaction.company.id);

    if (updateTransactionDto.categoryId) {
      const category = await this.categoryService.findCategoryByID(
        updateTransactionDto.categoryId,
      );
      if (!category) {
        throw new NotFoundException(
          `Category with ID ${updateTransactionDto.categoryId} not found`,
        );
      }
      if (category.level !== CategoryLevel.SUB_SUB) {
        throw new BadRequestException(
          `Category "${category.name}" is not a transaction-level category.`,
        );
      }
      transaction.category = category;
    }

    if (updateTransactionDto.date)
      transaction.date = new Date(updateTransactionDto.date);
    if (updateTransactionDto.transactionType)
      transaction.transactionType = updateTransactionDto.transactionType;
    if (updateTransactionDto.amount)
      transaction.amount = updateTransactionDto.amount;
    if (updateTransactionDto.description)
      transaction.description = updateTransactionDto.description;
    if (updateTransactionDto.referenceNumber !== undefined)
      transaction.referenceNumber = updateTransactionDto.referenceNumber;
    if (updateTransactionDto.paymentMethod)
      transaction.paymentMethod = updateTransactionDto.paymentMethod;
    if (updateTransactionDto.status)
      transaction.status = updateTransactionDto.status;
    if (updateTransactionDto.counterparty !== undefined)
      transaction.counterparty = updateTransactionDto.counterparty;
    if (updateTransactionDto.invoiceNumber !== undefined)
      transaction.invoiceNumber = updateTransactionDto.invoiceNumber;
    if (updateTransactionDto.dueDate)
      transaction.dueDate = new Date(updateTransactionDto.dueDate);
    if (updateTransactionDto.taxRate !== undefined)
      transaction.taxRate = updateTransactionDto.taxRate;
    if (updateTransactionDto.taxAmount !== undefined)
      transaction.taxAmount = updateTransactionDto.taxAmount;
    if (updateTransactionDto.notes !== undefined)
      transaction.notes = updateTransactionDto.notes;

    try {
      const updatedTransaction =
        await this.transactionRepository.save(transaction);
      return {
        status: 200,
        message: 'Transaction updated successfully',
        transaction: updatedTransaction,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to update transaction: ${error.message}`,
      );
    }
  }

  async deleteTransaction(id: number, currentUser: User) {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: ['company'],
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    await this.validateUserCompanyAccess(currentUser, transaction.company.id);

    try {
      await this.transactionRepository.softDelete(id);
      return { status: 200, message: 'Transaction deleted successfully' };
    } catch (error) {
      throw new BadRequestException(
        `Failed to delete transaction: ${error.message}`,
      );
    }
  }

  // ─── Global Reports ───────────────────────────────────────────────────────

  async getGlobalIncomeStatement(year: number, currentUser: User) {
    if (currentUser.role !== 'admin') {
      throw new ForbiddenException(
        'Only admins can access global financial reports',
      );
    }

    const transactions = await this.transactionRepository.find({
      where: { financialYear: year, status: TransactionStatus.COMPLETED },
      relations: [
        'company',
        'category',
        'category.parent',
        'category.parent.parent',
      ],
    });

    const companiesMap = new Map<
      number,
      { companyId: number; companyName: string; transactions: Transaction[] }
    >();
    transactions.forEach((t) => {
      if (!companiesMap.has(t.company.id)) {
        companiesMap.set(t.company.id, {
          companyId: t.company.id,
          companyName: t.company.name,
          transactions: [],
        });
      }
      companiesMap.get(t.company.id).transactions.push(t);
    });

    const companyReports = Array.from(companiesMap.values()).map((company) => {
      const revenue = company.transactions
        .filter((t) => t.category.categoryType === CategoryType.REVENUE)
        .reduce((sum, t) => sum + Number(t.totalAmount), 0);
      const costOfSales = company.transactions
        .filter((t) => t.category.categoryType === CategoryType.COST_OF_SALES)
        .reduce((sum, t) => sum + Number(t.totalAmount), 0);
      const expenses = company.transactions
        .filter((t) => t.category.categoryType === CategoryType.EXPENSE)
        .reduce((sum, t) => sum + Number(t.totalAmount), 0);
      const grossProfit = revenue - costOfSales;
      const netProfit = grossProfit - expenses;
      return {
        companyId: company.companyId,
        companyName: company.companyName,
        revenue,
        costOfSales,
        grossProfit,
        operatingExpenses: expenses,
        netProfit,
        profitMargin:
          revenue > 0 ? ((netProfit / revenue) * 100).toFixed(2) + '%' : '0%',
      };
    });

    const totalRevenue = companyReports.reduce((sum, c) => sum + c.revenue, 0);
    const totalCostOfSales = companyReports.reduce(
      (sum, c) => sum + c.costOfSales,
      0,
    );
    const totalExpenses = companyReports.reduce(
      (sum, c) => sum + c.operatingExpenses,
      0,
    );
    const totalGrossProfit = totalRevenue - totalCostOfSales;
    const totalNetProfit = totalGrossProfit - totalExpenses;

    return {
      status: 200,
      message: `Global Income Statement - Year ${year}`,
      summary: {
        period: year,
        totalCompanies: companyReports.length,
        totalRevenue,
        totalCostOfSales,
        totalGrossProfit,
        totalOperatingExpenses: totalExpenses,
        totalNetProfit,
        averageProfitMargin:
          totalRevenue > 0
            ? ((totalNetProfit / totalRevenue) * 100).toFixed(2) + '%'
            : '0%',
      },
      companies: companyReports,
    };
  }

  async getGlobalBalanceSheet(asOfDate: string, currentUser: User) {
    if (currentUser.role !== 'admin') {
      throw new ForbiddenException(
        'Only admins can access global financial reports',
      );
    }

    const transactions = await this.transactionRepository.find({
      where: { status: TransactionStatus.COMPLETED },
      relations: [
        'company',
        'category',
        'category.parent',
        'category.parent.parent',
      ],
    });

    const filtered = transactions.filter(
      (t) => new Date(t.date) <= new Date(asOfDate),
    );

    const companiesMap = new Map<number, any>();
    filtered.forEach((t) => {
      if (!companiesMap.has(t.company.id)) {
        companiesMap.set(t.company.id, {
          companyId: t.company.id,
          companyName: t.company.name,
          transactions: [],
        });
      }
      companiesMap.get(t.company.id).transactions.push(t);
    });

    const companyReports = Array.from(companiesMap.values()).map((company) => {
      const totalAssets = this.calculateNetAmount(
        company.transactions.filter(
          (t) => t.category.categoryType === CategoryType.ASSET,
        ),
      );
      const totalLiabilities = this.calculateNetAmount(
        company.transactions.filter(
          (t) => t.category.categoryType === CategoryType.LIABILITY,
        ),
      );
      const totalEquity = this.calculateNetAmount(
        company.transactions.filter(
          (t) => t.category.categoryType === CategoryType.EQUITY,
        ),
      );
      const revenue = company.transactions
        .filter((t) => t.category.categoryType === CategoryType.REVENUE)
        .reduce((sum, t) => sum + Number(t.totalAmount), 0);
      const expenses = company.transactions
        .filter((t) => t.category.categoryType === CategoryType.EXPENSE)
        .reduce((sum, t) => sum + Number(t.totalAmount), 0);
      const costOfSales = company.transactions
        .filter((t) => t.category.categoryType === CategoryType.COST_OF_SALES)
        .reduce((sum, t) => sum + Number(t.totalAmount), 0);
      const retainedEarnings = revenue - expenses - costOfSales;

      return {
        companyId: company.companyId,
        companyName: company.companyName,
        totalAssets,
        totalLiabilities,
        totalEquity: totalEquity + retainedEarnings,
        retainedEarnings,
        balanceCheck:
          Math.abs(
            totalAssets - (totalLiabilities + totalEquity + retainedEarnings),
          ) < 0.01
            ? 'BALANCED'
            : 'UNBALANCED',
      };
    });

    const totalAssets = companyReports.reduce(
      (sum, c) => sum + c.totalAssets,
      0,
    );
    const totalLiabilities = companyReports.reduce(
      (sum, c) => sum + c.totalLiabilities,
      0,
    );
    const totalEquity = companyReports.reduce(
      (sum, c) => sum + c.totalEquity,
      0,
    );

    return {
      status: 200,
      message: `Global Balance Sheet as of ${asOfDate}`,
      summary: {
        asOfDate,
        totalCompanies: companyReports.length,
        totalAssets,
        totalLiabilities,
        totalEquity,
        balanceCheck:
          Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01
            ? 'BALANCED'
            : 'UNBALANCED',
      },
      companies: companyReports,
    };
  }

  async getGlobalCashBook(
    startDate: string,
    endDate: string,
    currentUser: User,
    pagination: PaginationDto,
  ) {
    if (currentUser.role !== 'admin') {
      throw new ForbiddenException(
        'Only admins can access global financial reports',
      );
    }

    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const transactions = await this.transactionRepository.find({
      where: {
        date: Between(new Date(startDate), new Date(endDate)),
        status: TransactionStatus.COMPLETED,
      },
      relations: [
        'company',
        'category',
        'category.parent',
        'category.parent.parent',
      ],
      order: { date: 'ASC' },
    });

    const companiesMap = new Map<number, any>();
    transactions.forEach((t) => {
      if (!companiesMap.has(t.company.id)) {
        companiesMap.set(t.company.id, {
          companyId: t.company.id,
          companyName: t.company.name,
          transactions: [],
        });
      }
      companiesMap.get(t.company.id).transactions.push(t);
    });

    const allCompanyReports = Array.from(companiesMap.values()).map(
      (company) => {
        const totalCashIn = company.transactions
          .filter((t) => t.transactionType === 'debit')
          .reduce((sum, t) => sum + Number(t.totalAmount), 0);
        const totalCashOut = company.transactions
          .filter((t) => t.transactionType === 'credit')
          .reduce((sum, t) => sum + Number(t.totalAmount), 0);
        return {
          companyId: company.companyId,
          companyName: company.companyName,
          totalCashIn,
          totalCashOut,
          netCashFlow: totalCashIn - totalCashOut,
          transactionCount: company.transactions.length,
        };
      },
    );

    const totalCashIn = allCompanyReports.reduce(
      (sum, c) => sum + c.totalCashIn,
      0,
    );
    const totalCashOut = allCompanyReports.reduce(
      (sum, c) => sum + c.totalCashOut,
      0,
    );
    const total = allCompanyReports.length;
    const paginatedCompanies = allCompanyReports.slice(skip, skip + limit);

    return {
      status: 200,
      message: 'Global Cash Book',
      summary: {
        period: { startDate, endDate },
        totalCashIn,
        totalCashOut,
        netCashFlow: totalCashIn - totalCashOut,
      },
      ...paginate(paginatedCompanies, total, page, limit),
    };
  }

  async getGlobalFinancialSummary(year: number, currentUser: User) {
    if (currentUser.role !== 'admin') {
      throw new ForbiddenException(
        'Only admins can access global financial reports',
      );
    }

    const transactions = await this.transactionRepository.find({
      where: { financialYear: year, status: TransactionStatus.COMPLETED },
      relations: [
        'company',
        'category',
        'category.parent',
        'category.parent.parent',
      ],
    });

    const totalTransactions = transactions.length;

    const totalRevenue = transactions
      .filter((t) => t.category.categoryType === CategoryType.REVENUE)
      .reduce((sum, t) => sum + Number(t.totalAmount), 0);

    const totalExpenses = transactions
      .filter((t) => t.category.categoryType === CategoryType.EXPENSE)
      .reduce((sum, t) => sum + Number(t.totalAmount), 0);

    const totalCostOfSales = transactions
      .filter((t) => t.category.categoryType === CategoryType.COST_OF_SALES)
      .reduce((sum, t) => sum + Number(t.totalAmount), 0);

    const totalAssets = this.calculateNetAmount(
      transactions.filter(
        (t) => t.category.categoryType === CategoryType.ASSET,
      ),
    );

    const totalLiabilities = this.calculateNetAmount(
      transactions.filter(
        (t) => t.category.categoryType === CategoryType.LIABILITY,
      ),
    );

    const uniqueCompanies = new Set(transactions.map((t) => t.company.id));
    const categoryBreakdown = this.groupByCategory(transactions);

    const paymentMethodBreakdown = transactions.reduce((acc, t) => {
      if (!acc[t.paymentMethod]) {
        acc[t.paymentMethod] = {
          method: t.paymentMethod,
          count: 0,
          totalAmount: 0,
        };
      }
      acc[t.paymentMethod].count += 1;
      acc[t.paymentMethod].totalAmount += Number(t.totalAmount);
      return acc;
    }, {});

    const monthlyTrends = this.calculateMonthlyTrends(transactions);
    const categoryTypeDistribution =
      this.calculateCategoryTypeDistribution(transactions);
    const companyPerformance = this.calculateCompanyPerformance(
      transactions,
      uniqueCompanies,
    );
    const cashFlowAnalysis = this.calculateCashFlowAnalysis(transactions);

    const transactionVelocity = {
      total: totalTransactions,
      averagePerCompany:
        uniqueCompanies.size > 0
          ? (totalTransactions / uniqueCompanies.size).toFixed(2)
          : 0,
      mostActive: this.getMostActiveCompany(transactions),
      leastActive: this.getLeastActiveCompany(transactions),
    };

    const financialRatios = {
      profitMargin:
        totalRevenue > 0
          ? (
              ((totalRevenue - totalExpenses - totalCostOfSales) /
                totalRevenue) *
              100
            ).toFixed(2)
          : '0',
      grossProfitMargin:
        totalRevenue > 0
          ? (((totalRevenue - totalCostOfSales) / totalRevenue) * 100).toFixed(
              2,
            )
          : '0',
      debtToAssetRatio:
        totalAssets > 0
          ? ((totalLiabilities / totalAssets) * 100).toFixed(2)
          : '0',
      currentRatio:
        totalLiabilities > 0
          ? (totalAssets / totalLiabilities).toFixed(2)
          : 'N/A',
    };

    const expenseBreakdown = this.getExpenseBreakdown(transactions);
    const revenueStreams = this.getRevenueStreams(transactions);

    const topTransactions = {
      largest: [...transactions]
        .sort((a, b) => Number(b.totalAmount) - Number(a.totalAmount))
        .slice(0, 5)
        .map((t) => ({
          id: t.id,
          date: t.date,
          amount: Number(t.totalAmount),
          description: t.description,
          company: t.company.name,
          category: t.category.getFullPath(),
        })),
      mostRecent: [...transactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5)
        .map((t) => ({
          id: t.id,
          date: t.date,
          amount: Number(t.totalAmount),
          description: t.description,
          company: t.company.name,
          category: t.category.getFullPath(),
        })),
    };

    const paymentMethodEfficiency =
      this.calculatePaymentMethodEfficiency(transactions);
    const counterpartyAnalysis = this.analyzeCounterparties(transactions);
    const taxAnalysis = {
      totalTaxCollected: transactions.reduce(
        (sum, t) => sum + (Number(t.taxAmount) || 0),
        0,
      ),
      averageTaxRate: this.calculateAverageTaxRate(transactions),
      taxByCategory: this.getTaxByCategory(transactions),
    };

    return {
      status: 200,
      message: `Global Financial Summary - Year ${year}`,
      summary: {
        year,
        totalCompanies: uniqueCompanies.size,
        totalTransactions,
        revenue: {
          total: totalRevenue,
          averagePerCompany:
            uniqueCompanies.size > 0 ? totalRevenue / uniqueCompanies.size : 0,
          breakdown: revenueStreams,
        },
        expenses: {
          total: totalExpenses,
          averagePerCompany:
            uniqueCompanies.size > 0 ? totalExpenses / uniqueCompanies.size : 0,
          breakdown: expenseBreakdown,
        },
        costOfSales: totalCostOfSales,
        netProfit: totalRevenue - totalExpenses - totalCostOfSales,
        assets: totalAssets,
        liabilities: totalLiabilities,
        categoryBreakdown,
        paymentMethods: Object.values(paymentMethodBreakdown),
        analytics: {
          monthlyTrends,
          categoryTypeDistribution,
          companyPerformance,
          cashFlowAnalysis,
          transactionVelocity,
          financialRatios,
          topTransactions,
          paymentMethodEfficiency,
          counterpartyAnalysis,
          taxAnalysis,
        },
      },
    };
  }

  async getCompanyComparison(year: number, currentUser: User) {
    if (currentUser.role !== 'admin') {
      throw new ForbiddenException(
        'Only admins can access global financial reports',
      );
    }

    const transactions = await this.transactionRepository.find({
      where: { financialYear: year, status: TransactionStatus.COMPLETED },
      relations: ['company', 'category'],
    });

    const companiesMap = new Map<number, any>();
    transactions.forEach((t) => {
      if (!companiesMap.has(t.company.id)) {
        companiesMap.set(t.company.id, {
          companyId: t.company.id,
          companyName: t.company.name,
          transactions: [],
        });
      }
      companiesMap.get(t.company.id).transactions.push(t);
    });

    const companyMetrics = Array.from(companiesMap.values()).map((company) => {
      const revenue = company.transactions
        .filter((t) => t.category.categoryType === CategoryType.REVENUE)
        .reduce((sum, t) => sum + Number(t.totalAmount), 0);
      const expenses = company.transactions
        .filter((t) => t.category.categoryType === CategoryType.EXPENSE)
        .reduce((sum, t) => sum + Number(t.totalAmount), 0);
      const costOfSales = company.transactions
        .filter((t) => t.category.categoryType === CategoryType.COST_OF_SALES)
        .reduce((sum, t) => sum + Number(t.totalAmount), 0);
      const netProfit = revenue - expenses - costOfSales;
      const grossProfit = revenue - costOfSales;
      const assets = this.calculateNetAmount(
        company.transactions.filter(
          (t) => t.category.categoryType === CategoryType.ASSET,
        ),
      );
      const liabilities = this.calculateNetAmount(
        company.transactions.filter(
          (t) => t.category.categoryType === CategoryType.LIABILITY,
        ),
      );

      return {
        companyId: company.companyId,
        companyName: company.companyName,
        revenue,
        expenses,
        costOfSales,
        grossProfit,
        netProfit,
        profitMargin:
          revenue > 0 ? ((netProfit / revenue) * 100).toFixed(2) : '0',
        assets,
        liabilities,
        equity: assets - liabilities,
        transactionCount: company.transactions.length,
        averageTransactionSize:
          company.transactions.length > 0
            ? company.transactions.reduce(
                (sum, t) => sum + Number(t.totalAmount),
                0,
              ) / company.transactions.length
            : 0,
      };
    });

    return {
      status: 200,
      message: `Company Comparison - Year ${year}`,
      summary: {
        year,
        totalCompanies: companyMetrics.length,
        topPerformers: {
          byRevenue: [...companyMetrics]
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5),
          byProfit: [...companyMetrics]
            .sort((a, b) => b.netProfit - a.netProfit)
            .slice(0, 5),
          byProfitMargin: [...companyMetrics]
            .sort(
              (a, b) => parseFloat(b.profitMargin) - parseFloat(a.profitMargin),
            )
            .slice(0, 5),
        },
        allCompanies: companyMetrics,
      },
    };
  }

  // ─── Recurring Status / Pause / Resume ────────────────────────────────────

  async getRecurringTransactionStatus(id: number, currentUser: User) {
    const transaction = await this.transactionRepository.findOne({
      where: { id, isRecurring: true },
      relations: ['company'],
    });
    if (!transaction) {
      throw new NotFoundException(`Recurring transaction ${id} not found`);
    }
    await this.validateUserCompanyAccess(currentUser, transaction.company.id);
    return this.recurringTransactionService.getRecurringTransactionStatus(id);
  }

  async pauseRecurringTransaction(id: number, currentUser: User) {
    const transaction = await this.transactionRepository.findOne({
      where: { id, isRecurring: true },
      relations: ['company'],
    });
    if (!transaction) {
      throw new NotFoundException(`Recurring transaction ${id} not found`);
    }
    await this.validateUserCompanyAccess(currentUser, transaction.company.id);
    await this.recurringTransactionService.pauseRecurringTransaction(id);
    return {
      status: 200,
      message: 'Recurring transaction paused successfully',
    };
  }

  async resumeRecurringTransaction(id: number, currentUser: User) {
    const transaction = await this.transactionRepository.findOne({
      where: { id, isRecurring: true },
      relations: ['company'],
    });
    if (!transaction) {
      throw new NotFoundException(`Recurring transaction ${id} not found`);
    }
    await this.validateUserCompanyAccess(currentUser, transaction.company.id);
    await this.recurringTransactionService.resumeRecurringTransaction(id);
    return {
      status: 200,
      message: 'Recurring transaction resumed successfully',
    };
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private groupByCategory(transactions: Transaction[]) {
    const grouped = transactions.reduce((acc, t) => {
      const categoryPath = t.category.getFullPath();
      if (!acc[categoryPath]) {
        acc[categoryPath] = {
          categoryId: t.category.id,
          categoryName: t.category.name,
          categoryPath,
          totalAmount: 0,
          transactionCount: 0,
        };
      }
      acc[categoryPath].totalAmount += Number(t.totalAmount);
      acc[categoryPath].transactionCount += 1;
      return acc;
    }, {});
    return Object.values(grouped);
  }

  private calculateNetAmount(transactions: Transaction[]): number {
    return transactions.reduce((sum, t) => {
      const amount = Number(t.totalAmount);
      if (t.category.categoryType === CategoryType.ASSET) {
        return sum + (t.transactionType === 'debit' ? amount : -amount);
      } else {
        return sum + (t.transactionType === 'credit' ? amount : -amount);
      }
    }, 0);
  }

  private calculateMonthlyTrends(transactions: Transaction[]) {
    const monthlyData = transactions.reduce((acc, t) => {
      const month = new Date(t.date).getMonth() + 1;
      if (!acc[month]) {
        acc[month] = {
          month,
          revenue: 0,
          expenses: 0,
          transactions: 0,
          netIncome: 0,
        };
      }
      const amount = Number(t.totalAmount);
      if (t.category.categoryType === CategoryType.REVENUE)
        acc[month].revenue += amount;
      else if (t.category.categoryType === CategoryType.EXPENSE)
        acc[month].expenses += amount;
      acc[month].transactions += 1;
      acc[month].netIncome = acc[month].revenue - acc[month].expenses;
      return acc;
    }, {});
    return Object.values(monthlyData).sort(
      (a: any, b: any) => a.month - b.month,
    );
  }

  private calculateCategoryTypeDistribution(transactions: Transaction[]) {
    const distribution = {};
    Object.values(CategoryType).forEach((type) => {
      const typeTransactions = transactions.filter(
        (t) => t.category.categoryType === type,
      );
      distribution[type] = {
        count: typeTransactions.length,
        totalAmount: typeTransactions.reduce(
          (sum, t) => sum + Number(t.totalAmount),
          0,
        ),
        percentage:
          transactions.length > 0
            ? ((typeTransactions.length / transactions.length) * 100).toFixed(2)
            : '0',
      };
    });
    return distribution;
  }

  private calculateCompanyPerformance(
    transactions: Transaction[],
    uniqueCompanies: Set<number>,
  ) {
    const companyData = {};
    transactions.forEach((t) => {
      if (!companyData[t.company.id]) {
        companyData[t.company.id] = {
          companyId: t.company.id,
          companyName: t.company.name,
          transactionCount: 0,
          totalVolume: 0,
          revenue: 0,
          expenses: 0,
          netIncome: 0,
        };
      }
      const amount = Number(t.totalAmount);
      companyData[t.company.id].transactionCount += 1;
      companyData[t.company.id].totalVolume += amount;
      if (t.category.categoryType === CategoryType.REVENUE)
        companyData[t.company.id].revenue += amount;
      else if (t.category.categoryType === CategoryType.EXPENSE)
        companyData[t.company.id].expenses += amount;
      companyData[t.company.id].netIncome =
        companyData[t.company.id].revenue - companyData[t.company.id].expenses;
    });
    return Object.values(companyData).sort(
      (a: any, b: any) => b.totalVolume - a.totalVolume,
    );
  }

  private calculateCashFlowAnalysis(transactions: Transaction[]) {
    const cashIn = transactions
      .filter((t) => t.transactionType === 'debit')
      .reduce((sum, t) => sum + Number(t.totalAmount), 0);
    const cashOut = transactions
      .filter((t) => t.transactionType === 'credit')
      .reduce((sum, t) => sum + Number(t.totalAmount), 0);
    return {
      totalCashIn: cashIn,
      totalCashOut: cashOut,
      netCashFlow: cashIn - cashOut,
      cashInTransactions: transactions.filter(
        (t) => t.transactionType === 'debit',
      ).length,
      cashOutTransactions: transactions.filter(
        (t) => t.transactionType === 'credit',
      ).length,
    };
  }

  private getMostActiveCompany(transactions: Transaction[]) {
    const counts = transactions.reduce((acc, t) => {
      acc[t.company.id] = (acc[t.company.id] || 0) + 1;
      return acc;
    }, {});
    const top = Object.entries(counts).sort(
      ([, a]: any, [, b]: any) => b - a,
    )[0];
    if (!top) return null;
    const company = transactions.find(
      (t) => t.company.id === Number(top[0]),
    )?.company;
    return {
      companyId: Number(top[0]),
      companyName: company?.name,
      transactionCount: top[1],
    };
  }

  private getLeastActiveCompany(transactions: Transaction[]) {
    const counts = transactions.reduce((acc, t) => {
      acc[t.company.id] = (acc[t.company.id] || 0) + 1;
      return acc;
    }, {});
    const bottom = Object.entries(counts).sort(
      ([, a]: any, [, b]: any) => (a as number) - (b as number),
    )[0];
    if (!bottom) return null;
    const company = transactions.find(
      (t) => t.company.id === Number(bottom[0]),
    )?.company;
    return {
      companyId: Number(bottom[0]),
      companyName: company?.name,
      transactionCount: bottom[1],
    };
  }

  private getExpenseBreakdown(transactions: Transaction[]) {
    const expenses = transactions.filter(
      (t) => t.category.categoryType === CategoryType.EXPENSE,
    );
    const breakdown = expenses.reduce((acc, t) => {
      const path = t.category.getFullPath();
      if (!acc[path]) acc[path] = { category: path, amount: 0, count: 0 };
      acc[path].amount += Number(t.totalAmount);
      acc[path].count += 1;
      return acc;
    }, {});
    return Object.values(breakdown).sort(
      (a: any, b: any) => b.amount - a.amount,
    );
  }

  private getRevenueStreams(transactions: Transaction[]) {
    const revenue = transactions.filter(
      (t) => t.category.categoryType === CategoryType.REVENUE,
    );
    const streams = revenue.reduce((acc, t) => {
      const path = t.category.getFullPath();
      if (!acc[path]) acc[path] = { category: path, amount: 0, count: 0 };
      acc[path].amount += Number(t.totalAmount);
      acc[path].count += 1;
      return acc;
    }, {});
    return Object.values(streams).sort((a: any, b: any) => b.amount - a.amount);
  }

  private calculatePaymentMethodEfficiency(transactions: Transaction[]) {
    const methodData = transactions.reduce((acc, t) => {
      if (!acc[t.paymentMethod]) {
        acc[t.paymentMethod] = {
          method: t.paymentMethod,
          totalAmount: 0,
          count: 0,
          averageAmount: 0,
          revenue: 0,
          expenses: 0,
        };
      }
      const amount = Number(t.totalAmount);
      acc[t.paymentMethod].totalAmount += amount;
      acc[t.paymentMethod].count += 1;
      if (t.category.categoryType === CategoryType.REVENUE)
        acc[t.paymentMethod].revenue += amount;
      else if (t.category.categoryType === CategoryType.EXPENSE)
        acc[t.paymentMethod].expenses += amount;
      return acc;
    }, {});
    Object.values(methodData).forEach((data: any) => {
      data.averageAmount =
        data.count > 0 ? (data.totalAmount / data.count).toFixed(2) : 0;
    });
    return Object.values(methodData);
  }

  private analyzeCounterparties(transactions: Transaction[]) {
    const counterparties = transactions
      .filter((t) => t.counterparty)
      .reduce((acc, t) => {
        if (!acc[t.counterparty]) {
          acc[t.counterparty] = {
            name: t.counterparty,
            transactionCount: 0,
            totalAmount: 0,
            revenue: 0,
            expenses: 0,
          };
        }
        const amount = Number(t.totalAmount);
        acc[t.counterparty].transactionCount += 1;
        acc[t.counterparty].totalAmount += amount;
        if (t.category.categoryType === CategoryType.REVENUE)
          acc[t.counterparty].revenue += amount;
        else if (t.category.categoryType === CategoryType.EXPENSE)
          acc[t.counterparty].expenses += amount;
        return acc;
      }, {});
    return Object.values(counterparties)
      .sort((a: any, b: any) => b.totalAmount - a.totalAmount)
      .slice(0, 10);
  }

  private calculateAverageTaxRate(transactions: Transaction[]) {
    const taxable = transactions.filter((t) => t.taxRate && t.taxRate > 0);
    if (taxable.length === 0) return '0';
    const total = taxable.reduce((sum, t) => sum + (t.taxRate || 0), 0);
    return (total / taxable.length).toFixed(2);
  }

  private getTaxByCategory(transactions: Transaction[]) {
    const taxData = transactions
      .filter((t) => t.taxAmount && t.taxAmount > 0)
      .reduce((acc, t) => {
        const path = t.category.getFullPath();
        if (!acc[path]) {
          acc[path] = {
            category: path,
            totalTax: 0,
            transactionCount: 0,
            averageTaxRate: 0,
            taxRates: [],
          };
        }
        acc[path].totalTax += Number(t.taxAmount);
        acc[path].transactionCount += 1;
        if (t.taxRate) acc[path].taxRates.push(t.taxRate);
        return acc;
      }, {});
    Object.values(taxData).forEach((data: any) => {
      if (data.taxRates.length > 0) {
        data.averageTaxRate = (
          data.taxRates.reduce((sum: number, r: number) => sum + r, 0) /
          data.taxRates.length
        ).toFixed(2);
      }
      delete data.taxRates;
    });
    return Object.values(taxData).sort(
      (a: any, b: any) => b.totalTax - a.totalTax,
    );
  }
}
