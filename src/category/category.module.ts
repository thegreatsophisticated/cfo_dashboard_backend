import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { Category } from './entities/category.entity';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  controllers: [CategoryController],
  providers: [CategoryService],
  exports: [CategoryService],
  imports: [TypeOrmModule.forFeature([Category]), UsersModule],
})
export class CategoryModule {}
