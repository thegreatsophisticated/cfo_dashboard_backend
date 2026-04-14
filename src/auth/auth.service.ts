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

    const user = result.user;

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

    const { password, ...userWithoutPassword } = user;

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
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.authConfiguration.jwt.secret,
        expiresIn: this.authConfiguration.jwt.accessTokenExpiresIn,
        // Removed audience and issuer from signing as well —
        // if not validated in the strategy, no need to embed them
      } as any),
      this.jwtService.signAsync(payload, {
        secret: this.authConfiguration.jwt.secret,
        expiresIn: this.authConfiguration.jwt.refreshTokenExpiresIn,
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
        // Removed audience and issuer here too — must match what was signed
      });

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
