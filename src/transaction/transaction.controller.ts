// import {
//   Controller,
//   Get,
//   Post,
//   Body,
//   Patch,
//   Param,
//   Delete,
//   Query,
//   ParseIntPipe
// } from '@nestjs/common';
// import { TransactionService } from './transaction.service';
// import { CreateTransactionDto } from './dto/create-transaction.dto';
// import { UpdateTransactionDto } from './dto/update-transaction.dto';

// @Controller('transactions')
// export class TransactionController {
//   constructor(private readonly transactionService: TransactionService) {}

//   @Post()
//   create(@Body() createTransactionDto: CreateTransactionDto) {
//     return this.transactionService.createTransaction(createTransactionDto);
//   }

//   @Get()
//   findAll() {
//     return this.transactionService.findAllTransactions();
//   }

//   @Get('company/:companyId')
//   findByCompany(@Param('companyId', ParseIntPipe) companyId: number) {
//     return this.transactionService.findTransactionsByCompany(companyId);
//   }

//   @Get('category/:categoryId')
//   findByCategory(@Param('categoryId', ParseIntPipe) categoryId: number) {
//     return this.transactionService.findTransactionsByCategory(categoryId);
//   }

//   @Get('date-range/:companyId')
//   findByDateRange(
//     @Param('companyId', ParseIntPipe) companyId: number,
//     @Query('startDate') startDate: string,
//     @Query('endDate') endDate: string
//   ) {
//     return this.transactionService.findTransactionsByDateRange(companyId, startDate, endDate);
//   }

//   // Recurring Transactions Endpoints

//   @Get('recurring')
//   getRecurringTransactions() {
//     return this.transactionService.getRecurringTransactions();
//   }

//   @Get('recurring/company/:companyId')
//   getRecurringTransactionsByCompany(@Param('companyId', ParseIntPipe) companyId: number) {
//     return this.transactionService.getRecurringTransactionsByCompany(companyId);
//   }

//   @Post('recurring/:id/execute')
//   executeRecurringTransaction(@Param('id', ParseIntPipe) id: number) {
//     return this.transactionService.executeRecurringTransaction(id);
//   }

//   // Financial Reports Endpoints - By Company

//   @Get('reports/income-statement/:companyId')
//   getIncomeStatement(
//     @Param('companyId', ParseIntPipe) companyId: number,
//     @Query('year', ParseIntPipe) year: number
//   ) {
//     return this.transactionService.getIncomeStatement(companyId, year);
//   }

//   @Get('reports/balance-sheet/:companyId')
//   getBalanceSheet(
//     @Param('companyId', ParseIntPipe) companyId: number,
//     @Query('asOfDate') asOfDate: string
//   ) {
//     return this.transactionService.getBalanceSheet(companyId, asOfDate);
//   }

//   @Get('reports/cash-book/:companyId')
//   getCashBook(
//     @Param('companyId', ParseIntPipe) companyId: number,
//     @Query('startDate') startDate: string,
//     @Query('endDate') endDate: string
//   ) {
//     return this.transactionService.getCashBook(companyId, startDate, endDate);
//   }

//   // Global Financial Reports - All Companies

//   @Get('reports/global/income-statement')
//   getGlobalIncomeStatement(@Query('year', ParseIntPipe) year: number) {
//     return this.transactionService.getGlobalIncomeStatement(year);
//   }

//   @Get('reports/global/balance-sheet')
//   getGlobalBalanceSheet(@Query('asOfDate') asOfDate: string) {
//     return this.transactionService.getGlobalBalanceSheet(asOfDate);
//   }

//   @Get('reports/global/cash-book')
//   getGlobalCashBook(
//     @Query('startDate') startDate: string,
//     @Query('endDate') endDate: string
//   ) {
//     return this.transactionService.getGlobalCashBook(startDate, endDate);
//   }

//   @Get('reports/global/summary')
//   getGlobalFinancialSummary(
//     @Query('year', ParseIntPipe) year: number
//   ) {
//     return this.transactionService.getGlobalFinancialSummary(year);
//   }

//   @Get('reports/global/company-comparison')
//   getCompanyComparison(
//     @Query('year', ParseIntPipe) year: number
//   ) {
//     return this.transactionService.getCompanyComparison(year);
//   }

//   @Get(':id')
//   findOne(@Param('id', ParseIntPipe) id: number) {
//     return this.transactionService.findTransactionById(id);
//   }

//   @Patch(':id')
//   update(
//     @Param('id', ParseIntPipe) id: number,
//     @Body() updateTransactionDto: UpdateTransactionDto
//   ) {
//     return this.transactionService.updateTransaction(id, updateTransactionDto);
//   }

//   @Delete(':id')
//   remove(@Param('id', ParseIntPipe) id: number) {
//     return this.transactionService.deleteTransaction(id);
//   }
// }

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { User } from 'src/users/entities/user.entity';

@Controller('transactions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  /**
   * Create a transaction
   * User: Can only create for their assigned company
   * Admin: Can create for any company
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createTransactionDto: CreateTransactionDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.transactionService.createTransaction(
      createTransactionDto,
      currentUser,
    );
  }

  /**
   * Get all transactions
   * User: Only transactions from their assigned company
   * Admin: All transactions
   */
  @Get()
  findAll(@CurrentUser() currentUser: User) {
    return this.transactionService.findAllTransactions(currentUser);
  }

  /**
   * Get transactions by company
   * User: Only if it's their assigned company
   * Admin: Any company
   */
  @Get('company/:companyId')
  findByCompany(
    @Param('companyId', ParseIntPipe) companyId: number,
    @CurrentUser() currentUser: User,
  ) {
    return this.transactionService.findTransactionsByCompany(
      companyId,
      currentUser,
    );
  }

  /**
   * Get transactions by category
   * User: Only from their assigned company
   * Admin: All companies
   */
  @Get('category/:categoryId')
  findByCategory(
    @Param('categoryId', ParseIntPipe) categoryId: number,
    @CurrentUser() currentUser: User,
  ) {
    return this.transactionService.findTransactionsByCategory(
      categoryId,
      currentUser,
    );
  }

  /**
   * Get transactions by date range
   * User: Only if it's their assigned company
   * Admin: Any company
   */
  @Get('date-range/:companyId')
  findByDateRange(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @CurrentUser() currentUser: User,
  ) {
    return this.transactionService.findTransactionsByDateRange(
      companyId,
      startDate,
      endDate,
      currentUser,
    );
  }

  // Recurring Transactions Endpoints

  /**
   * Get all recurring transactions
   * User: Only from their assigned company
   * Admin: All companies
   */
  @Get('recurring')
  getRecurringTransactions(@CurrentUser() currentUser: User) {
    return this.transactionService.getRecurringTransactions(currentUser);
  }

  /**
   * Get recurring transactions by company
   * User: Only if it's their assigned company
   * Admin: Any company
   */
  @Get('recurring/company/:companyId')
  getRecurringTransactionsByCompany(
    @Param('companyId', ParseIntPipe) companyId: number,
    @CurrentUser() currentUser: User,
  ) {
    return this.transactionService.getRecurringTransactionsByCompany(
      companyId,
      currentUser,
    );
  }

  /**
   * Execute a recurring transaction
   * User: Only if transaction belongs to their assigned company
   * Admin: Any company
   */
  @Post('recurring/:id/execute')
  @HttpCode(HttpStatus.CREATED)
  executeRecurringTransaction(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
  ) {
    return this.transactionService.executeRecurringTransaction(id, currentUser);
  }

  // Financial Reports Endpoints - By Company

  /**
   * Get income statement for a company
   * User: Only for their assigned company
   * Admin: Any company
   */
  @Get('reports/income-statement/:companyId')
  getIncomeStatement(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Query('year', ParseIntPipe) year: number,
    @CurrentUser() currentUser: User,
  ) {
    return this.transactionService.getIncomeStatement(
      companyId,
      year,
      currentUser,
    );
  }

  /**
   * Get balance sheet for a company
   * User: Only for their assigned company
   * Admin: Any company
   */
  @Get('reports/balance-sheet/:companyId')
  getBalanceSheet(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Query('asOfDate') asOfDate: string,
    @CurrentUser() currentUser: User,
  ) {
    return this.transactionService.getBalanceSheet(
      companyId,
      asOfDate,
      currentUser,
    );
  }

  /**
   * Get cash book for a company
   * User: Only for their assigned company
   * Admin: Any company
   */
  @Get('reports/cash-book/:companyId')
  getCashBook(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @CurrentUser() currentUser: User,
  ) {
    return this.transactionService.getCashBook(
      companyId,
      startDate,
      endDate,
      currentUser,
    );
  }

  // Global Financial Reports - Admin Only

  /**
   * Get global income statement
   * Admin only
   */
  @Get('reports/global/income-statement')
  @Roles('admin')
  getGlobalIncomeStatement(
    @Query('year', ParseIntPipe) year: number,
    @CurrentUser() currentUser: User,
  ) {
    return this.transactionService.getGlobalIncomeStatement(year, currentUser);
  }

  /**
   * Get global balance sheet
   * Admin only
   */
  @Get('reports/global/balance-sheet')
  @Roles('admin')
  getGlobalBalanceSheet(
    @Query('asOfDate') asOfDate: string,
    @CurrentUser() currentUser: User,
  ) {
    return this.transactionService.getGlobalBalanceSheet(asOfDate, currentUser);
  }

  /**
   * Get global cash book
   * Admin only
   */
  @Get('reports/global/cash-book')
  @Roles('admin')
  getGlobalCashBook(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @CurrentUser() currentUser: User,
  ) {
    return this.transactionService.getGlobalCashBook(
      startDate,
      endDate,
      currentUser,
    );
  }

  /**
   * Get global financial summary
   * Admin only
   */
  @Get('reports/global/summary')
  @Roles('admin')
  getGlobalFinancialSummary(
    @Query('year', ParseIntPipe) year: number,
    @CurrentUser() currentUser: User,
  ) {
    return this.transactionService.getGlobalFinancialSummary(year, currentUser);
  }

  /**
   * Get company comparison
   * Admin only
   */
  @Get('reports/global/company-comparison')
  @Roles('admin')
  getCompanyComparison(
    @Query('year', ParseIntPipe) year: number,
    @CurrentUser() currentUser: User,
  ) {
    return this.transactionService.getCompanyComparison(year, currentUser);
  }

  /**
   * Get a specific transaction
   * User: Only if transaction belongs to their assigned company
   * Admin: Any transaction
   */
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
  ) {
    return this.transactionService.findTransactionById(id, currentUser);
  }

  /**
   * Update a transaction
   * User: Only if transaction belongs to their assigned company
   * Admin: Any transaction
   */
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTransactionDto: UpdateTransactionDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.transactionService.updateTransaction(
      id,
      updateTransactionDto,
      currentUser,
    );
  }

  /**
   * Delete a transaction
   * User: Only if transaction belongs to their assigned company
   * Admin: Any transaction
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
  ) {
    return this.transactionService.deleteTransaction(id, currentUser);
  }

  /**
   * Get recurring transaction status
   */
  @Get('recurring/:id/status')
  getRecurringStatus(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
  ) {
    return this.transactionService.getRecurringTransactionStatus(
      id,
      currentUser,
    );
  }

  /**
   * Pause recurring transaction
   */
  @Patch('recurring/:id/pause')
  pauseRecurring(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
  ) {
    return this.transactionService.pauseRecurringTransaction(id, currentUser);
  }

  /**
   * Resume recurring transaction
   */
  @Patch('recurring/:id/resume')
  resumeRecurring(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
  ) {
    return this.transactionService.resumeRecurringTransaction(id, currentUser);
  }
}
