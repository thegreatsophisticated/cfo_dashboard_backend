// src/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('auth.jwt.secret'),
      audience: configService.get<string>('auth.jwt.audience'),
      issuer: configService.get<string>('auth.jwt.issuer'),
    });
  }

  async validate(payload: any) {
    // Payload contains { sub: userId, email: userEmail }
    const user = await this.usersService.findByEmailOrPhone(payload.email);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Remove password before returning
    const { password, ...userWithoutPassword } = user;

    // This will be attached to request.user
    return userWithoutPassword;
  }
}
