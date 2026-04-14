import { Module, forwardRef } from '@nestjs/common';  // ← add forwardRef
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { UsersModule } from 'src/users/users.module';
import authConfig from './config/auth.config';
import { HashingProvider } from './provider/hashing.provider';
import { BcryptProvider } from './provider/bcrypt.provider';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule.forFeature(authConfig)],
      inject: [authConfig.KEY],
      useFactory: (config: ConfigType<typeof authConfig>) => ({
        secret: config.jwt.secret,
        signOptions: {
          expiresIn: config.jwt.accessTokenExpiresIn as any,
        },
      }),
    }),
    ConfigModule.forFeature(authConfig),
    forwardRef(() => UsersModule),  // ← wrap with forwardRef
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
    {
      provide: HashingProvider,
      useClass: BcryptProvider,
    },
  ],
  exports: [
    AuthService,
    HashingProvider,
    JwtAuthGuard,
    RolesGuard,
    JwtStrategy,
    PassportModule,
    JwtModule,
  ],
})
export class AuthModule {}