import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import fastifyCookie from '@fastify/cookie';
import fastifyHelmet from '@fastify/helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Create Fastify-powered NestJS Application
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: false,
    }),
  );

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port', 5001);
  const apiPrefix = configService.get<string>('app.apiPrefix', 'api');
  const cookieSecret = configService.get<string>('auth.cookieSecret', 'cookie_signing_secret_key_2026');
  const corsOrigin = configService.get<string[]>('cors.origin', ['http://localhost:3000']);

  // Set global API routing prefix
  app.setGlobalPrefix(apiPrefix);

  // Register Fastify Cookie plugin
  await app.register(fastifyCookie, {
    secret: cookieSecret,
  });

  // Register Fastify Helmet for HTTP security headers
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: false, // Disabled for local Swagger UI rendering
  });

  // Enable CORS with credentials for HttpOnly cookie transfer
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'Cookie'],
  });

  // Global Validation Pipe with strict class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Setup Swagger API Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('UIT CARE - Warranty & Repair Management API')
    .setDescription('Enterprise Fastify REST API for equipment warranty, repair ticketing, and inventory control')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT Access Token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addCookieAuth('refreshToken', {
      type: 'apiKey',
      in: 'cookie',
      name: 'refreshToken',
      description: 'HttpOnly Refresh Token cookie',
    })
    .addTag('Auth', 'Authentication and token lifecycle endpoints')
    .addTag('Employees', 'Staff members and role-based access management')
    .addTag('Customers', 'Client profiles and contact directory')
    .addTag('Devices', 'Registered devices and warranty checks')
    .addTag('Tickets', 'Repair tickets workflow and assignment')
    .addTag('Parts', 'Spare parts catalog and inventory control')
    .addTag('Invoices', 'Billing, spare part charges, and payments')
    .addTag('Reports', 'Analytical dashboards and overdue alerts')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(port, '0.0.0.0');
  logger.log(`Server running in ${configService.get('app.nodeEnv')} mode at http://localhost:${port}/${apiPrefix}`);
  logger.log(`Swagger documentation available at http://localhost:${port}/${apiPrefix}/docs`);
}

bootstrap();
