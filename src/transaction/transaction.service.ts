

// import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository, Between } from 'typeorm';
// import { CreateTransactionDto } from './dto/create-transaction.dto';
// import { UpdateTransactionDto } from './dto/update-transaction.dto';
// import { Transaction, TransactionStatus } from './entities/transaction.entity';
// import { UsersService } from 'src/users/users.service';
// import { CompanyService } from 'src/company/company.service';
// import { CategoryService } from 'src/category/category.service';
// import { CategoryLevel, CategoryType } from 'src/category/entities/category.entity';

// @Injectable()
// export class TransactionService {
//   constructor(
//     private readonly usersService: UsersService,
//     private readonly companyService: CompanyService,
//     private readonly categoryService: CategoryService,

//     @InjectRepository(Transaction)
//     private readonly transactionRepository: Repository<Transaction>,
//   ) {}

//   async createTransaction(createTransactionDto: CreateTransactionDto) {
//     // Find and validate user
//     const userResult = await this.usersService.findUserByID(createTransactionDto.createdBy);
//     if (!userResult || !userResult.user) {
//       throw new NotFoundException(`User with ID ${createTransactionDto.createdBy} not found`);
//     }

//     // Find and validate company
//     const company = await this.companyService.findCompanyByID(createTransactionDto.companyId);
//     if (!company) {
//       throw new NotFoundException(`Company with ID ${createTransactionDto.companyId} not found`);
//     }

//     // Find and validate category
//     const category = await this.categoryService.findCategoryByID(createTransactionDto.categoryId);
//     if (!category) {
//       throw new NotFoundException(`Category with ID ${createTransactionDto.categoryId} not found`);
//     }

//     // IMPORTANT: Validate that category is a leaf category (sub-sub level)
//     if (category.level !== CategoryLevel.SUB_SUB) {
//       throw new BadRequestException(
//         `Category "${category.name}" is not a transaction-level category. ` +
//         `Please select a sub-sub category (leaf level). ` +
//         `Current level: ${category.level}`
//       );
//     }

//     if (!category.allowTransactions) {
//       throw new BadRequestException(
//         `Category "${category.name}" does not allow transactions. ` +
//         `Please select a different category.`
//       );
//     }

//     // Calculate tax amount if tax rate is provided but tax amount is not
//     let taxAmount = createTransactionDto.taxAmount || 0;
//     if (createTransactionDto.taxRate && !createTransactionDto.taxAmount) {
//       taxAmount = (createTransactionDto.amount * createTransactionDto.taxRate) / 100;
//     }

//     // Create transaction with all fields
//     const transaction = this.transactionRepository.create({
//       date: new Date(createTransactionDto.date),
//       transactionType: createTransactionDto.transactionType,
//       amount: createTransactionDto.amount,
//       description: createTransactionDto.description,
//       referenceNumber: createTransactionDto.referenceNumber,
//       paymentMethod: createTransactionDto.paymentMethod,
//       status: createTransactionDto.status || TransactionStatus.COMPLETED,
//       counterparty: createTransactionDto.counterparty,
//       invoiceNumber: createTransactionDto.invoiceNumber,
//       dueDate: createTransactionDto.dueDate ? new Date(createTransactionDto.dueDate) : undefined,
//       taxRate: createTransactionDto.taxRate || 0,
//       taxAmount: taxAmount,
//       notes: createTransactionDto.notes,
//       attachments: createTransactionDto.attachments,
//       isRecurring: createTransactionDto.isRecurring || false,
//       recurringFrequency: createTransactionDto.recurringFrequency,
//       createdBy: userResult.user,
//       company: company,
//       category: category,
//     });

//     try {
//       const savedTransaction = await this.transactionRepository.save(transaction);

//       // Load full category hierarchy for response
//       const fullCategory = await this.categoryService.getCategoryById(category.id);

//       return {
//         status: 201,
//         message: 'Transaction created successfully',
//         transaction: {
//           ...savedTransaction,
//           category: fullCategory,
//           categoryPath: fullCategory.getFullPath()
//         },
//       };
//     } catch (error) {
//       console.error('Error saving transaction:', error);
//       throw new BadRequestException(`Failed to create transaction: ${error.message}`);
//     }
//   }

//   async findAllTransactions() {
//     try {
//       const transactions = await this.transactionRepository.find({
//         relations: ['company', 'category', 'category.parent', 'category.parent.parent', 'createdBy'],
//         order: { date: 'DESC' }
//       });

//       return {
//         status: 200,
//         message: 'Transactions retrieved successfully',
//         count: transactions.length,
//         transactions: transactions.map(t => ({
//           ...t,
//           categoryPath: t.category.getFullPath()
//         })),
//       };
//     } catch (error) {
//       console.error('Error retrieving transactions:', error);
//       throw new BadRequestException(`Failed to retrieve transactions: ${error.message}`);
//     }
//   }

//   async findTransactionById(id: number) {
//     const transaction = await this.transactionRepository.findOne({
//       where: { id },
//       relations: ['company', 'category', 'category.parent', 'category.parent.parent', 'createdBy']
//     });

//     if (!transaction) {
//       throw new NotFoundException(`Transaction with ID ${id} not found`);
//     }

//     return {
//       status: 200,
//       message: 'Transaction retrieved successfully',
//       transaction: {
//         ...transaction,
//         categoryPath: transaction.category.getFullPath()
//       },
//     };
//   }

//   async findTransactionsByCompany(companyId: number) {
//     const company = await this.companyService.findCompanyByID(companyId);
//     if (!company) {
//       throw new NotFoundException(`Company with ID ${companyId} not found`);
//     }

//     const transactions = await this.transactionRepository.find({
//       where: { company: { id: companyId } },
//       relations: ['company', 'category', 'category.parent', 'category.parent.parent', 'createdBy'],
//       order: { date: 'DESC' }
//     });

//     return {
//       status: 200,
//       message: `Transactions for company ${company.name} retrieved successfully`,
//       count: transactions.length,
//       transactions: transactions.map(t => ({
//         ...t,
//         categoryPath: t.category.getFullPath()
//       })),
//     };
//   }

//   async findTransactionsByCategory(categoryId: number) {
//     const category = await this.categoryService.findCategoryByID(categoryId);
//     if (!category) {
//       throw new NotFoundException(`Category with ID ${categoryId} not found`);
//     }

//     const transactions = await this.transactionRepository.find({
//       where: { category: { id: categoryId } },
//       relations: ['company', 'category', 'category.parent', 'category.parent.parent', 'createdBy'],
//       order: { date: 'DESC' }
//     });

//     return {
//       status: 200,
//       message: `Transactions for category ${category.name} retrieved successfully`,
//       count: transactions.length,
//       transactions,
//     };
//   }

//   // NEW: Get transactions by date range
//   async findTransactionsByDateRange(
//     companyId: number,
//     startDate: string,
//     endDate: string
//   ) {
//     const company = await this.companyService.findCompanyByID(companyId);
//     if (!company) {
//       throw new NotFoundException(`Company with ID ${companyId} not found`);
//     }

//     const transactions = await this.transactionRepository.find({
//       where: {
//         company: { id: companyId },
//         date: Between(new Date(startDate), new Date(endDate))
//       },
//       relations: ['category', 'category.parent', 'category.parent.parent'],
//       order: { date: 'ASC' }
//     });

//     return {
//       status: 200,
//       message: 'Transactions retrieved successfully',
//       count: transactions.length,
//       dateRange: { startDate, endDate },
//       transactions: transactions.map(t => ({
//         ...t,
//         categoryPath: t.category.getFullPath()
//       })),
//     };
//   }

//   // NEW: Get Income Statement
//   async getIncomeStatement(companyId: number, year: number) {
//     const company = await this.companyService.findCompanyByID(companyId);
//     if (!company) {
//       throw new NotFoundException(`Company with ID ${companyId} not found`);
//     }

//     const transactions = await this.transactionRepository.find({
//       where: {
//         company: { id: companyId },
//         financialYear: year,
//         status: TransactionStatus.COMPLETED
//       },
//       relations: ['category', 'category.parent', 'category.parent.parent']
//     });

//     // Group by category type
//     const revenue = transactions
//       .filter(t => t.category.categoryType === CategoryType.REVENUE)
//       .reduce((sum, t) => sum + Number(t.totalAmount), 0);

//     const costOfSales = transactions
//       .filter(t => t.category.categoryType === CategoryType.COST_OF_SALES)
//       .reduce((sum, t) => sum + Number(t.totalAmount), 0);

//     const expenses = transactions
//       .filter(t => t.category.categoryType === CategoryType.EXPENSE)
//       .reduce((sum, t) => sum + Number(t.totalAmount), 0);

//     const grossProfit = revenue - costOfSales;
//     const netProfit = grossProfit - expenses;

//     // Detailed breakdown by category
//     const revenueByCategory = this.groupByCategory(
//       transactions.filter(t => t.category.categoryType === CategoryType.REVENUE)
//     );

//     const expensesByCategory = this.groupByCategory(
//       transactions.filter(t => t.category.categoryType === CategoryType.EXPENSE)
//     );

//     const costOfSalesByCategory = this.groupByCategory(
//       transactions.filter(t => t.category.categoryType === CategoryType.COST_OF_SALES)
//     );

//     return {
//       status: 200,
//       message: `Income Statement for ${company.name} - Year ${year}`,
//       incomeStatement: {
//         companyName: company.name,
//         period: year,
//         revenue: {
//           total: revenue,
//           breakdown: revenueByCategory
//         },
//         costOfSales: {
//           total: costOfSales,
//           breakdown: costOfSalesByCategory
//         },
//         grossProfit,
//         operatingExpenses: {
//           total: expenses,
//           breakdown: expensesByCategory
//         },
//         netProfit,
//         profitMargin: revenue > 0 ? ((netProfit / revenue) * 100).toFixed(2) + '%' : '0%'
//       }
//     };
//   }

//   // NEW: Get Balance Sheet
//   async getBalanceSheet(companyId: number, asOfDate: string) {
//     const company = await this.companyService.findCompanyByID(companyId);
//     if (!company) {
//       throw new NotFoundException(`Company with ID ${companyId} not found`);
//     }

//     const transactions = await this.transactionRepository.find({
//       where: {
//         company: { id: companyId },
//         status: TransactionStatus.COMPLETED
//       },
//       relations: ['category', 'category.parent', 'category.parent.parent']
//     });

//     // Filter transactions up to the specified date
//     const filteredTransactions = transactions.filter(
//       t => new Date(t.date) <= new Date(asOfDate)
//     );

//     // Calculate Assets
//     const assetTransactions = filteredTransactions.filter(
//       t => t.category.categoryType === CategoryType.ASSET
//     );
//     const totalAssets = this.calculateNetAmount(assetTransactions);
//     const assetsByCategory = this.groupByCategory(assetTransactions);

//     // Calculate Liabilities
//     const liabilityTransactions = filteredTransactions.filter(
//       t => t.category.categoryType === CategoryType.LIABILITY
//     );
//     const totalLiabilities = this.calculateNetAmount(liabilityTransactions);
//     const liabilitiesByCategory = this.groupByCategory(liabilityTransactions);

//     // Calculate Equity
//     const equityTransactions = filteredTransactions.filter(
//       t => t.category.categoryType === CategoryType.EQUITY
//     );
//     const totalEquity = this.calculateNetAmount(equityTransactions);
//     const equityByCategory = this.groupByCategory(equityTransactions);

//     // Retained Earnings (Net Profit from operations)
//     const revenueTotal = filteredTransactions
//       .filter(t => t.category.categoryType === CategoryType.REVENUE)
//       .reduce((sum, t) => sum + Number(t.totalAmount), 0);

//     const expenseTotal = filteredTransactions
//       .filter(t => t.category.categoryType === CategoryType.EXPENSE)
//       .reduce((sum, t) => sum + Number(t.totalAmount), 0);

//     const costOfSalesTotal = filteredTransactions
//       .filter(t => t.category.categoryType === CategoryType.COST_OF_SALES)
//       .reduce((sum, t) => sum + Number(t.totalAmount), 0);

//     const retainedEarnings = revenueTotal - expenseTotal - costOfSalesTotal;

//     const totalEquityWithRetained = totalEquity + retainedEarnings;

//     return {
//       status: 200,
//       message: `Balance Sheet for ${company.name} as of ${asOfDate}`,
//       balanceSheet: {
//         companyName: company.name,
//         asOfDate,
//         assets: {
//           total: totalAssets,
//           breakdown: assetsByCategory
//         },
//         liabilities: {
//           total: totalLiabilities,
//           breakdown: liabilitiesByCategory
//         },
//         equity: {
//           capitalContributed: totalEquity,
//           retainedEarnings: retainedEarnings,
//           total: totalEquityWithRetained,
//           breakdown: equityByCategory
//         },
//         totalLiabilitiesAndEquity: totalLiabilities + totalEquityWithRetained,
//         balanceCheck: Math.abs(totalAssets - (totalLiabilities + totalEquityWithRetained)) < 0.01 ? 'BALANCED' : 'UNBALANCED'
//       }
//     };
//   }

//   // NEW: Get Cash Book
//   async getCashBook(companyId: number, startDate: string, endDate: string) {
//     const company = await this.companyService.findCompanyByID(companyId);
//     if (!company) {
//       throw new NotFoundException(`Company with ID ${companyId} not found`);
//     }

//     // Get all cash/bank related transactions
//     const cashCategories = await this.categoryService.getLeafCategories();
//     const cashCategoryIds = cashCategories
//       .filter(c => c.name.toLowerCase().includes('cash') || c.name.toLowerCase().includes('bank'))
//       .map(c => c.id);

//     const transactions = await this.transactionRepository.find({
//       where: {
//         company: { id: companyId },
//         date: Between(new Date(startDate), new Date(endDate)),
//         status: TransactionStatus.COMPLETED
//       },
//       relations: ['category', 'category.parent', 'category.parent.parent'],
//       order: { date: 'ASC' }
//     });

//     let balance = 0;
//     const cashFlows = transactions.map(t => {
//       const isCashIn = t.transactionType === 'debit';
//       const amount = Number(t.totalAmount);

//       if (isCashIn) {
//         balance += amount;
//       } else {
//         balance -= amount;
//       }

//       return {
//         date: t.date,
//         description: t.description,
//         reference: t.referenceNumber,
//         category: t.category.getFullPath(),
//         paymentMethod: t.paymentMethod,
//         cashIn: isCashIn ? amount : 0,
//         cashOut: isCashIn ? 0 : amount,
//         balance: balance,
//         counterparty: t.counterparty
//       };
//     });

//     const totalCashIn = cashFlows.reduce((sum, cf) => sum + cf.cashIn, 0);
//     const totalCashOut = cashFlows.reduce((sum, cf) => sum + cf.cashOut, 0);

//     return {
//       status: 200,
//       message: `Cash Book for ${company.name}`,
//       cashBook: {
//         companyName: company.name,
//         period: { startDate, endDate },
//         openingBalance: 0, // Should be calculated from previous period
//         totalCashIn,
//         totalCashOut,
//         closingBalance: balance,
//         transactions: cashFlows
//       }
//     };
//   }

//   async updateTransaction(id: number, updateTransactionDto: UpdateTransactionDto) {
//     const transaction = await this.transactionRepository.findOne({
//       where: { id },
//       relations: ['company', 'category', 'createdBy']
//     });

//     if (!transaction) {
//       throw new NotFoundException(`Transaction with ID ${id} not found`);
//     }

//     // If categoryId is being updated, validate it
//     if (updateTransactionDto.categoryId) {
//       const category = await this.categoryService.findCategoryByID(updateTransactionDto.categoryId);
//       if (!category) {
//         throw new NotFoundException(`Category with ID ${updateTransactionDto.categoryId} not found`);
//       }

//       // Validate category level
//       if (category.level !== CategoryLevel.SUB_SUB) {
//         throw new BadRequestException(
//           `Category "${category.name}" is not a transaction-level category. Please select a sub-sub category.`
//         );
//       }

//       transaction.category = category;
//     }

//     // Update fields
//     if (updateTransactionDto.date) transaction.date = new Date(updateTransactionDto.date);
//     if (updateTransactionDto.transactionType) transaction.transactionType = updateTransactionDto.transactionType;
//     if (updateTransactionDto.amount) transaction.amount = updateTransactionDto.amount;
//     if (updateTransactionDto.description) transaction.description = updateTransactionDto.description;
//     if (updateTransactionDto.referenceNumber !== undefined) transaction.referenceNumber = updateTransactionDto.referenceNumber;
//     if (updateTransactionDto.paymentMethod) transaction.paymentMethod = updateTransactionDto.paymentMethod;
//     if (updateTransactionDto.status) transaction.status = updateTransactionDto.status;
//     if (updateTransactionDto.counterparty !== undefined) transaction.counterparty = updateTransactionDto.counterparty;
//     if (updateTransactionDto.invoiceNumber !== undefined) transaction.invoiceNumber = updateTransactionDto.invoiceNumber;
//     if (updateTransactionDto.dueDate) transaction.dueDate = new Date(updateTransactionDto.dueDate);
//     if (updateTransactionDto.taxRate !== undefined) transaction.taxRate = updateTransactionDto.taxRate;
//     if (updateTransactionDto.taxAmount !== undefined) transaction.taxAmount = updateTransactionDto.taxAmount;
//     if (updateTransactionDto.notes !== undefined) transaction.notes = updateTransactionDto.notes;

//     try {
//       const updatedTransaction = await this.transactionRepository.save(transaction);

//       return {
//         status: 200,
//         message: 'Transaction updated successfully',
//         transaction: updatedTransaction,
//       };
//     } catch (error) {
//       console.error('Error updating transaction:', error);
//       throw new BadRequestException(`Failed to update transaction: ${error.message}`);
//     }
//   }

//   async deleteTransaction(id: number) {
//     const transaction = await this.transactionRepository.findOne({
//       where: { id }
//     });

//     if (!transaction) {
//       throw new NotFoundException(`Transaction with ID ${id} not found`);
//     }

//     try {
//       await this.transactionRepository.softDelete(id);

//       return {
//         status: 200,
//         message: 'Transaction deleted successfully',
//       };
//     } catch (error) {
//       console.error('Error deleting transaction:', error);
//       throw new BadRequestException(`Failed to delete transaction: ${error.message}`);
//     }
//   }

//   // RECURRING TRANSACTIONS

//   async getRecurringTransactions() {
//     const transactions = await this.transactionRepository.find({
//       where: { isRecurring: true },
//       relations: ['company', 'category', 'category.parent', 'category.parent.parent', 'createdBy'],
//       order: { date: 'DESC' }
//     });

//     return {
//       status: 200,
//       message: 'Recurring transactions retrieved successfully',
//       count: transactions.length,
//       transactions: transactions.map(t => ({
//         ...t,
//         categoryPath: t.category.getFullPath()
//       }))
//     };
//   }

//   async getRecurringTransactionsByCompany(companyId: number) {
//     const company = await this.companyService.findCompanyByID(companyId);
//     if (!company) {
//       throw new NotFoundException(`Company with ID ${companyId} not found`);
//     }

//     const transactions = await this.transactionRepository.find({
//       where: { 
//         company: { id: companyId },
//         isRecurring: true 
//       },
//       relations: ['category', 'category.parent', 'category.parent.parent'],
//       order: { date: 'DESC' }
//     });

//     return {
//       status: 200,
//       message: `Recurring transactions for ${company.name}`,
//       count: transactions.length,
//       transactions: transactions.map(t => ({
//         ...t,
//         categoryPath: t.category.getFullPath()
//       }))
//     };
//   }

//   async executeRecurringTransaction(id: number) {
//     const template = await this.transactionRepository.findOne({
//       where: { id },
//       relations: ['company', 'category', 'createdBy']
//     });

//     if (!template) {
//       throw new NotFoundException(`Recurring transaction template with ID ${id} not found`);
//     }

//     if (!template.isRecurring) {
//       throw new BadRequestException('This is not a recurring transaction');
//     }

//     // Create new transaction based on template
//     const newTransaction = this.transactionRepository.create({
//       date: new Date(),
//       transactionType: template.transactionType,
//       amount: template.amount,
//       description: `${template.description} (Auto-generated from recurring)`,
//       referenceNumber: template.referenceNumber ? `${template.referenceNumber}-AUTO-${Date.now()}` : undefined,
//       paymentMethod: template.paymentMethod,
//       status: template.status,
//       counterparty: template.counterparty,
//       taxRate: template.taxRate,
//       taxAmount: template.taxAmount,
//       notes: template.notes,
//       isRecurring: false, // The generated transaction is not recurring
//       company: template.company,
//       category: template.category,
//       createdBy: template.createdBy
//     });

//     const savedTransaction = await this.transactionRepository.save(newTransaction);

//     return {
//       status: 201,
//       message: 'Recurring transaction executed successfully',
//       transaction: savedTransaction,
//       template: {
//         id: template.id,
//         description: template.description,
//         frequency: template.recurringFrequency
//       }
//     };
//   }

//   // GLOBAL FINANCIAL REPORTS

//   async getGlobalIncomeStatement(year: number) {
//     const transactions = await this.transactionRepository.find({
//       where: {
//         financialYear: year,
//         status: TransactionStatus.COMPLETED
//       },
//       relations: ['company', 'category', 'category.parent', 'category.parent.parent']
//     });

//     // Group by company
//     const companiesMap = new Map();
//     transactions.forEach(t => {
//       if (!companiesMap.has(t.company.id)) {
//         companiesMap.set(t.company.id, {
//           companyId: t.company.id,
//           companyName: t.company.name,
//           transactions: []
//         });
//       }
//       companiesMap.get(t.company.id).transactions.push(t);
//     });

//     const companyReports = Array.from(companiesMap.values()).map(company => {
//       const revenue = company.transactions
//         .filter(t => t.category.categoryType === CategoryType.REVENUE)
//         .reduce((sum, t) => sum + Number(t.totalAmount), 0);

//       const costOfSales = company.transactions
//         .filter(t => t.category.categoryType === CategoryType.COST_OF_SALES)
//         .reduce((sum, t) => sum + Number(t.totalAmount), 0);

//       const expenses = company.transactions
//         .filter(t => t.category.categoryType === CategoryType.EXPENSE)
//         .reduce((sum, t) => sum + Number(t.totalAmount), 0);

//       const grossProfit = revenue - costOfSales;
//       const netProfit = grossProfit - expenses;

//       return {
//         companyId: company.companyId,
//         companyName: company.companyName,
//         revenue,
//         costOfSales,
//         grossProfit,
//         operatingExpenses: expenses,
//         netProfit,
//         profitMargin: revenue > 0 ? ((netProfit / revenue) * 100).toFixed(2) + '%' : '0%'
//       };
//     });

//     // Calculate totals
//     const totalRevenue = companyReports.reduce((sum, c) => sum + c.revenue, 0);
//     const totalCostOfSales = companyReports.reduce((sum, c) => sum + c.costOfSales, 0);
//     const totalExpenses = companyReports.reduce((sum, c) => sum + c.operatingExpenses, 0);
//     const totalGrossProfit = totalRevenue - totalCostOfSales;
//     const totalNetProfit = totalGrossProfit - totalExpenses;

//     return {
//       status: 200,
//       message: `Global Income Statement - Year ${year}`,
//       summary: {
//         period: year,
//         totalCompanies: companyReports.length,
//         totalRevenue,
//         totalCostOfSales,
//         totalGrossProfit,
//         totalOperatingExpenses: totalExpenses,
//         totalNetProfit,
//         averageProfitMargin: totalRevenue > 0 ? ((totalNetProfit / totalRevenue) * 100).toFixed(2) + '%' : '0%'
//       },
//       companies: companyReports
//     };
//   }

//   async getGlobalBalanceSheet(asOfDate: string) {
//     const transactions = await this.transactionRepository.find({
//       where: {
//         status: TransactionStatus.COMPLETED
//       },
//       relations: ['company', 'category', 'category.parent', 'category.parent.parent']
//     });

//     // Filter by date
//     const filteredTransactions = transactions.filter(
//       t => new Date(t.date) <= new Date(asOfDate)
//     );

//     // Group by company
//     const companiesMap = new Map();
//     filteredTransactions.forEach(t => {
//       if (!companiesMap.has(t.company.id)) {
//         companiesMap.set(t.company.id, {
//           companyId: t.company.id,
//           companyName: t.company.name,
//           transactions: []
//         });
//       }
//       companiesMap.get(t.company.id).transactions.push(t);
//     });

//     const companyReports = Array.from(companiesMap.values()).map(company => {
//       const assetTransactions = company.transactions.filter(
//         t => t.category.categoryType === CategoryType.ASSET
//       );
//       const totalAssets = this.calculateNetAmount(assetTransactions);

//       const liabilityTransactions = company.transactions.filter(
//         t => t.category.categoryType === CategoryType.LIABILITY
//       );
//       const totalLiabilities = this.calculateNetAmount(liabilityTransactions);

//       const equityTransactions = company.transactions.filter(
//         t => t.category.categoryType === CategoryType.EQUITY
//       );
//       const totalEquity = this.calculateNetAmount(equityTransactions);

//       // Calculate retained earnings
//       const revenue = company.transactions
//         .filter(t => t.category.categoryType === CategoryType.REVENUE)
//         .reduce((sum, t) => sum + Number(t.totalAmount), 0);

//       const expenses = company.transactions
//         .filter(t => t.category.categoryType === CategoryType.EXPENSE)
//         .reduce((sum, t) => sum + Number(t.totalAmount), 0);

//       const costOfSales = company.transactions
//         .filter(t => t.category.categoryType === CategoryType.COST_OF_SALES)
//         .reduce((sum, t) => sum + Number(t.totalAmount), 0);

//       const retainedEarnings = revenue - expenses - costOfSales;

//       return {
//         companyId: company.companyId,
//         companyName: company.companyName,
//         totalAssets,
//         totalLiabilities,
//         totalEquity: totalEquity + retainedEarnings,
//         retainedEarnings,
//         balanceCheck: Math.abs(totalAssets - (totalLiabilities + totalEquity + retainedEarnings)) < 0.01 ? 'BALANCED' : 'UNBALANCED'
//       };
//     });

//     // Calculate totals
//     const totalAssets = companyReports.reduce((sum, c) => sum + c.totalAssets, 0);
//     const totalLiabilities = companyReports.reduce((sum, c) => sum + c.totalLiabilities, 0);
//     const totalEquity = companyReports.reduce((sum, c) => sum + c.totalEquity, 0);

//     return {
//       status: 200,
//       message: `Global Balance Sheet as of ${asOfDate}`,
//       summary: {
//         asOfDate,
//         totalCompanies: companyReports.length,
//         totalAssets,
//         totalLiabilities,
//         totalEquity,
//         balanceCheck: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01 ? 'BALANCED' : 'UNBALANCED'
//       },
//       companies: companyReports
//     };
//   }

//   async getGlobalCashBook(startDate: string, endDate: string) {
//     const transactions = await this.transactionRepository.find({
//       where: {
//         date: Between(new Date(startDate), new Date(endDate)),
//         status: TransactionStatus.COMPLETED
//       },
//       relations: ['company', 'category', 'category.parent', 'category.parent.parent'],
//       order: { date: 'ASC' }
//     });

//     // Group by company
//     const companiesMap = new Map();
//     transactions.forEach(t => {
//       if (!companiesMap.has(t.company.id)) {
//         companiesMap.set(t.company.id, {
//           companyId: t.company.id,
//           companyName: t.company.name,
//           transactions: []
//         });
//       }
//       companiesMap.get(t.company.id).transactions.push(t);
//     });

//     const companyReports = Array.from(companiesMap.values()).map(company => {
//       const totalCashIn = company.transactions
//         .filter(t => t.transactionType === 'debit')
//         .reduce((sum, t) => sum + Number(t.totalAmount), 0);

//       const totalCashOut = company.transactions
//         .filter(t => t.transactionType === 'credit')
//         .reduce((sum, t) => sum + Number(t.totalAmount), 0);

//       return {
//         companyId: company.companyId,
//         companyName: company.companyName,
//         totalCashIn,
//         totalCashOut,
//         netCashFlow: totalCashIn - totalCashOut,
//         transactionCount: company.transactions.length
//       };
//     });

//     // Calculate totals
//     const totalCashIn = companyReports.reduce((sum, c) => sum + c.totalCashIn, 0);
//     const totalCashOut = companyReports.reduce((sum, c) => sum + c.totalCashOut, 0);

//     return {
//       status: 200,
//       message: `Global Cash Book`,
//       summary: {
//         period: { startDate, endDate },
//         totalCompanies: companyReports.length,
//         totalCashIn,
//         totalCashOut,
//         netCashFlow: totalCashIn - totalCashOut
//       },
//       companies: companyReports
//     };
//   }

//   async getGlobalFinancialSummary(year: number) {
//     const transactions = await this.transactionRepository.find({
//       where: {
//         financialYear: year,
//         status: TransactionStatus.COMPLETED
//       },
//       relations: ['company', 'category']
//     });

//     // Overall statistics
//     const totalTransactions = transactions.length;
//     const totalRevenue = transactions
//       .filter(t => t.category.categoryType === CategoryType.REVENUE)
//       .reduce((sum, t) => sum + Number(t.totalAmount), 0);

//     const totalExpenses = transactions
//       .filter(t => t.category.categoryType === CategoryType.EXPENSE)
//       .reduce((sum, t) => sum + Number(t.totalAmount), 0);

//     const totalCostOfSales = transactions
//       .filter(t => t.category.categoryType === CategoryType.COST_OF_SALES)
//       .reduce((sum, t) => sum + Number(t.totalAmount), 0);

//     const totalAssets = this.calculateNetAmount(
//       transactions.filter(t => t.category.categoryType === CategoryType.ASSET)
//     );

//     const totalLiabilities = this.calculateNetAmount(
//       transactions.filter(t => t.category.categoryType === CategoryType.LIABILITY)
//     );

//     // Companies count
//     const uniqueCompanies = new Set(transactions.map(t => t.company.id));

//     // Category breakdown
//     const categoryBreakdown = this.groupByCategory(transactions);

//     // Payment method breakdown
//     const paymentMethodBreakdown = transactions.reduce((acc, t) => {
//       if (!acc[t.paymentMethod]) {
//         acc[t.paymentMethod] = {
//           method: t.paymentMethod,
//           count: 0,
//           totalAmount: 0
//         };
//       }
//       acc[t.paymentMethod].count += 1;
//       acc[t.paymentMethod].totalAmount += Number(t.totalAmount);
//       return acc;
//     }, {});

//     return {
//       status: 200,
//       message: `Global Financial Summary - Year ${year}`,
//       summary: {
//         year,
//         totalCompanies: uniqueCompanies.size,
//         totalTransactions,
//         revenue: {
//           total: totalRevenue,
//           averagePerCompany: uniqueCompanies.size > 0 ? (totalRevenue / uniqueCompanies.size) : 0
//         },
//         expenses: {
//           total: totalExpenses,
//           averagePerCompany: uniqueCompanies.size > 0 ? (totalExpenses / uniqueCompanies.size) : 0
//         },
//         costOfSales: totalCostOfSales,
//         netProfit: totalRevenue - totalExpenses - totalCostOfSales,
//         assets: totalAssets,
//         liabilities: totalLiabilities,
//         categoryBreakdown,
//         paymentMethods: Object.values(paymentMethodBreakdown)
//       }
//     };
//   }

//   async getCompanyComparison(year: number) {
//     const transactions = await this.transactionRepository.find({
//       where: {
//         financialYear: year,
//         status: TransactionStatus.COMPLETED
//       },
//       relations: ['company', 'category']
//     });

//     // Group by company
//     const companiesMap = new Map();
//     transactions.forEach(t => {
//       if (!companiesMap.has(t.company.id)) {
//         companiesMap.set(t.company.id, {
//           companyId: t.company.id,
//           companyName: t.company.name,
//           transactions: []
//         });
//       }
//       companiesMap.get(t.company.id).transactions.push(t);
//     });

//     const companyMetrics = Array.from(companiesMap.values()).map(company => {
//       const revenue = company.transactions
//         .filter(t => t.category.categoryType === CategoryType.REVENUE)
//         .reduce((sum, t) => sum + Number(t.totalAmount), 0);

//       const expenses = company.transactions
//         .filter(t => t.category.categoryType === CategoryType.EXPENSE)
//         .reduce((sum, t) => sum + Number(t.totalAmount), 0);

//       const costOfSales = company.transactions
//         .filter(t => t.category.categoryType === CategoryType.COST_OF_SALES)
//         .reduce((sum, t) => sum + Number(t.totalAmount), 0);

//       const netProfit = revenue - expenses - costOfSales;
//       const grossProfit = revenue - costOfSales;

//       const assets = this.calculateNetAmount(
//         company.transactions.filter(t => t.category.categoryType === CategoryType.ASSET)
//       );

//       const liabilities = this.calculateNetAmount(
//         company.transactions.filter(t => t.category.categoryType === CategoryType.LIABILITY)
//       );

//       return {
//         companyId: company.companyId,
//         companyName: company.companyName,
//         revenue,
//         expenses,
//         costOfSales,
//         grossProfit,
//         netProfit,
//         profitMargin: revenue > 0 ? ((netProfit / revenue) * 100).toFixed(2) : '0',
//         assets,
//         liabilities,
//         equity: assets - liabilities,
//         transactionCount: company.transactions.length,
//         averageTransactionSize: company.transactions.length > 0 
//           ? (company.transactions.reduce((sum, t) => sum + Number(t.totalAmount), 0) / company.transactions.length)
//           : 0
//       };
//     });

//     // Sort by revenue
//     const topByRevenue = [...companyMetrics].sort((a, b) => b.revenue - a.revenue);

//     // Sort by profit
//     const topByProfit = [...companyMetrics].sort((a, b) => b.netProfit - a.netProfit);

//     // Sort by profit margin
//     const topByMargin = [...companyMetrics].sort((a, b) => parseFloat(b.profitMargin) - parseFloat(a.profitMargin));

//     return {
//       status: 200,
//       message: `Company Comparison - Year ${year}`,
//       summary: {
//         year,
//         totalCompanies: companyMetrics.length,
//         topPerformers: {
//           byRevenue: topByRevenue.slice(0, 5),
//           byProfit: topByProfit.slice(0, 5),
//           byProfitMargin: topByMargin.slice(0, 5)
//         },
//         allCompanies: companyMetrics
//       }
//     };
//   }

//   // Helper method to group transactions by category
//   private groupByCategory(transactions: Transaction[]) {
//     const grouped = transactions.reduce((acc, t) => {
//       const categoryPath = t.category.getFullPath();
//       if (!acc[categoryPath]) {
//         acc[categoryPath] = {
//           categoryId: t.category.id,
//           categoryName: t.category.name,
//           categoryPath: categoryPath,
//           totalAmount: 0,
//           transactionCount: 0
//         };
//       }
//       acc[categoryPath].totalAmount += Number(t.totalAmount);
//       acc[categoryPath].transactionCount += 1;
//       return acc;
//     }, {});

//     return Object.values(grouped);
//   }

//   // Helper method to calculate net amount for balance sheet items
//   private calculateNetAmount(transactions: Transaction[]): number {
//     return transactions.reduce((sum, t) => {
//       const amount = Number(t.totalAmount);
//       // For assets: debit increases, credit decreases
//       // For liabilities/equity: credit increases, debit decreases
//       if (t.category.categoryType === CategoryType.ASSET) {
//         return sum + (t.transactionType === 'debit' ? amount : -amount);
//       } else {
//         return sum + (t.transactionType === 'credit' ? amount : -amount);
//       }
//     }, 0);
//   }
// }









import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { Transaction, TransactionStatus } from './entities/transaction.entity';
import { UsersService } from 'src/users/users.service';
import { CompanyService } from 'src/company/company.service';
import { CategoryService } from 'src/category/category.service';
import { CategoryLevel, CategoryType } from 'src/category/entities/category.entity';
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
  ) { }

  // Helper method to check user access to company
  private async validateUserCompanyAccess(currentUser: User, companyId: number): Promise<void> {
    if (currentUser.role === 'admin') {
      return; // Admins have access to all companies
    }

    const user = await this.userRepository.findOne({
      where: { id: currentUser.id },
      relations: ['company'],
    });

    if (!user || !user.company) {
      throw new ForbiddenException('You are not assigned to any company');
    }

    if (user.company.id !== companyId) {
      throw new ForbiddenException('You can only access transactions for your assigned company');
    }
  }

  // Helper method to get user's company IDs
  private async getUserCompanyIds(currentUser: User): Promise<number[]> {
    if (currentUser.role === 'admin') {
      return null; // null means access to all companies
    }

    const user = await this.userRepository.findOne({
      where: { id: currentUser.id },
      relations: ['company'],
    });

    if (!user || !user.company) {
      return []; // User has no company access
    }

    return [user.company.id];
  }

  async createTransaction(createTransactionDto: CreateTransactionDto, currentUser: User) {
    // Validate user has access to this company
    await this.validateUserCompanyAccess(currentUser, createTransactionDto.companyId);

    // Find and validate user
    const user = await this.userRepository.findOne({
      where: { id: createTransactionDto.createdBy },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${createTransactionDto.createdBy} not found`);
    }

    // Find and validate company
    const company = await this.companyService.findCompanyByID(createTransactionDto.companyId);
    if (!company) {
      throw new NotFoundException(`Company with ID ${createTransactionDto.companyId} not found`);
    }

    // Find and validate category
    const category = await this.categoryService.findCategoryByID(createTransactionDto.categoryId);
    if (!category) {
      throw new NotFoundException(`Category with ID ${createTransactionDto.categoryId} not found`);
    }

    // IMPORTANT: Validate that category is a leaf category (sub-sub level)
    if (category.level !== CategoryLevel.SUB_SUB) {
      throw new BadRequestException(
        `Category "${category.name}" is not a transaction-level category. ` +
        `Please select a sub-sub category (leaf level). ` +
        `Current level: ${category.level}`
      );
    }

    if (!category.allowTransactions) {
      throw new BadRequestException(
        `Category "${category.name}" does not allow transactions. ` +
        `Please select a different category.`
      );
    }

    // Calculate tax amount if tax rate is provided but tax amount is not
    let taxAmount = createTransactionDto.taxAmount || 0;
    if (createTransactionDto.taxRate && !createTransactionDto.taxAmount) {
      taxAmount = (createTransactionDto.amount * createTransactionDto.taxRate) / 100;
    }

    // Create transaction with all fields
    // const transaction = this.transactionRepository.create({
    //   date: new Date(createTransactionDto.date),
    //   transactionType: createTransactionDto.transactionType,
    //   amount: createTransactionDto.amount,
    //   description: createTransactionDto.description,
    //   referenceNumber: createTransactionDto.referenceNumber,
    //   paymentMethod: createTransactionDto.paymentMethod,
    //   status: createTransactionDto.status || TransactionStatus.COMPLETED,
    //   counterparty: createTransactionDto.counterparty,
    //   invoiceNumber: createTransactionDto.invoiceNumber,
    //   dueDate: createTransactionDto.dueDate ? new Date(createTransactionDto.dueDate) : undefined,
    //   taxRate: createTransactionDto.taxRate || 0,
    //   taxAmount: taxAmount,
    //   notes: createTransactionDto.notes,
    //   attachments: createTransactionDto.attachments,
    //   isRecurring: createTransactionDto.isRecurring || false,
    //   recurringFrequency: createTransactionDto.recurringFrequency,
    //   createdBy: user,
    //   company: company,
    //   category: category,
    // });



    // Create transaction with all fields
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
      dueDate: createTransactionDto.dueDate ? new Date(createTransactionDto.dueDate) : undefined,
      taxRate: createTransactionDto.taxRate || 0,
      taxAmount: taxAmount,
      notes: createTransactionDto.notes,
      attachments: createTransactionDto.attachments,
      isRecurring: createTransactionDto.isRecurring || false,
      recurringFrequency: createTransactionDto.recurringFrequency || null, // This will now work
      recurringEndDate: createTransactionDto.recurringEndDate ? new Date(createTransactionDto.recurringEndDate) : null,
      recurringExecutionCount: createTransactionDto.recurringExecutionCount || null,
      isRecurringActive: createTransactionDto.isRecurring || false,
      createdBy: user,
      company: company,
      category: category,
    });

    try {
      const savedTransaction = await this.transactionRepository.save(transaction);

      // Load full category hierarchy for response
      const fullCategory = await this.categoryService.getCategoryById(category.id);

      return {
        status: 201,
        message: 'Transaction created successfully',
        transaction: {
          ...savedTransaction,
          category: fullCategory,
          categoryPath: fullCategory.getFullPath()
        },
      };
    } catch (error) {
      console.error('Error saving transaction:', error);
      throw new BadRequestException(`Failed to create transaction: ${error.message}`);
    }
  }

  async findAllTransactions(currentUser: User) {
    try {
      const companyIds = await this.getUserCompanyIds(currentUser);

      // Build query
      const queryBuilder = this.transactionRepository.createQueryBuilder('transaction')
        .leftJoinAndSelect('transaction.company', 'company')
        .leftJoinAndSelect('transaction.category', 'category')
        .leftJoinAndSelect('category.parent', 'parent')
        .leftJoinAndSelect('parent.parent', 'grandparent')
        .leftJoinAndSelect('transaction.createdBy', 'createdBy')
        .orderBy('transaction.date', 'DESC');

      // Apply company filter for non-admin users
      if (companyIds !== null && companyIds.length > 0) {
        queryBuilder.andWhere('company.id IN (:...companyIds)', { companyIds });
      } else if (companyIds !== null && companyIds.length === 0) {
        // User has no company access
        return {
          status: 200,
          message: 'No transactions available',
          count: 0,
          transactions: [],
        };
      }

      const transactions = await queryBuilder.getMany();

      return {
        status: 200,
        message: 'Transactions retrieved successfully',
        count: transactions.length,
        transactions: transactions.map(t => ({
          ...t,
          categoryPath: t.category.getFullPath()
        })),
      };
    } catch (error) {
      console.error('Error retrieving transactions:', error);
      throw new BadRequestException(`Failed to retrieve transactions: ${error.message}`);
    }
  }

  async findTransactionById(id: number, currentUser: User) {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: ['company', 'category', 'category.parent', 'category.parent.parent', 'createdBy']
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    // Validate access
    await this.validateUserCompanyAccess(currentUser, transaction.company.id);

    return {
      status: 200,
      message: 'Transaction retrieved successfully',
      transaction: {
        ...transaction,
        categoryPath: transaction.category.getFullPath()
      },
    };
  }

  async findTransactionsByCompany(companyId: number, currentUser: User) {
    // Validate access
    await this.validateUserCompanyAccess(currentUser, companyId);

    const company = await this.companyService.findCompanyByID(companyId);
    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }

    const transactions = await this.transactionRepository.find({
      where: { company: { id: companyId } },
      relations: ['company', 'category', 'category.parent', 'category.parent.parent', 'createdBy'],
      order: { date: 'DESC' }
    });

    return {
      status: 200,
      message: `Transactions for company ${company.name} retrieved successfully`,
      count: transactions.length,
      transactions: transactions.map(t => ({
        ...t,
        categoryPath: t.category.getFullPath()
      })),
    };
  }

  async findTransactionsByCategory(categoryId: number, currentUser: User) {
    const category = await this.categoryService.findCategoryByID(categoryId);
    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    const companyIds = await this.getUserCompanyIds(currentUser);

    const queryBuilder = this.transactionRepository.createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.company', 'company')
      .leftJoinAndSelect('transaction.category', 'category')
      .leftJoinAndSelect('category.parent', 'parent')
      .leftJoinAndSelect('parent.parent', 'grandparent')
      .leftJoinAndSelect('transaction.createdBy', 'createdBy')
      .where('category.id = :categoryId', { categoryId })
      .orderBy('transaction.date', 'DESC');

    // Apply company filter for non-admin users
    if (companyIds !== null && companyIds.length > 0) {
      queryBuilder.andWhere('company.id IN (:...companyIds)', { companyIds });
    }

    const transactions = await queryBuilder.getMany();

    return {
      status: 200,
      message: `Transactions for category ${category.name} retrieved successfully`,
      count: transactions.length,
      transactions,
    };
  }

  async findTransactionsByDateRange(
    companyId: number,
    startDate: string,
    endDate: string,
    currentUser: User
  ) {
    // Validate access
    await this.validateUserCompanyAccess(currentUser, companyId);

    const company = await this.companyService.findCompanyByID(companyId);
    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }

    const transactions = await this.transactionRepository.find({
      where: {
        company: { id: companyId },
        date: Between(new Date(startDate), new Date(endDate))
      },
      relations: ['category', 'category.parent', 'category.parent.parent'],
      order: { date: 'ASC' }
    });

    return {
      status: 200,
      message: 'Transactions retrieved successfully',
      count: transactions.length,
      dateRange: { startDate, endDate },
      transactions: transactions.map(t => ({
        ...t,
        categoryPath: t.category.getFullPath()
      })),
    };
  }

  async getIncomeStatement(companyId: number, year: number, currentUser: User) {
    // Validate access
    await this.validateUserCompanyAccess(currentUser, companyId);

    const company = await this.companyService.findCompanyByID(companyId);
    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }

    const transactions = await this.transactionRepository.find({
      where: {
        company: { id: companyId },
        financialYear: year,
        status: TransactionStatus.COMPLETED
      },
      relations: ['category', 'category.parent', 'category.parent.parent']
    });

    // Group by category type
    const revenue = transactions
      .filter(t => t.category.categoryType === CategoryType.REVENUE)
      .reduce((sum, t) => sum + Number(t.totalAmount), 0);

    const costOfSales = transactions
      .filter(t => t.category.categoryType === CategoryType.COST_OF_SALES)
      .reduce((sum, t) => sum + Number(t.totalAmount), 0);

    const expenses = transactions
      .filter(t => t.category.categoryType === CategoryType.EXPENSE)
      .reduce((sum, t) => sum + Number(t.totalAmount), 0);

    const grossProfit = revenue - costOfSales;
    const netProfit = grossProfit - expenses;

    // Detailed breakdown by category
    const revenueByCategory = this.groupByCategory(
      transactions.filter(t => t.category.categoryType === CategoryType.REVENUE)
    );

    const expensesByCategory = this.groupByCategory(
      transactions.filter(t => t.category.categoryType === CategoryType.EXPENSE)
    );

    const costOfSalesByCategory = this.groupByCategory(
      transactions.filter(t => t.category.categoryType === CategoryType.COST_OF_SALES)
    );

    return {
      status: 200,
      message: `Income Statement for ${company.name} - Year ${year}`,
      incomeStatement: {
        companyName: company.name,
        period: year,
        revenue: {
          total: revenue,
          breakdown: revenueByCategory
        },
        costOfSales: {
          total: costOfSales,
          breakdown: costOfSalesByCategory
        },
        grossProfit,
        operatingExpenses: {
          total: expenses,
          breakdown: expensesByCategory
        },
        netProfit,
        profitMargin: revenue > 0 ? ((netProfit / revenue) * 100).toFixed(2) + '%' : '0%'
      }
    };
  }

  async getBalanceSheet(companyId: number, asOfDate: string, currentUser: User) {
    // Validate access
    await this.validateUserCompanyAccess(currentUser, companyId);

    const company = await this.companyService.findCompanyByID(companyId);
    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }

    const transactions = await this.transactionRepository.find({
      where: {
        company: { id: companyId },
        status: TransactionStatus.COMPLETED
      },
      relations: ['category', 'category.parent', 'category.parent.parent']
    });

    // Filter transactions up to the specified date
    const filteredTransactions = transactions.filter(
      t => new Date(t.date) <= new Date(asOfDate)
    );

    // Calculate Assets
    const assetTransactions = filteredTransactions.filter(
      t => t.category.categoryType === CategoryType.ASSET
    );
    const totalAssets = this.calculateNetAmount(assetTransactions);
    const assetsByCategory = this.groupByCategory(assetTransactions);

    // Calculate Liabilities
    const liabilityTransactions = filteredTransactions.filter(
      t => t.category.categoryType === CategoryType.LIABILITY
    );
    const totalLiabilities = this.calculateNetAmount(liabilityTransactions);
    const liabilitiesByCategory = this.groupByCategory(liabilityTransactions);

    // Calculate Equity
    const equityTransactions = filteredTransactions.filter(
      t => t.category.categoryType === CategoryType.EQUITY
    );
    const totalEquity = this.calculateNetAmount(equityTransactions);
    const equityByCategory = this.groupByCategory(equityTransactions);

    // Retained Earnings (Net Profit from operations)
    const revenueTotal = filteredTransactions
      .filter(t => t.category.categoryType === CategoryType.REVENUE)
      .reduce((sum, t) => sum + Number(t.totalAmount), 0);

    const expenseTotal = filteredTransactions
      .filter(t => t.category.categoryType === CategoryType.EXPENSE)
      .reduce((sum, t) => sum + Number(t.totalAmount), 0);

    const costOfSalesTotal = filteredTransactions
      .filter(t => t.category.categoryType === CategoryType.COST_OF_SALES)
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
          breakdown: assetsByCategory
        },
        liabilities: {
          total: totalLiabilities,
          breakdown: liabilitiesByCategory
        },
        equity: {
          capitalContributed: totalEquity,
          retainedEarnings: retainedEarnings,
          total: totalEquityWithRetained,
          breakdown: equityByCategory
        },
        totalLiabilitiesAndEquity: totalLiabilities + totalEquityWithRetained,
        balanceCheck: Math.abs(totalAssets - (totalLiabilities + totalEquityWithRetained)) < 0.01 ? 'BALANCED' : 'UNBALANCED'
      }
    };
  }

  async getCashBook(companyId: number, startDate: string, endDate: string, currentUser: User) {
    // Validate access
    await this.validateUserCompanyAccess(currentUser, companyId);

    const company = await this.companyService.findCompanyByID(companyId);
    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }

    const transactions = await this.transactionRepository.find({
      where: {
        company: { id: companyId },
        date: Between(new Date(startDate), new Date(endDate)),
        status: TransactionStatus.COMPLETED
      },
      relations: ['category', 'category.parent', 'category.parent.parent'],
      order: { date: 'ASC' }
    });

    let balance = 0;
    const cashFlows = transactions.map(t => {
      const isCashIn = t.transactionType === 'debit';
      const amount = Number(t.totalAmount);

      if (isCashIn) {
        balance += amount;
      } else {
        balance -= amount;
      }

      return {
        date: t.date,
        description: t.description,
        reference: t.referenceNumber,
        category: t.category.getFullPath(),
        paymentMethod: t.paymentMethod,
        cashIn: isCashIn ? amount : 0,
        cashOut: isCashIn ? 0 : amount,
        balance: balance,
        counterparty: t.counterparty
      };
    });

    const totalCashIn = cashFlows.reduce((sum, cf) => sum + cf.cashIn, 0);
    const totalCashOut = cashFlows.reduce((sum, cf) => sum + cf.cashOut, 0);

    return {
      status: 200,
      message: `Cash Book for ${company.name}`,
      cashBook: {
        companyName: company.name,
        period: { startDate, endDate },
        openingBalance: 0,
        totalCashIn,
        totalCashOut,
        closingBalance: balance,
        transactions: cashFlows
      }
    };
  }

  async updateTransaction(id: number, updateTransactionDto: UpdateTransactionDto, currentUser: User) {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: ['company', 'category', 'createdBy']
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    // Validate access
    await this.validateUserCompanyAccess(currentUser, transaction.company.id);

    // If categoryId is being updated, validate it
    if (updateTransactionDto.categoryId) {
      const category = await this.categoryService.findCategoryByID(updateTransactionDto.categoryId);
      if (!category) {
        throw new NotFoundException(`Category with ID ${updateTransactionDto.categoryId} not found`);
      }

      if (category.level !== CategoryLevel.SUB_SUB) {
        throw new BadRequestException(
          `Category "${category.name}" is not a transaction-level category. Please select a sub-sub category.`
        );
      }

      transaction.category = category;
    }

    // Update fields
    if (updateTransactionDto.date) transaction.date = new Date(updateTransactionDto.date);
    if (updateTransactionDto.transactionType) transaction.transactionType = updateTransactionDto.transactionType;
    if (updateTransactionDto.amount) transaction.amount = updateTransactionDto.amount;
    if (updateTransactionDto.description) transaction.description = updateTransactionDto.description;
    if (updateTransactionDto.referenceNumber !== undefined) transaction.referenceNumber = updateTransactionDto.referenceNumber;
    if (updateTransactionDto.paymentMethod) transaction.paymentMethod = updateTransactionDto.paymentMethod;
    if (updateTransactionDto.status) transaction.status = updateTransactionDto.status;
    if (updateTransactionDto.counterparty !== undefined) transaction.counterparty = updateTransactionDto.counterparty;
    if (updateTransactionDto.invoiceNumber !== undefined) transaction.invoiceNumber = updateTransactionDto.invoiceNumber;
    if (updateTransactionDto.dueDate) transaction.dueDate = new Date(updateTransactionDto.dueDate);
    if (updateTransactionDto.taxRate !== undefined) transaction.taxRate = updateTransactionDto.taxRate;
    if (updateTransactionDto.taxAmount !== undefined) transaction.taxAmount = updateTransactionDto.taxAmount;
    if (updateTransactionDto.notes !== undefined) transaction.notes = updateTransactionDto.notes;

    try {
      const updatedTransaction = await this.transactionRepository.save(transaction);

      return {
        status: 200,
        message: 'Transaction updated successfully',
        transaction: updatedTransaction,
      };
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw new BadRequestException(`Failed to update transaction: ${error.message}`);
    }
  }

  async deleteTransaction(id: number, currentUser: User) {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: ['company']
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    // Validate access
    await this.validateUserCompanyAccess(currentUser, transaction.company.id);

    try {
      await this.transactionRepository.softDelete(id);

      return {
        status: 200,
        message: 'Transaction deleted successfully',
      };
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw new BadRequestException(`Failed to delete transaction: ${error.message}`);
    }
  }

  // RECURRING TRANSACTIONS

  async getRecurringTransactions(currentUser: User) {
    const companyIds = await this.getUserCompanyIds(currentUser);

    const queryBuilder = this.transactionRepository.createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.company', 'company')
      .leftJoinAndSelect('transaction.category', 'category')
      .leftJoinAndSelect('category.parent', 'parent')
      .leftJoinAndSelect('parent.parent', 'grandparent')
      .leftJoinAndSelect('transaction.createdBy', 'createdBy')
      .where('transaction.isRecurring = :isRecurring', { isRecurring: true })
      .orderBy('transaction.date', 'DESC');

    if (companyIds !== null && companyIds.length > 0) {
      queryBuilder.andWhere('company.id IN (:...companyIds)', { companyIds });
    } else if (companyIds !== null && companyIds.length === 0) {
      return {
        status: 200,
        message: 'No recurring transactions available',
        count: 0,
        transactions: []
      };
    }

    const transactions = await queryBuilder.getMany();

    return {
      status: 200,
      message: 'Recurring transactions retrieved successfully',
      count: transactions.length,
      transactions: transactions.map(t => ({
        ...t,
        categoryPath: t.category.getFullPath()
      }))
    };
  }

  async getRecurringTransactionsByCompany(companyId: number, currentUser: User) {
    // Validate access
    await this.validateUserCompanyAccess(currentUser, companyId);

    const company = await this.companyService.findCompanyByID(companyId);
    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }

    const transactions = await this.transactionRepository.find({
      where: {
        company: { id: companyId },
        isRecurring: true
      },
      relations: ['category', 'category.parent', 'category.parent.parent'],
      order: { date: 'DESC' }
    });

    return {
      status: 200,
      message: `Recurring transactions for ${company.name}`,
      count: transactions.length,
      transactions: transactions.map(t => ({
        ...t,
        categoryPath: t.category.getFullPath()
      }))
    };
  }

  async executeRecurringTransaction(id: number, currentUser: User) {
    const template = await this.transactionRepository.findOne({
      where: { id },
      relations: ['company', 'category', 'createdBy']
    });

    if (!template) {
      throw new NotFoundException(`Recurring transaction template with ID ${id} not found`);
    }

    // Validate access
    await this.validateUserCompanyAccess(currentUser, template.company.id);

    if (!template.isRecurring) {
      throw new BadRequestException('This is not a recurring transaction');
    }

    // Create new transaction based on template
    const newTransaction = this.transactionRepository.create({
      date: new Date(),
      transactionType: template.transactionType,
      amount: template.amount,
      description: `${template.description} (Auto-generated from recurring)`,
      referenceNumber: template.referenceNumber ? `${template.referenceNumber}-AUTO-${Date.now()}` : undefined,
      paymentMethod: template.paymentMethod,
      status: template.status,
      counterparty: template.counterparty,
      taxRate: template.taxRate,
      taxAmount: template.taxAmount,
      notes: template.notes,
      isRecurring: false,
      company: template.company,
      category: template.category,
      createdBy: template.createdBy
    });

    const savedTransaction = await this.transactionRepository.save(newTransaction);

    return {
      status: 201,
      message: 'Recurring transaction executed successfully',
      transaction: savedTransaction,
      template: {
        id: template.id,
        description: template.description,
        frequency: template.recurringFrequency
      }
    };
  }

  // GLOBAL FINANCIAL REPORTS - Admin only

  async getGlobalIncomeStatement(year: number, currentUser: User) {
    if (currentUser.role !== 'admin') {
      throw new ForbiddenException('Only admins can access global financial reports');
    }

    const transactions = await this.transactionRepository.find({
      where: {
        financialYear: year,
        status: TransactionStatus.COMPLETED
      },
      relations: ['company', 'category', 'category.parent', 'category.parent.parent']
    });

    // Group by company
    const companiesMap = new Map();
    transactions.forEach(t => {
      if (!companiesMap.has(t.company.id)) {
        companiesMap.set(t.company.id, {
          companyId: t.company.id,
          companyName: t.company.name,
          transactions: []
        });
      }
      companiesMap.get(t.company.id).transactions.push(t);
    });

    const companyReports = Array.from(companiesMap.values()).map(company => {
      const revenue = company.transactions
        .filter(t => t.category.categoryType === CategoryType.REVENUE)
        .reduce((sum, t) => sum + Number(t.totalAmount), 0);

      const costOfSales = company.transactions
        .filter(t => t.category.categoryType === CategoryType.COST_OF_SALES)
        .reduce((sum, t) => sum + Number(t.totalAmount), 0);

      const expenses = company.transactions
        .filter(t => t.category.categoryType === CategoryType.EXPENSE)
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
        profitMargin: revenue > 0 ? ((netProfit / revenue) * 100).toFixed(2) + '%' : '0%'
      };
    });

    // Calculate totals
    const totalRevenue = companyReports.reduce((sum, c) => sum + c.revenue, 0);
    const totalCostOfSales = companyReports.reduce((sum, c) => sum + c.costOfSales, 0);
    const totalExpenses = companyReports.reduce((sum, c) => sum + c.operatingExpenses, 0);
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
        averageProfitMargin: totalRevenue > 0 ? ((totalNetProfit / totalRevenue) * 100).toFixed(2) + '%' : '0%'
      },
      companies: companyReports
    };
  }

  async getGlobalBalanceSheet(asOfDate: string, currentUser: User) {
    if (currentUser.role !== 'admin') {
      throw new ForbiddenException('Only admins can access global financial reports');
    }

    const transactions = await this.transactionRepository.find({
      where: {
        status: TransactionStatus.COMPLETED
      },
      relations: ['company', 'category', 'category.parent', 'category.parent.parent']
    });

    // Filter by date
    const filteredTransactions = transactions.filter(
      t => new Date(t.date) <= new Date(asOfDate)
    );

    // Group by company
    const companiesMap = new Map();
    filteredTransactions.forEach(t => {
      if (!companiesMap.has(t.company.id)) {
        companiesMap.set(t.company.id, {
          companyId: t.company.id,
          companyName: t.company.name,
          transactions: []
        });
      }
      companiesMap.get(t.company.id).transactions.push(t);
    });

    const companyReports = Array.from(companiesMap.values()).map(company => {
      const assetTransactions = company.transactions.filter(
        t => t.category.categoryType === CategoryType.ASSET
      );
      const totalAssets = this.calculateNetAmount(assetTransactions);

      const liabilityTransactions = company.transactions.filter(
        t => t.category.categoryType === CategoryType.LIABILITY
      );
      const totalLiabilities = this.calculateNetAmount(liabilityTransactions);

      const equityTransactions = company.transactions.filter(
        t => t.category.categoryType === CategoryType.EQUITY
      );
      const totalEquity = this.calculateNetAmount(equityTransactions);

      const revenue = company.transactions
        .filter(t => t.category.categoryType === CategoryType.REVENUE)
        .reduce((sum, t) => sum + Number(t.totalAmount), 0);

      const expenses = company.transactions
        .filter(t => t.category.categoryType === CategoryType.EXPENSE)
        .reduce((sum, t) => sum + Number(t.totalAmount), 0);

      const costOfSales = company.transactions
        .filter(t => t.category.categoryType === CategoryType.COST_OF_SALES)
        .reduce((sum, t) => sum + Number(t.totalAmount), 0);

      const retainedEarnings = revenue - expenses - costOfSales;

      return {
        companyId: company.companyId,
        companyName: company.companyName,
        totalAssets,
        totalLiabilities,
        totalEquity: totalEquity + retainedEarnings,
        retainedEarnings,
        balanceCheck: Math.abs(totalAssets - (totalLiabilities + totalEquity + retainedEarnings)) < 0.01 ? 'BALANCED' : 'UNBALANCED'
      };
    });

    const totalAssets = companyReports.reduce((sum, c) => sum + c.totalAssets, 0);
    const totalLiabilities = companyReports.reduce((sum, c) => sum + c.totalLiabilities, 0);
    const totalEquity = companyReports.reduce((sum, c) => sum + c.totalEquity, 0);

    return {
      status: 200,
      message: `Global Balance Sheet as of ${asOfDate}`,
      summary: {
        asOfDate,
        totalCompanies: companyReports.length,
        totalAssets,
        totalLiabilities,
        totalEquity,
        balanceCheck: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01 ? 'BALANCED' : 'UNBALANCED'
      },
      companies: companyReports
    };
  }

  async getGlobalCashBook(startDate: string, endDate: string, currentUser: User) {
    if (currentUser.role !== 'admin') {
      throw new ForbiddenException('Only admins can access global financial reports');
    }

    const transactions = await this.transactionRepository.find({
      where: {
        date: Between(new Date(startDate), new Date(endDate)),
        status: TransactionStatus.COMPLETED
      },
      relations: ['company', 'category', 'category.parent', 'category.parent.parent'],
      order: { date: 'ASC' }
    });

    // Group by company
    const companiesMap = new Map();
    transactions.forEach(t => {
      if (!companiesMap.has(t.company.id)) {
        companiesMap.set(t.company.id, {
          companyId: t.company.id,
          companyName: t.company.name,
          transactions: []
        });
      }
      companiesMap.get(t.company.id).transactions.push(t);
    });

    const companyReports = Array.from(companiesMap.values()).map(company => {
      const totalCashIn = company.transactions
        .filter(t => t.transactionType === 'debit')
        .reduce((sum, t) => sum + Number(t.totalAmount), 0);

      const totalCashOut = company.transactions
        .filter(t => t.transactionType === 'credit')
        .reduce((sum, t) => sum + Number(t.totalAmount), 0);

      return {
        companyId: company.companyId,
        companyName: company.companyName,
        totalCashIn,
        totalCashOut,
        netCashFlow: totalCashIn - totalCashOut,
        transactionCount: company.transactions.length
      };
    });

    const totalCashIn = companyReports.reduce((sum, c) => sum + c.totalCashIn, 0);
    const totalCashOut = companyReports.reduce((sum, c) => sum + c.totalCashOut, 0);

    return {
      status: 200,
      message: `Global Cash Book`,
      summary: {
        period: { startDate, endDate },
        totalCompanies: companyReports.length,
        totalCashIn,
        totalCashOut,
        netCashFlow: totalCashIn - totalCashOut
      },
      companies: companyReports
    };
  }

  // async getGlobalFinancialSummary(year: number, currentUser: User) {
  //   if (currentUser.role !== 'admin') {
  //     throw new ForbiddenException('Only admins can access global financial reports');
  //   }

  //   const transactions = await this.transactionRepository.find({
  //     where: {
  //       financialYear: year,
  //       status: TransactionStatus.COMPLETED
  //     },
  //     relations: ['company', 'category']
  //   });

  //   const totalTransactions = transactions.length;
  //   const totalRevenue = transactions
  //     .filter(t => t.category.categoryType === CategoryType.REVENUE)
  //     .reduce((sum, t) => sum + Number(t.totalAmount), 0);

  //   const totalExpenses = transactions
  //     .filter(t => t.category.categoryType === CategoryType.EXPENSE)
  //     .reduce((sum, t) => sum + Number(t.totalAmount), 0);

  //   const totalCostOfSales = transactions
  //     .filter(t => t.category.categoryType === CategoryType.COST_OF_SALES)
  //     .reduce((sum, t) => sum + Number(t.totalAmount), 0);

  //   const totalAssets = this.calculateNetAmount(
  //     transactions.filter(t => t.category.categoryType === CategoryType.ASSET)
  //   );

  //   const totalLiabilities = this.calculateNetAmount(
  //     transactions.filter(t => t.category.categoryType === CategoryType.LIABILITY)
  //   );

  //   const uniqueCompanies = new Set(transactions.map(t => t.company.id));
  //   const categoryBreakdown = this.groupByCategory(transactions);

  //   const paymentMethodBreakdown = transactions.reduce((acc, t) => {
  //     if (!acc[t.paymentMethod]) {
  //       acc[t.paymentMethod] = {
  //         method: t.paymentMethod,
  //         count: 0,
  //         totalAmount: 0
  //       };
  //     }
  //     acc[t.paymentMethod].count += 1;
  //     acc[t.paymentMethod].totalAmount += Number(t.totalAmount);
  //     return acc;
  //   }, {});

  //   return {
  //     status: 200,
  //     message: `Global Financial Summary - Year ${year}`,
  //     summary: {
  //       year,
  //       totalCompanies: uniqueCompanies.size,
  //       totalTransactions,
  //       revenue: {
  //         total: totalRevenue,
  //         averagePerCompany: uniqueCompanies.size > 0 ? (totalRevenue / uniqueCompanies.size) : 0
  //       },
  //       expenses: {
  //         total: totalExpenses,
  //         averagePerCompany: uniqueCompanies.size > 0 ? (totalExpenses / uniqueCompanies.size) : 0
  //       },
  //       costOfSales: totalCostOfSales,
  //       netProfit: totalRevenue - totalExpenses - totalCostOfSales,
  //       assets: totalAssets,
  //       liabilities: totalLiabilities,
  //       categoryBreakdown,
  //       paymentMethods: Object.values(paymentMethodBreakdown)
  //     }
  //   };
  // }



// Add this improved method to your TransactionService class

async getGlobalFinancialSummary(year: number, currentUser: User) {
  if (currentUser.role !== 'admin') {
    throw new ForbiddenException('Only admins can access global financial reports');
  }

  // FIXED: Load full category hierarchy
  const transactions = await this.transactionRepository.find({
    where: {
      financialYear: year,
      status: TransactionStatus.COMPLETED
    },
    relations: ['company', 'category', 'category.parent', 'category.parent.parent']
  });

  const totalTransactions = transactions.length;
  
  // Calculate financial metrics with proper category type checking
  const totalRevenue = transactions
    .filter(t => t.category.categoryType === CategoryType.REVENUE)
    .reduce((sum, t) => sum + Number(t.totalAmount), 0);

  const totalExpenses = transactions
    .filter(t => t.category.categoryType === CategoryType.EXPENSE)
    .reduce((sum, t) => sum + Number(t.totalAmount), 0);

  const totalCostOfSales = transactions
    .filter(t => t.category.categoryType === CategoryType.COST_OF_SALES)
    .reduce((sum, t) => sum + Number(t.totalAmount), 0);

  const totalAssets = this.calculateNetAmount(
    transactions.filter(t => t.category.categoryType === CategoryType.ASSET)
  );

  const totalLiabilities = this.calculateNetAmount(
    transactions.filter(t => t.category.categoryType === CategoryType.LIABILITY)
  );

  const uniqueCompanies = new Set(transactions.map(t => t.company.id));
  const categoryBreakdown = this.groupByCategory(transactions);

  // ENHANCED: Payment method breakdown
  const paymentMethodBreakdown = transactions.reduce((acc, t) => {
    if (!acc[t.paymentMethod]) {
      acc[t.paymentMethod] = {
        method: t.paymentMethod,
        count: 0,
        totalAmount: 0
      };
    }
    acc[t.paymentMethod].count += 1;
    acc[t.paymentMethod].totalAmount += Number(t.totalAmount);
    return acc;
  }, {});

  // ADVANCED ANALYTICS START HERE

  // 1. Monthly trends
  const monthlyTrends = this.calculateMonthlyTrends(transactions);

  // 2. Category type distribution
  const categoryTypeDistribution = this.calculateCategoryTypeDistribution(transactions);

  // 3. Company performance metrics
  const companyPerformance = this.calculateCompanyPerformance(transactions, uniqueCompanies);

  // 4. Cash flow analysis
  const cashFlowAnalysis = this.calculateCashFlowAnalysis(transactions);

  // 5. Transaction velocity (transactions per company)
  const transactionVelocity = {
    total: totalTransactions,
    averagePerCompany: uniqueCompanies.size > 0 ? (totalTransactions / uniqueCompanies.size).toFixed(2) : 0,
    mostActive: this.getMostActiveCompany(transactions),
    leastActive: this.getLeastActiveCompany(transactions)
  };

  // 6. Financial ratios
  const financialRatios = {
    profitMargin: totalRevenue > 0 ? ((totalRevenue - totalExpenses - totalCostOfSales) / totalRevenue * 100).toFixed(2) : '0',
    grossProfitMargin: totalRevenue > 0 ? ((totalRevenue - totalCostOfSales) / totalRevenue * 100).toFixed(2) : '0',
    debtToAssetRatio: totalAssets > 0 ? (totalLiabilities / totalAssets * 100).toFixed(2) : '0',
    currentRatio: totalLiabilities > 0 ? (totalAssets / totalLiabilities).toFixed(2) : 'N/A'
  };

  // 7. Expense breakdown by category
  const expenseBreakdown = this.getExpenseBreakdown(transactions);

  // 8. Revenue streams
  const revenueStreams = this.getRevenueStreams(transactions);

  // 9. Top transactions
  const topTransactions = {
    largest: transactions
      .sort((a, b) => Number(b.totalAmount) - Number(a.totalAmount))
      .slice(0, 5)
      .map(t => ({
        id: t.id,
        date: t.date,
        amount: Number(t.totalAmount),
        description: t.description,
        company: t.company.name,
        category: t.category.getFullPath()
      })),
    mostRecent: transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .map(t => ({
        id: t.id,
        date: t.date,
        amount: Number(t.totalAmount),
        description: t.description,
        company: t.company.name,
        category: t.category.getFullPath()
      }))
  };

  // 10. Payment method efficiency
  const paymentMethodEfficiency = this.calculatePaymentMethodEfficiency(transactions);

  // 11. Counterparty analysis
  const counterpartyAnalysis = this.analyzeCounterparties(transactions);

  // 12. Tax analysis
  const taxAnalysis = {
    totalTaxCollected: transactions.reduce((sum, t) => sum + (Number(t.taxAmount) || 0), 0),
    averageTaxRate: this.calculateAverageTaxRate(transactions),
    taxByCategory: this.getTaxByCategory(transactions)
  };

  return {
    status: 200,
    message: `Global Financial Summary - Year ${year}`,
    summary: {
      year,
      totalCompanies: uniqueCompanies.size,
      totalTransactions,
      
      // Core financials
      revenue: {
        total: totalRevenue,
        averagePerCompany: uniqueCompanies.size > 0 ? (totalRevenue / uniqueCompanies.size) : 0,
        breakdown: revenueStreams
      },
      expenses: {
        total: totalExpenses,
        averagePerCompany: uniqueCompanies.size > 0 ? (totalExpenses / uniqueCompanies.size) : 0,
        breakdown: expenseBreakdown
      },
      costOfSales: totalCostOfSales,
      netProfit: totalRevenue - totalExpenses - totalCostOfSales,
      assets: totalAssets,
      liabilities: totalLiabilities,
      
      // Enhanced breakdowns
      categoryBreakdown,
      paymentMethods: Object.values(paymentMethodBreakdown),
      
      // ADVANCED ANALYTICS
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
        taxAnalysis
      }
    }
  };
}

// HELPER METHODS FOR ADVANCED ANALYTICS

private calculateMonthlyTrends(transactions: Transaction[]) {
  const monthlyData = transactions.reduce((acc, t) => {
    const month = new Date(t.date).getMonth() + 1; // 1-12
    if (!acc[month]) {
      acc[month] = {
        month,
        revenue: 0,
        expenses: 0,
        transactions: 0,
        netIncome: 0
      };
    }
    
    const amount = Number(t.totalAmount);
    if (t.category.categoryType === CategoryType.REVENUE) {
      acc[month].revenue += amount;
    } else if (t.category.categoryType === CategoryType.EXPENSE) {
      acc[month].expenses += amount;
    }
    acc[month].transactions += 1;
    acc[month].netIncome = acc[month].revenue - acc[month].expenses;
    
    return acc;
  }, {});

  return Object.values(monthlyData).sort((a: any, b: any) => a.month - b.month);
}

private calculateCategoryTypeDistribution(transactions: Transaction[]) {
  const distribution = {};
  
  Object.values(CategoryType).forEach(type => {
    const typeTransactions = transactions.filter(t => t.category.categoryType === type);
    distribution[type] = {
      count: typeTransactions.length,
      totalAmount: typeTransactions.reduce((sum, t) => sum + Number(t.totalAmount), 0),
      percentage: transactions.length > 0 
        ? ((typeTransactions.length / transactions.length) * 100).toFixed(2)
        : '0'
    };
  });

  return distribution;
}

private calculateCompanyPerformance(transactions: Transaction[], uniqueCompanies: Set<number>) {
  const companyData = {};
  
  transactions.forEach(t => {
    if (!companyData[t.company.id]) {
      companyData[t.company.id] = {
        companyId: t.company.id,
        companyName: t.company.name,
        transactionCount: 0,
        totalVolume: 0,
        revenue: 0,
        expenses: 0,
        netIncome: 0
      };
    }
    
    const amount = Number(t.totalAmount);
    companyData[t.company.id].transactionCount += 1;
    companyData[t.company.id].totalVolume += amount;
    
    if (t.category.categoryType === CategoryType.REVENUE) {
      companyData[t.company.id].revenue += amount;
    } else if (t.category.categoryType === CategoryType.EXPENSE) {
      companyData[t.company.id].expenses += amount;
    }
    
    companyData[t.company.id].netIncome = 
      companyData[t.company.id].revenue - companyData[t.company.id].expenses;
  });

  return Object.values(companyData).sort((a: any, b: any) => b.totalVolume - a.totalVolume);
}

private calculateCashFlowAnalysis(transactions: Transaction[]) {
  const cashIn = transactions
    .filter(t => t.transactionType === 'debit')
    .reduce((sum, t) => sum + Number(t.totalAmount), 0);
    
  const cashOut = transactions
    .filter(t => t.transactionType === 'credit')
    .reduce((sum, t) => sum + Number(t.totalAmount), 0);
    
  return {
    totalCashIn: cashIn,
    totalCashOut: cashOut,
    netCashFlow: cashIn - cashOut,
    cashInTransactions: transactions.filter(t => t.transactionType === 'debit').length,
    cashOutTransactions: transactions.filter(t => t.transactionType === 'credit').length
  };
}

private getMostActiveCompany(transactions: Transaction[]) {
  const companyTransactions = transactions.reduce((acc, t) => {
    acc[t.company.id] = (acc[t.company.id] || 0) + 1;
    return acc;
  }, {});
  
  const mostActive = Object.entries(companyTransactions)
    .sort(([, a]: any, [, b]: any) => b - a)[0];
    
  if (!mostActive) return null;
  
  const company = transactions.find(t => t.company.id === Number(mostActive[0]))?.company;
  return {
    companyId: Number(mostActive[0]),
    companyName: company?.name,
    transactionCount: mostActive[1]
  };
}

private getLeastActiveCompany(transactions: Transaction[]) {
  const companyTransactions = transactions.reduce((acc, t) => {
    acc[t.company.id] = (acc[t.company.id] || 0) + 1;
    return acc;
  }, {});
  
  const leastActive = Object.entries(companyTransactions)
    .sort(([, a]: any, [, b]: any) => (a as number) - (b as number))[0];
    
  if (!leastActive) return null;
  
  const company = transactions.find(t => t.company.id === Number(leastActive[0]))?.company;
  return {
    companyId: Number(leastActive[0]),
    companyName: company?.name,
    transactionCount: leastActive[1]
  };
}

private getExpenseBreakdown(transactions: Transaction[]) {
  const expenses = transactions.filter(t => t.category.categoryType === CategoryType.EXPENSE);
  
  const breakdown = expenses.reduce((acc, t) => {
    const categoryPath = t.category.getFullPath();
    if (!acc[categoryPath]) {
      acc[categoryPath] = {
        category: categoryPath,
        amount: 0,
        count: 0
      };
    }
    acc[categoryPath].amount += Number(t.totalAmount);
    acc[categoryPath].count += 1;
    return acc;
  }, {});
  
  return Object.values(breakdown).sort((a: any, b: any) => b.amount - a.amount);
}

private getRevenueStreams(transactions: Transaction[]) {
  const revenue = transactions.filter(t => t.category.categoryType === CategoryType.REVENUE);
  
  const streams = revenue.reduce((acc, t) => {
    const categoryPath = t.category.getFullPath();
    if (!acc[categoryPath]) {
      acc[categoryPath] = {
        category: categoryPath,
        amount: 0,
        count: 0
      };
    }
    acc[categoryPath].amount += Number(t.totalAmount);
    acc[categoryPath].count += 1;
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
        expenses: 0
      };
    }
    
    const amount = Number(t.totalAmount);
    acc[t.paymentMethod].totalAmount += amount;
    acc[t.paymentMethod].count += 1;
    
    if (t.category.categoryType === CategoryType.REVENUE) {
      acc[t.paymentMethod].revenue += amount;
    } else if (t.category.categoryType === CategoryType.EXPENSE) {
      acc[t.paymentMethod].expenses += amount;
    }
    
    return acc;
  }, {});
  
  Object.values(methodData).forEach((data: any) => {
    data.averageAmount = data.count > 0 ? (data.totalAmount / data.count).toFixed(2) : 0;
  });
  
  return Object.values(methodData);
}

private analyzeCounterparties(transactions: Transaction[]) {
  const counterparties = transactions
    .filter(t => t.counterparty)
    .reduce((acc, t) => {
      if (!acc[t.counterparty]) {
        acc[t.counterparty] = {
          name: t.counterparty,
          transactionCount: 0,
          totalAmount: 0,
          revenue: 0,
          expenses: 0
        };
      }
      
      const amount = Number(t.totalAmount);
      acc[t.counterparty].transactionCount += 1;
      acc[t.counterparty].totalAmount += amount;
      
      if (t.category.categoryType === CategoryType.REVENUE) {
        acc[t.counterparty].revenue += amount;
      } else if (t.category.categoryType === CategoryType.EXPENSE) {
        acc[t.counterparty].expenses += amount;
      }
      
      return acc;
    }, {});
  
  return Object.values(counterparties)
    .sort((a: any, b: any) => b.totalAmount - a.totalAmount)
    .slice(0, 10); // Top 10 counterparties
}

private calculateAverageTaxRate(transactions: Transaction[]) {
  const taxableTransactions = transactions.filter(t => t.taxRate && t.taxRate > 0);
  
  if (taxableTransactions.length === 0) return '0';
  
  const totalTaxRate = taxableTransactions.reduce((sum, t) => sum + (t.taxRate || 0), 0);
  return (totalTaxRate / taxableTransactions.length).toFixed(2);
}

private getTaxByCategory(transactions: Transaction[]) {
  const taxData = transactions
    .filter(t => t.taxAmount && t.taxAmount > 0)
    .reduce((acc, t) => {
      const categoryPath = t.category.getFullPath();
      if (!acc[categoryPath]) {
        acc[categoryPath] = {
          category: categoryPath,
          totalTax: 0,
          transactionCount: 0,
          averageTaxRate: 0,
          taxRates: []
        };
      }
      
      acc[categoryPath].totalTax += Number(t.taxAmount);
      acc[categoryPath].transactionCount += 1;
      if (t.taxRate) {
        acc[categoryPath].taxRates.push(t.taxRate);
      }
      
      return acc;
    }, {});
  
  Object.values(taxData).forEach((data: any) => {
    if (data.taxRates.length > 0) {
      data.averageTaxRate = (
        data.taxRates.reduce((sum: number, rate: number) => sum + rate, 0) / data.taxRates.length
      ).toFixed(2);
    }
    delete data.taxRates; // Remove temporary array
  });
  
  return Object.values(taxData).sort((a: any, b: any) => b.totalTax - a.totalTax);
}
  async getCompanyComparison(year: number, currentUser: User) {
    if (currentUser.role !== 'admin') {
      throw new ForbiddenException('Only admins can access global financial reports');
    }

    const transactions = await this.transactionRepository.find({
      where: {
        financialYear: year,
        status: TransactionStatus.COMPLETED
      },
      relations: ['company', 'category']
    });

    // Group by company
    const companiesMap = new Map();
    transactions.forEach(t => {
      if (!companiesMap.has(t.company.id)) {
        companiesMap.set(t.company.id, {
          companyId: t.company.id,
          companyName: t.company.name,
          transactions: []
        });
      }
      companiesMap.get(t.company.id).transactions.push(t);
    });

    const companyMetrics = Array.from(companiesMap.values()).map(company => {
      const revenue = company.transactions
        .filter(t => t.category.categoryType === CategoryType.REVENUE)
        .reduce((sum, t) => sum + Number(t.totalAmount), 0);

      const expenses = company.transactions
        .filter(t => t.category.categoryType === CategoryType.EXPENSE)
        .reduce((sum, t) => sum + Number(t.totalAmount), 0);

      const costOfSales = company.transactions
        .filter(t => t.category.categoryType === CategoryType.COST_OF_SALES)
        .reduce((sum, t) => sum + Number(t.totalAmount), 0);

      const netProfit = revenue - expenses - costOfSales;
      const grossProfit = revenue - costOfSales;

      const assets = this.calculateNetAmount(
        company.transactions.filter(t => t.category.categoryType === CategoryType.ASSET)
      );

      const liabilities = this.calculateNetAmount(
        company.transactions.filter(t => t.category.categoryType === CategoryType.LIABILITY)
      );

      return {
        companyId: company.companyId,
        companyName: company.companyName,
        revenue,
        expenses,
        costOfSales,
        grossProfit,
        netProfit,
        profitMargin: revenue > 0 ? ((netProfit / revenue) * 100).toFixed(2) : '0',
        assets,
        liabilities,
        equity: assets - liabilities,
        transactionCount: company.transactions.length,
        averageTransactionSize: company.transactions.length > 0
          ? (company.transactions.reduce((sum, t) => sum + Number(t.totalAmount), 0) / company.transactions.length)
          : 0
      };
    });

    const topByRevenue = [...companyMetrics].sort((a, b) => b.revenue - a.revenue);
    const topByProfit = [...companyMetrics].sort((a, b) => b.netProfit - a.netProfit);
    const topByMargin = [...companyMetrics].sort((a, b) => parseFloat(b.profitMargin) - parseFloat(a.profitMargin));

    return {
      status: 200,
      message: `Company Comparison - Year ${year}`,
      summary: {
        year,
        totalCompanies: companyMetrics.length,
        topPerformers: {
          byRevenue: topByRevenue.slice(0, 5),
          byProfit: topByProfit.slice(0, 5),
          byProfitMargin: topByMargin.slice(0, 5)
        },
        allCompanies: companyMetrics
      }
    };
  }

  // Helper methods
  private groupByCategory(transactions: Transaction[]) {
    const grouped = transactions.reduce((acc, t) => {
      const categoryPath = t.category.getFullPath();
      if (!acc[categoryPath]) {
        acc[categoryPath] = {
          categoryId: t.category.id,
          categoryName: t.category.name,
          categoryPath: categoryPath,
          totalAmount: 0,
          transactionCount: 0
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



  // Add to TransactionService class

  async getRecurringTransactionStatus(id: number, currentUser: User) {
    const transaction = await this.transactionRepository.findOne({
      where: { id, isRecurring: true },
      relations: ['company'],
    });

    if (!transaction) {
      throw new NotFoundException(`Recurring transaction ${id} not found`);
    }

    // Validate access
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

    // Validate access
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

    // Validate access
    await this.validateUserCompanyAccess(currentUser, transaction.company.id);

    await this.recurringTransactionService.resumeRecurringTransaction(id);

    return {
      status: 200,
      message: 'Recurring transaction resumed successfully',
    };
  }
}