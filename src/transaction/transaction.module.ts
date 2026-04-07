// import { Module } from '@nestjs/common';
// import { TransactionService } from './transaction.service';
// import { TransactionController } from './transaction.controller';
// import { UsersModule } from 'src/users/users.module';
// import { CompanyModule } from 'src/company/company.module';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { Transaction } from './entities/transaction.entity';
// import { CategoryModule } from 'src/category/category.module';

// @Module({
//   controllers: [TransactionController],
//   providers: [TransactionService],
//   exports: [TransactionService],
//   // import service
//   imports: [UsersModule , CompanyModule, CategoryModule,
//     TypeOrmModule.forFeature([Transaction])
//   ],
// })
// export class TransactionModule {}


// import { Module } from '@nestjs/common';
// import { TransactionService } from './transaction.service';
// import { TransactionController } from './transaction.controller';
// import { UsersModule } from 'src/users/users.module';
// import { CompanyModule } from 'src/company/company.module';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { Transaction } from './entities/transaction.entity';
// import { CategoryModule } from 'src/category/category.module';
// import { User } from 'src/users/entities/user.entity';
// import { AuthModule } from 'src/auth/auth.module';

// @Module({
//   controllers: [TransactionController],
//   providers: [TransactionService],
//   exports: [TransactionService],
//   imports: [
//     UsersModule,
//     CompanyModule,
//     CategoryModule,
//     AuthModule,
//     TypeOrmModule.forFeature([Transaction, User])
//   ],
// })
// export class TransactionModule {}


import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { UsersModule } from 'src/users/users.module';
import { CompanyModule } from 'src/company/company.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity';
import { CategoryModule } from 'src/category/category.module';
import { User } from 'src/users/entities/user.entity';
import { AuthModule } from 'src/auth/auth.module';
import { RecurringTransactionService } from './services/recurring-transaction.service';

@Module({
  controllers: [TransactionController],
  providers: [TransactionService, RecurringTransactionService ],
  exports: [TransactionService, RecurringTransactionService],
  imports: [
    ScheduleModule.forRoot(), // Enable scheduling
    UsersModule,
    CompanyModule,
    CategoryModule,
    AuthModule,
    TypeOrmModule.forFeature([Transaction, User])
  ],
})
export class TransactionModule {}