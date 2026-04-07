import { Module, forwardRef } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AuthModule } from 'src/auth/auth.module';
import { User } from './entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Profile } from 'src/profiles/entities/profile.entity';
import { Company } from 'src/company/entities/company.entity';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
  imports: [
    TypeOrmModule.forFeature([User, Profile,Company ]),
    forwardRef(() => AuthModule), // <-- add this
  ],
})
export class UsersModule {}