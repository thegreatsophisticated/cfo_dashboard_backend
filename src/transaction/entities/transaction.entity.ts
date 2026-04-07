// import { Category } from '../../category/entities/category.entity';
// import { Company } from '../../company/entities/company.entity';
// import { User } from '../../users/entities/user.entity';

// import {
//   Column,
//   CreateDateColumn,
//   DeleteDateColumn,
//   Entity,
//   ManyToOne,
//   PrimaryGeneratedColumn,
//   UpdateDateColumn,
//   Index,
//   BeforeInsert,
//   BeforeUpdate,
// } from 'typeorm';

// export enum TransactionType {
//   DEBIT = 'debit',
//   CREDIT = 'credit',
// }

// export enum TransactionStatus {
//   PENDING = 'pending',
//   COMPLETED = 'completed',
//   RECONCILED = 'reconciled',
//   CANCELLED = 'cancelled',
// }

// export enum PaymentMethod {
//   CASH = 'cash',
//   BANK_TRANSFER = 'bank_transfer',
//   CHEQUE = 'cheque',
//   MOBILE_MONEY = 'mobile_money',
//   CREDIT_CARD = 'credit_card',
//   DEBIT_CARD = 'debit_card',
//   OTHER = 'other',
// }

// @Entity('transactions')
// @Index(['company', 'date'])
// @Index(['company', 'category'])
// @Index(['company', 'transactionType'])
// @Index(['company', 'status'])
// @Index(['financialYear', 'financialPeriod'])
// export class Transaction {
//   @PrimaryGeneratedColumn()
//   id: number;

//   @Column({ type: 'date' })
//   @Index()
//   date: Date;

//   @Column({
//     type: 'enum',
//     enum: TransactionType,
//   })
//   transactionType: TransactionType;

//   // Base amount (before tax)
//   @Column({ type: 'decimal', precision: 15, scale: 2 })
//   amount: number;

//   @Column()
//   description: string;

//   @Column({ nullable: true })
//   referenceNumber: string;

//   @Column({
//     type: 'enum',
//     enum: PaymentMethod,
//     default: PaymentMethod.CASH,
//   })
//   paymentMethod: PaymentMethod;

//   @Column({
//     type: 'enum',
//     enum: TransactionStatus,
//     default: TransactionStatus.COMPLETED,
//   })
//   status: TransactionStatus;

//   // Counterparty information
//   @Column({ nullable: true })
//   counterparty: string;

//   @Column({ nullable: true })
//   invoiceNumber: string;

//   @Column({ type: 'date', nullable: true })
//   dueDate: Date;

//   // Tax information
//   @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
//   taxAmount: number;

//   @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
//   taxRate: number;

//   // Total amount (amount + taxAmount) - auto-calculated
//   @Column({ type: 'decimal', precision: 15, scale: 2 })
//   totalAmount: number;

//   // For reconciliation
//   @Column({ type: 'date', nullable: true })
//   reconciledAt: Date;

//   @ManyToOne(() => User, { nullable: true })
//   reconciledBy: User;

//   // Additional notes
//   @Column({ type: 'text', nullable: true })
//   notes: string;

//   @Column({ type: 'json', nullable: true })
//   attachments: string[];

//   // Recurring transactions
//   @Column({ default: false })
//   isRecurring: boolean;

//   @Column({ nullable: true })
//   recurringFrequency: string;

//   // Financial year/period for reporting (auto-calculated)
//   @Column({ type: 'int' })
//   financialYear: number;

//   @Column({ type: 'int' })
//   financialPeriod: number;

//   @CreateDateColumn()
//   createdAt: Date;

//   @UpdateDateColumn()
//   updatedAt: Date;

//   @DeleteDateColumn()
//   deletedAt: Date;

//   // Relationships
//   @ManyToOne(() => Company, (company) => company.transactions, {
//     nullable: false,
//     eager: true,
//   })
//   company: Company;

//   // Category must be a leaf category (sub-sub level)
//   @ManyToOne(() => Category, (category) => category.transactions, {
//     nullable: false,
//     eager: true,
//   })
//   category: Category;

//   @ManyToOne(() => User, (user) => user.transactions, {
//     nullable: false,
//   })
//   createdBy: User;

//   // Lifecycle hooks
//   @BeforeInsert()
//   @BeforeUpdate()
//   calculateTotalAmount() {
//     this.totalAmount = Number(this.amount) + Number(this.taxAmount || 0);
//   }

//   @BeforeInsert()
//   @BeforeUpdate()
//   setFinancialPeriod() {
//     const transactionDate = new Date(this.date);
//     this.financialYear = transactionDate.getFullYear();
//     this.financialPeriod = transactionDate.getMonth() + 1;
//   }
// }


import { Category } from '../../category/entities/category.entity';
import { Company } from '../../company/entities/company.entity';
import { User } from '../../users/entities/user.entity';

import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';

export enum TransactionType {
  DEBIT = 'debit',
  CREDIT = 'credit',
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  RECONCILED = 'reconciled',
  CANCELLED = 'cancelled',
}

export enum PaymentMethod {
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  CHEQUE = 'cheque',
  MOBILE_MONEY = 'mobile_money',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  OTHER = 'other',
}

// NEW: Recurring frequency enum
export enum RecurringFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

@Entity('transactions')
@Index(['company', 'date'])
@Index(['company', 'category'])
@Index(['company', 'transactionType'])
@Index(['company', 'status'])
@Index(['financialYear', 'financialPeriod'])
@Index(['isRecurring', 'nextExecutionDate']) // NEW: Index for recurring transactions
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  @Index()
  date: Date;

  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  transactionType: TransactionType;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column()
  description: string;

  @Column({ nullable: true })
  referenceNumber: string;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    default: PaymentMethod.CASH,
  })
  paymentMethod: PaymentMethod;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.COMPLETED,
  })
  status: TransactionStatus;

  @Column({ nullable: true })
  counterparty: string;

  @Column({ nullable: true })
  invoiceNumber: string;

  @Column({ type: 'date', nullable: true })
  dueDate: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  taxRate: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  totalAmount: number;

  @Column({ type: 'date', nullable: true })
  reconciledAt: Date;

  @ManyToOne(() => User, { nullable: true })
  reconciledBy: User;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'json', nullable: true })
  attachments: string[];

  // Recurring transactions fields
  @Column({ default: false })
  isRecurring: boolean;

  @Column({
    type: 'enum',
    enum: RecurringFrequency,
    nullable: true,
  })
  recurringFrequency: RecurringFrequency;

  // NEW: Next execution date for recurring transactions
  @Column({ type: 'date', nullable: true })
  @Index()
  nextExecutionDate: Date;

  // NEW: Last execution date
  @Column({ type: 'date', nullable: true })
  lastExecutionDate: Date;

  // NEW: End date for recurring transactions (optional)
  @Column({ type: 'date', nullable: true })
  recurringEndDate: Date;

  // NEW: Number of times to execute (optional, alternative to end date)
  @Column({ type: 'int', nullable: true })
  recurringExecutionCount: number;

  // NEW: Number of times already executed
  @Column({ type: 'int', default: 0 })
  executionCount: number;

  // NEW: Is recurring active
  @Column({ default: true })
  isRecurringActive: boolean;

  @Column({ type: 'int' })
  financialYear: number;

  @Column({ type: 'int' })
  financialPeriod: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  // Relationships
  @ManyToOne(() => Company, (company) => company.transactions, {
    nullable: false,
    eager: true,
  })
  company: Company;

  @ManyToOne(() => Category, (category) => category.transactions, {
    nullable: false,
    eager: true,
  })
  category: Category;

  @ManyToOne(() => User, (user) => user.transactions, {
    nullable: false,
  })
  createdBy: User;

  // Lifecycle hooks
  @BeforeInsert()
  @BeforeUpdate()
  calculateTotalAmount() {
    this.totalAmount = Number(this.amount) + Number(this.taxAmount || 0);
  }

  @BeforeInsert()
  @BeforeUpdate()
  setFinancialPeriod() {
    const transactionDate = new Date(this.date);
    this.financialYear = transactionDate.getFullYear();
    this.financialPeriod = transactionDate.getMonth() + 1;
  }

  @BeforeInsert()
  setNextExecutionDate() {
    if (this.isRecurring && this.recurringFrequency && !this.nextExecutionDate) {
      this.nextExecutionDate = this.calculateNextExecutionDate(new Date(this.date));
    }
  }

  // Helper method to calculate next execution date
  calculateNextExecutionDate(fromDate: Date): Date {
    const nextDate = new Date(fromDate);

    switch (this.recurringFrequency) {
      case RecurringFrequency.DAILY:
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case RecurringFrequency.WEEKLY:
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case RecurringFrequency.BIWEEKLY:
        nextDate.setDate(nextDate.getDate() + 14);
        break;
      case RecurringFrequency.MONTHLY:
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case RecurringFrequency.QUARTERLY:
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case RecurringFrequency.YEARLY:
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
    }

    return nextDate;
  }
}