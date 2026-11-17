import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { Category } from './entities/category.entity';
import { Transaction } from 'src/transaction/entities/transaction.entity';
import { UsersModule } from 'src/users/users.module';

@Module({
  controllers: [CategoryController],
  providers: [CategoryService],
  exports: [CategoryService],
  imports: [TypeOrmModule.forFeature([Category, Transaction]), UsersModule],
})
export class CategoryModule {}
