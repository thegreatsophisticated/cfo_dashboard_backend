import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      message: 'CFO API is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
    };
  }

  @Get('api')
  getApiInfo() {
    return {
      name: 'CFO API',
      version: '1.0.0',
      endpoints: {
        health: '/health',
        users: '/users',
        tweets: '/tweets',
        companies: '/companies',
        transactions: '/transactions',
        profiles: '/profiles',
        categories: '/categories',
        auth: '/auth',
      },
    };
  }
}
