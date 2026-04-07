// import {
//   IsNotEmpty,
//   IsEnum,
//   IsNumber,
//   Min,
//   IsString,
//   IsOptional,
//   IsDateString,
//   MaxLength,
//   IsInt,
//   IsBoolean,
//   IsArray
// } from 'class-validator';
// import { TransactionType, TransactionStatus, PaymentMethod } from '../entities/transaction.entity';

// export class CreateTransactionDto {
//   @IsNotEmpty()
//   @IsInt()
//   companyId: number;

//   @IsNotEmpty()
//   @IsDateString()
//   date: string;

//   @IsNotEmpty()
//   @IsEnum(TransactionType)
//   transactionType: TransactionType;

//   @IsNotEmpty()
//   @IsNumber({ maxDecimalPlaces: 2 })
//   @Min(0.01)
//   amount: number;

//   @IsNotEmpty()
//   @IsString()
//   @MaxLength(500)
//   description: string;

//   // Category must be a leaf category (sub-sub level)
//   @IsNotEmpty()
//   @IsInt()
//   categoryId: number;

//   @IsOptional()
//   @IsString()
//   @MaxLength(100)
//   referenceNumber?: string;

//   @IsOptional()
//   @IsEnum(PaymentMethod)
//   paymentMethod?: PaymentMethod;

//   @IsOptional()
//   @IsEnum(TransactionStatus)
//   status?: TransactionStatus;

//   // Counterparty info
//   @IsOptional()
//   @IsString()
//   @MaxLength(200)
//   counterparty?: string;

//   @IsOptional()
//   @IsString()
//   @MaxLength(100)
//   invoiceNumber?: string;

//   @IsOptional()
//   @IsDateString()
//   dueDate?: string;

//   // Tax information
//   @IsOptional()
//   @IsNumber({ maxDecimalPlaces: 2 })
//   @Min(0)
//   taxRate?: number;

//   @IsOptional()
//   @IsNumber({ maxDecimalPlaces: 2 })
//   @Min(0)
//   taxAmount?: number;

//   @IsOptional()
//   @IsString()
//   @MaxLength(1000)
//   notes?: string;

//   @IsOptional()
//   @IsArray()
//   @IsString({ each: true })
//   attachments?: string[];

//   // Recurring transaction info
//   @IsOptional()
//   @IsBoolean()
//   isRecurring?: boolean;

//   @IsOptional()
//   @IsString()
//   recurringFrequency?: string;

//   @IsNotEmpty()
//   @IsInt()
//   createdBy: number;
// }

import {
  IsNotEmpty,
  IsEnum,
  IsNumber,
  Min,
  IsString,
  IsOptional,
  IsDateString,
  MaxLength,
  IsInt,
  IsBoolean,
  IsArray,
} from 'class-validator';
import {
  TransactionType,
  TransactionStatus,
  PaymentMethod,
  RecurringFrequency,
} from '../entities/transaction.entity';

export class CreateTransactionDto {
  @IsNotEmpty()
  @IsInt()
  companyId: number;

  @IsNotEmpty()
  @IsDateString()
  date: string;

  @IsNotEmpty()
  @IsEnum(TransactionType)
  transactionType: TransactionType;

  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  description: string;

  @IsNotEmpty()
  @IsInt()
  categoryId: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  referenceNumber?: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  counterparty?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  invoiceNumber?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  taxRate?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  taxAmount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];

  // Recurring transaction info - UPDATED
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @IsOptional()
  @IsEnum(RecurringFrequency) // Change from IsString to IsEnum
  recurringFrequency?: RecurringFrequency; // Change type from string to RecurringFrequency

  @IsOptional()
  @IsDateString()
  recurringEndDate?: string; // Add this

  @IsOptional()
  @IsInt()
  @Min(1)
  recurringExecutionCount?: number; // Add this

  @IsNotEmpty()
  @IsInt()
  createdBy: number;
}
