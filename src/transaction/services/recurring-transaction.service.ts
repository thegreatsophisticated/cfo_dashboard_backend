// src/transaction/services/recurring-transaction.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Transaction, TransactionStatus } from '../entities/transaction.entity';

@Injectable()
export class RecurringTransactionService {
  private readonly logger = new Logger(RecurringTransactionService.name);

  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
  ) {}

  /**
   * Runs every day at 12:00 AM to check and execute recurring transactions
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleRecurringTransactions() {
    this.logger.log('Starting recurring transaction execution check...');

    try {
      const dueTransactions = await this.findDueRecurringTransactions();
      this.logger.log(`Found ${dueTransactions.length} recurring transactions to execute`);

      for (const template of dueTransactions) {
        await this.executeRecurringTransaction(template);
      }

      this.logger.log('Recurring transaction execution completed');
    } catch (error) {
      this.logger.error('Error executing recurring transactions:', error);
    }
  }

  /**
   * Find all recurring transactions that are due for execution
   */
  private async findDueRecurringTransactions(): Promise<Transaction[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await this.transactionRepository.find({
      where: {
        isRecurring: true,
        isRecurringActive: true,
        nextExecutionDate: LessThanOrEqual(today),
      },
      relations: ['company', 'category', 'createdBy'],
    });
  }

  /**
   * Execute a single recurring transaction
   */
  private async executeRecurringTransaction(template: Transaction): Promise<void> {
    try {
      this.logger.log(`Executing recurring transaction ${template.id} - ${template.description}`);

      // Check if recurring has ended
      if (this.shouldStopRecurring(template)) {
        await this.deactivateRecurringTransaction(template);
        this.logger.log(`Recurring transaction ${template.id} has ended`);
        return;
      }

      // Create new transaction from template
      const newTransaction = this.transactionRepository.create({
        date: new Date(),
        transactionType: template.transactionType,
        amount: template.amount,
        description: `${template.description} (Recurring ${template.executionCount + 1})`,
        referenceNumber: template.referenceNumber 
          ? `${template.referenceNumber}-R${template.executionCount + 1}-${Date.now()}` 
          : `REC-${template.id}-${Date.now()}`,
        paymentMethod: template.paymentMethod,
        status: TransactionStatus.COMPLETED,
        counterparty: template.counterparty,
        invoiceNumber: template.invoiceNumber,
        taxRate: template.taxRate,
        taxAmount: template.taxAmount,
        notes: `Auto-generated from recurring template #${template.id}. Execution #${template.executionCount + 1}`,
        attachments: template.attachments,
        isRecurring: false,
        company: template.company,
        category: template.category,
        createdBy: template.createdBy,
      });

      await this.transactionRepository.save(newTransaction);

      // Update template for next execution
      await this.updateTemplateForNextExecution(template);

      this.logger.log(
        `Successfully created transaction from recurring template ${template.id}. ` +
        `Execution count: ${template.executionCount + 1}`
      );
    } catch (error) {
      this.logger.error(`Error executing recurring transaction ${template.id}:`, error);
      throw error;
    }
  }

  /**
   * Check if recurring transaction should stop
   */
  private shouldStopRecurring(template: Transaction): boolean {
    // Check execution count limit
    if (
      template.recurringExecutionCount && 
      template.executionCount >= template.recurringExecutionCount
    ) {
      return true;
    }

    // Check end date
    if (template.recurringEndDate) {
      const endDate = new Date(template.recurringEndDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (today > endDate) {
        return true;
      }
    }

    return false;
  }

  /**
   * Update template for next execution
   */
  private async updateTemplateForNextExecution(template: Transaction): Promise<void> {
    const nextDate = template.calculateNextExecutionDate(new Date());

    template.lastExecutionDate = new Date();
    template.nextExecutionDate = nextDate;
    template.executionCount += 1;

    await this.transactionRepository.save(template);
  }

  /**
   * Deactivate a recurring transaction
   */
  private async deactivateRecurringTransaction(template: Transaction): Promise<void> {
    template.isRecurringActive = false;
    template.lastExecutionDate = new Date();
    template.nextExecutionDate = null;

    await this.transactionRepository.save(template);
  }

  /**
   * Manually execute a recurring transaction (for testing or manual trigger)
   */
  async manuallyExecuteRecurringTransaction(templateId: number): Promise<Transaction> {
    const template = await this.transactionRepository.findOne({
      where: { id: templateId, isRecurring: true },
      relations: ['company', 'category', 'createdBy'],
    });

    if (!template) {
      throw new Error(`Recurring transaction template ${templateId} not found`);
    }

    if (!template.isRecurringActive) {
      throw new Error(`Recurring transaction ${templateId} is not active`);
    }

    if (this.shouldStopRecurring(template)) {
      await this.deactivateRecurringTransaction(template);
      throw new Error(`Recurring transaction ${templateId} has reached its limit`);
    }

    // Create new transaction
    const newTransaction = this.transactionRepository.create({
      date: new Date(),
      transactionType: template.transactionType,
      amount: template.amount,
      description: `${template.description} (Manual Recurring ${template.executionCount + 1})`,
      referenceNumber: template.referenceNumber 
        ? `${template.referenceNumber}-R${template.executionCount + 1}-${Date.now()}` 
        : `REC-${template.id}-${Date.now()}`,
      paymentMethod: template.paymentMethod,
      status: TransactionStatus.COMPLETED,
      counterparty: template.counterparty,
      invoiceNumber: template.invoiceNumber,
      taxRate: template.taxRate,
      taxAmount: template.taxAmount,
      notes: `Manually triggered from recurring template #${template.id}. Execution #${template.executionCount + 1}`,
      attachments: template.attachments,
      isRecurring: false,
      company: template.company,
      category: template.category,
      createdBy: template.createdBy,
    });

    const savedTransaction = await this.transactionRepository.save(newTransaction);

    // Update template
    await this.updateTemplateForNextExecution(template);

    return savedTransaction;
  }

  /**
   * Get recurring transaction status
   */
  async getRecurringTransactionStatus(templateId: number) {
    const template = await this.transactionRepository.findOne({
      where: { id: templateId, isRecurring: true },
    });

    if (!template) {
      throw new Error(`Recurring transaction template ${templateId} not found`);
    }

    return {
      id: template.id,
      description: template.description,
      frequency: template.recurringFrequency,
      isActive: template.isRecurringActive,
      executionCount: template.executionCount,
      lastExecutionDate: template.lastExecutionDate,
      nextExecutionDate: template.nextExecutionDate,
      recurringEndDate: template.recurringEndDate,
      recurringExecutionCount: template.recurringExecutionCount,
      willContinue: !this.shouldStopRecurring(template),
    };
  }

  /**
   * Pause a recurring transaction
   */
  async pauseRecurringTransaction(templateId: number): Promise<void> {
    const template = await this.transactionRepository.findOne({
      where: { id: templateId, isRecurring: true },
    });

    if (!template) {
      throw new Error(`Recurring transaction template ${templateId} not found`);
    }

    template.isRecurringActive = false;
    await this.transactionRepository.save(template);
  }

  /**
   * Resume a recurring transaction
   */
  async resumeRecurringTransaction(templateId: number): Promise<void> {
    const template = await this.transactionRepository.findOne({
      where: { id: templateId, isRecurring: true },
    });

    if (!template) {
      throw new Error(`Recurring transaction template ${templateId} not found`);
    }

    if (this.shouldStopRecurring(template)) {
      throw new Error(`Cannot resume: recurring transaction has reached its limit`);
    }

    template.isRecurringActive = true;
    
    // If no next execution date, calculate one
    if (!template.nextExecutionDate) {
      template.nextExecutionDate = template.calculateNextExecutionDate(new Date());
    }

    await this.transactionRepository.save(template);
  }

  /**
   * Delete a recurring transaction template
   */
  async deleteRecurringTransaction(templateId: number): Promise<void> {
    await this.transactionRepository.softDelete(templateId);
  }
}