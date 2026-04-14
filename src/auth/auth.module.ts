// import { Module, forwardRef } from '@nestjs/common';
// import { AuthService } from './auth.service';
// import { AuthController } from './auth.controller';
// import { UsersModule } from 'src/users/users.module';
// import { HashingProvider } from './provider/hashing.provider';
// import { BcryptProvider } from './provider/bcrypt.provider';
// import { ConfigModule, ConfigService } from '@nestjs/config';
// import authConfig from './config/auth.config';
// import { JwtModule } from '@nestjs/jwt';

// @Module({
//   controllers: [AuthController],
//   providers: [AuthService, {
//     provide: HashingProvider,
//     useClass: BcryptProvider,
//   }],
//   imports: [
//     forwardRef(() => UsersModule),
// ConfigModule.forFeature(authConfig),
// // JwtModule.registerAsync(authConfig.asProvider())
//   JwtModule.registerAsync({
//       imports: [ConfigModule],
//       useFactory: (configService: ConfigService ) => ({
//         secret: configService.get('auth.jwt.secret'),
//         signOptions: {
//           expiresIn: configService.get('auth.jwt.accessTokenExpiresIn'),
//           audience: configService.get('auth.jwt.audience'),
//           issuer: configService.get('auth.jwt.issuer'),
//         },
//       }),
//       inject: [ConfigService],
//     }),

//   ],
//   exports: [AuthService, HashingProvider],
// })
// export class AuthModule {}

// src/auth/auth.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { HashingProvider } from './provider/hashing.provider';
import { BcryptProvider } from './provider/bcrypt.provider';
import { ConfigModule, ConfigService } from '@nestjs/config';
import authConfig from './config/auth.config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
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
  imports: [
    forwardRef(() => UsersModule),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ConfigModule.forFeature(authConfig),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('auth.jwt.secret'),
        signOptions: {
          expiresIn: configService.get('auth.jwt.accessTokenExpiresIn'),
          audience: configService.get('auth.jwt.audience'),
          issuer: configService.get('auth.jwt.issuer'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [AuthService, HashingProvider, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
