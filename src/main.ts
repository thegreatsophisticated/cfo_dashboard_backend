import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger:
      process.env.NODE_ENV === 'production'
        ? ['error', 'warn', 'log']
        : ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  // Enable CORS - Allow your production frontend
  app.enableCors({
    origin:
      process.env.NODE_ENV === 'production'
        ? [
            'http://cfo.irebegrp.com',
            'https://cfo.irebegrp.com',
            'http://yourdomain.com',
            'https://yourdomain.com',
          ]
        : true, // allow all origins in development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // IMPORTANT: Use environment PORT for cPanel
  // const port = process.env.PORT || 4000;
  const port = 4000;
  const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

  await app.listen(port, host);
  console.log(`Application is running on: ${host}:${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}
bootstrap();
