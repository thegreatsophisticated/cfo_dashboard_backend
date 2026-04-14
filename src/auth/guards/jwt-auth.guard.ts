import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // ← Temporary: log the Authorization header
    const request = context.switchToHttp().getRequest();
    console.log('AUTH HEADER:', request.headers['authorization']);

    return super.canActivate(context);
  }

  // ← Add this to catch the exact passport failure reason
  handleRequest(err, user, info) {
    console.log('JWT Guard - err:', err);
    console.log('JWT Guard - user:', user);
    console.log('JWT Guard - info:', info?.message || info);

    if (err || !user) {
      throw err || new UnauthorizedException(info?.message || 'Unauthorized');
    }
    return user;
  }
}
