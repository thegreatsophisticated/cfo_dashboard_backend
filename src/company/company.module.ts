// import { Module } from '@nestjs/common';
// import { CompanyService } from './company.service';
// import { CompanyController } from './company.controller';
// import { Company } from './entities/company.entity';
// import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
// import { UsersModule } from 'src/users/users.module';
// import { User } from 'src/users/entities/user.entity';

// @Module({
//   controllers: [CompanyController],
//   providers: [CompanyService],
//   exports: [CompanyService],
//   imports: [
//     TypeOrmModule.forFeature([Company,User]),
//     UsersModule
//   ],
// })
// export class CompanyModule {}

// src/company/company.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyService } from './company.service';
import { CompanyController } from './company.controller';
import { Company } from './entities/company.entity';
import { User } from 'src/users/entities/user.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Company, User]),
    AuthModule, // Import AuthModule for guards
  ],
  controllers: [CompanyController],
  providers: [CompanyService],
  exports: [CompanyService],
})
export class CompanyModule {}
