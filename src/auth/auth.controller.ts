import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Login endpoint - Public access
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.userLogin(createAuthDto);
  }

  /**
   * Signup endpoint - Public access
   */
  @Public()
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() createUserDto: CreateUserDto) {
    return await this.authService.signup(createUserDto);
  }

  /**
   * Refresh token endpoint - Public access
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body('refreshToken') refreshToken: string) {
    return await this.authService.refreshTokens(refreshToken);
  }
}
