import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Welcome to CFO API - NestJS Backend is running successfully!';
  }
}