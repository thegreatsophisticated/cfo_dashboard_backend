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
// import { PaginationDto } from './dto/pagination.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { User } from 'src/users/entities/user.entity';
import { PaginationDto } from './dto/pagination.dto';

@Controller('transactions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

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

  // GET /transactions?page=1&limit=10
  @Get()
  findAll(
    @CurrentUser() currentUser: User,
    @Query() pagination: PaginationDto,
  ) {
    return this.transactionService.findAllTransactions(currentUser, pagination);
  }

  // GET /transactions/company/:companyId?page=1&limit=10
  @Get('company/:companyId')
  findByCompany(
    @Param('companyId', ParseIntPipe) companyId: number,
    @CurrentUser() currentUser: User,
    @Query() pagination: PaginationDto,
  ) {
    return this.transactionService.findTransactionsByCompany(
      companyId,
      currentUser,
      pagination,
    );
  }

  // GET /transactions/category/:categoryId?page=1&limit=10
  @Get('category/:categoryId')
  findByCategory(
    @Param('categoryId', ParseIntPipe) categoryId: number,
    @CurrentUser() currentUser: User,
    @Query() pagination: PaginationDto,
  ) {
    return this.transactionService.findTransactionsByCategory(
      categoryId,
      currentUser,
      pagination,
    );
  }

  // GET /transactions/date-range/:companyId?startDate=...&endDate=...&page=1&limit=10
  @Get('date-range/:companyId')
  findByDateRange(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @CurrentUser() currentUser: User,
    @Query() pagination: PaginationDto,
  ) {
    return this.transactionService.findTransactionsByDateRange(
      companyId,
      startDate,
      endDate,
      currentUser,
      pagination,
    );
  }

  // GET /transactions/recurring?page=1&limit=10
  @Get('recurring')
  getRecurringTransactions(
    @CurrentUser() currentUser: User,
    @Query() pagination: PaginationDto,
  ) {
    return this.transactionService.getRecurringTransactions(
      currentUser,
      pagination,
    );
  }

  // GET /transactions/recurring/company/:companyId?page=1&limit=10
  @Get('recurring/company/:companyId')
  getRecurringTransactionsByCompany(
    @Param('companyId', ParseIntPipe) companyId: number,
    @CurrentUser() currentUser: User,
    @Query() pagination: PaginationDto,
  ) {
    return this.transactionService.getRecurringTransactionsByCompany(
      companyId,
      currentUser,
      pagination,
    );
  }

  @Post('recurring/:id/execute')
  @HttpCode(HttpStatus.CREATED)
  executeRecurringTransaction(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
  ) {
    return this.transactionService.executeRecurringTransaction(id, currentUser);
  }

  // GET /transactions/reports/income-statement/:companyId?year=2024
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

  // GET /transactions/reports/balance-sheet/:companyId?asOfDate=...
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

  // GET /transactions/reports/cash-book/:companyId?startDate=...&endDate=...&page=1&limit=10
  @Get('reports/cash-book/:companyId')
  getCashBook(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @CurrentUser() currentUser: User,
    @Query() pagination: PaginationDto,
  ) {
    return this.transactionService.getCashBook(
      companyId,
      startDate,
      endDate,
      currentUser,
      pagination,
    );
  }

  // GET /transactions/reports/global/income-statement?year=2024
  @Get('reports/global/income-statement')
  @Roles('admin')
  getGlobalIncomeStatement(
    @Query('year', ParseIntPipe) year: number,
    @CurrentUser() currentUser: User,
  ) {
    return this.transactionService.getGlobalIncomeStatement(year, currentUser);
  }

  // GET /transactions/reports/global/balance-sheet?asOfDate=...
  @Get('reports/global/balance-sheet')
  @Roles('admin')
  getGlobalBalanceSheet(
    @Query('asOfDate') asOfDate: string,
    @CurrentUser() currentUser: User,
  ) {
    return this.transactionService.getGlobalBalanceSheet(asOfDate, currentUser);
  }

  // GET /transactions/reports/global/cash-book?startDate=...&endDate=...&page=1&limit=10
  @Get('reports/global/cash-book')
  @Roles('admin')
  getGlobalCashBook(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @CurrentUser() currentUser: User,
    @Query() pagination: PaginationDto,
  ) {
    return this.transactionService.getGlobalCashBook(
      startDate,
      endDate,
      currentUser,
      pagination,
    );
  }

  @Get('reports/global/summary')
  @Roles('admin')
  getGlobalFinancialSummary(
    @Query('year', ParseIntPipe) year: number,
    @CurrentUser() currentUser: User,
  ) {
    return this.transactionService.getGlobalFinancialSummary(year, currentUser);
  }

  @Get('reports/global/company-comparison')
  @Roles('admin')
  getCompanyComparison(
    @Query('year', ParseIntPipe) year: number,
    @CurrentUser() currentUser: User,
  ) {
    return this.transactionService.getCompanyComparison(year, currentUser);
  }

  // GET /transactions/:id
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
  ) {
    return this.transactionService.findTransactionById(id, currentUser);
  }

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

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
  ) {
    return this.transactionService.deleteTransaction(id, currentUser);
  }

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

  @Patch('recurring/:id/pause')
  pauseRecurring(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
  ) {
    return this.transactionService.pauseRecurringTransaction(id, currentUser);
  }

  @Patch('recurring/:id/resume')
  resumeRecurring(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
  ) {
    return this.transactionService.resumeRecurringTransaction(id, currentUser);
  }
}
