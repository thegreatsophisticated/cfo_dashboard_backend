// import { Injectable, Inject, forwardRef, UnauthorizedException } from '@nestjs/common';
// import { JwtService } from '@nestjs/jwt';
// import { ConfigType } from '@nestjs/config';
// import { UsersService } from 'src/users/users.service';
// import { LoginDto } from './dto/login.dto';
// import { CreateUserDto } from 'src/users/dto/create-user.dto';
// import { HashingProvider } from './provider/hashing.provider';
// import authConfig from './config/auth.config';

// @Injectable()
// export class AuthService {
//   constructor(
//     @Inject(forwardRef(() => UsersService))
//     private readonly usersService: UsersService,

//     @Inject(authConfig.KEY)
//     private readonly authConfiguration: ConfigType<typeof authConfig>,

//     private readonly hashingProvider: HashingProvider,

//     private readonly jwtService: JwtService,
//   ) {}

//   public async signup(createUserDto: CreateUserDto) {
//     const result = await this.usersService.createUser(createUserDto);

//     // Extract the actual user from the response
//     const user = result.user;

//     // Generate tokens for the new user
//     const tokens = await this.generateTokens(user);

//     return {
//       user,
//       ...tokens,
//     };
//   }

//   public async userLogin(loginDto: LoginDto) {
//     const emailOrPhone = loginDto.email || loginDto.phone;

//     if (!emailOrPhone) {
//       throw new UnauthorizedException('Email or phone is required');
//     }

//     const user = await this.usersService.findByEmailOrPhone(emailOrPhone);

//     if (!user) {
//       throw new UnauthorizedException('Invalid credentials');
//     }

//     const isValid = await this.hashingProvider.comparePassword(
//       loginDto.password,
//       user.password,
//     );

//     if (!isValid) {
//       throw new UnauthorizedException('Invalid credentials');
//     }

//     // Generate tokens
//     const tokens = await this.generateTokens(user);

//     return {
//       user,
//       ...tokens,
//     };
//   }

//   private async generateTokens(user: any) {
//     const payload = {
//       sub: user.id,
//       email: user.email,
//     };

//     const [accessToken, refreshToken] = await Promise.all([
//       // Access Token
//       this.jwtService.signAsync(payload, {
//         secret: this.authConfiguration.jwt.secret,
//         expiresIn: this.authConfiguration.jwt.accessTokenExpiresIn,
//         audience: this.authConfiguration.jwt.audience,
//         issuer: this.authConfiguration.jwt.issuer,
//       } as any),
//       // Refresh Token
//       this.jwtService.signAsync(payload, {
//         secret: this.authConfiguration.jwt.secret,
//         expiresIn: this.authConfiguration.jwt.refreshTokenExpiresIn,
//         audience: this.authConfiguration.jwt.audience,
//         issuer: this.authConfiguration.jwt.issuer,
//       } as any),
//     ]);

//     return {
//       accessToken,
//       refreshToken,
//     };
//   }

//   public async refreshTokens(refreshToken: string) {
//     try {
//       const payload = await this.jwtService.verifyAsync(refreshToken, {
//         secret: this.authConfiguration.jwt.secret,
//         audience: this.authConfiguration.jwt.audience,
//         issuer: this.authConfiguration.jwt.issuer,
//       });

//       // Use findByEmailOrPhone or another existing method
//       const user = await this.usersService.findByEmailOrPhone(payload.email);

//       if (!user) {
//         throw new UnauthorizedException('User not found');
//       }

//       return await this.generateTokens(user);
//     } catch (error) {
//       throw new UnauthorizedException('Invalid refresh token');
//     }
//   }

// }

// src/auth/auth.service.ts
import {
  Injectable,
  Inject,
  forwardRef,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigType } from '@nestjs/config';
import { UsersService } from 'src/users/users.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { HashingProvider } from './provider/hashing.provider';
import authConfig from './config/auth.config';

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,

    @Inject(authConfig.KEY)
    private readonly authConfiguration: ConfigType<typeof authConfig>,

    private readonly hashingProvider: HashingProvider,

    private readonly jwtService: JwtService,
  ) {}

  public async signup(createUserDto: CreateUserDto) {
    const result = await this.usersService.createUser(createUserDto);

    // Extract the actual user from the response
    const user = result.user;

    // Generate tokens for the new user
    const tokens = await this.generateTokens(user);

    return {
      user,
      ...tokens,
    };
  }

  public async userLogin(loginDto: LoginDto) {
    const emailOrPhone = loginDto.email || loginDto.phone;

    if (!emailOrPhone) {
      throw new UnauthorizedException('Email or phone is required');
    }

    const user = await this.usersService.findByEmailOrPhone(emailOrPhone);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await this.hashingProvider.comparePassword(
      loginDto.password,
      user.password,
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Remove password from user object
    const { password, ...userWithoutPassword } = user;

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      user: userWithoutPassword,
      ...tokens,
    };
  }

  private async generateTokens(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role, // Include role in JWT payload
    };

    const [accessToken, refreshToken] = await Promise.all([
      // Access Token
      this.jwtService.signAsync(payload, {
        secret: this.authConfiguration.jwt.secret,
        expiresIn: this.authConfiguration.jwt.accessTokenExpiresIn,
        audience: this.authConfiguration.jwt.audience,
        issuer: this.authConfiguration.jwt.issuer,
      } as any),
      // Refresh Token
      this.jwtService.signAsync(payload, {
        secret: this.authConfiguration.jwt.secret,
        expiresIn: this.authConfiguration.jwt.refreshTokenExpiresIn,
        audience: this.authConfiguration.jwt.audience,
        issuer: this.authConfiguration.jwt.issuer,
      } as any),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  public async refreshTokens(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.authConfiguration.jwt.secret,
        audience: this.authConfiguration.jwt.audience,
        issuer: this.authConfiguration.jwt.issuer,
      });

      // Use findByEmailOrPhone or another existing method
      const user = await this.usersService.findByEmailOrPhone(payload.email);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const { password, ...userWithoutPassword } = user;

      const tokens = await this.generateTokens(user);

      return {
        user: userWithoutPassword,
        ...tokens,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
