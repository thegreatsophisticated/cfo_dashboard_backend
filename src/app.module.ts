import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './users/entities/user.entity';
import { UsersModule } from './users/users.module';
import { ProfilesModule } from './profiles/profiles.module';
import { TweetModule } from './tweet/tweet.module';
import { CompanyModule } from './company/company.module';
import { TransactionModule } from './transaction/transaction.module';
import { AuthModule } from './auth/auth.module';
import { Profile } from './profiles/entities/profile.entity';
import { CategoryModule } from './category/category.module';
import authConfig from './auth/config/auth.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'production'
          ? '.env.production'
          : ['.env.development', '.env'],
      load: [authConfig],
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: +configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        autoLoadEntities: true,

        // ⚠️ CRITICAL: Set synchronize based on environment
        synchronize: process.env.NODE_ENV !== 'production', // false in production

        // 🔧 For production, use migrations
        migrations:
          process.env.NODE_ENV === 'production'
            ? ['dist/migrations/**/*.js']
            : [],
        migrationsRun: process.env.NODE_ENV === 'production',

        // Logging
        logging: process.env.NODE_ENV === 'development',

        // 🔒 Production-specific settings
        ssl:
          process.env.NODE_ENV === 'production'
            ? { rejectUnauthorized: false } // Enable SSL for production DB
            : false,

        // Connection pool settings for production
        extra: {
          max: 10, // Maximum connections in pool
          connectionTimeoutMillis: 10000,
        },
      }),
      inject: [ConfigService],
    }),

    // All modules
    UsersModule,
    ProfilesModule,
    TweetModule,
    CompanyModule,
    TransactionModule,
    AuthModule,
    CategoryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
