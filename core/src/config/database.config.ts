import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig = registerAs('database', (): TypeOrmModuleOptions => ({
  type: 'mssql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '1433', 10),
  username: process.env.DB_USERNAME || 'sa',
  password: process.env.DB_PASSWORD || 'Warranty@Pass123',
  database: process.env.DB_DATABASE || 'warranty_management',
  entities: [__dirname + '/../database/entities/*.entity{.ts,.js}'],
  synchronize: false, // Database schema managed by SQL migrations
  logging: process.env.NODE_ENV === 'development',
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
  extra: {
    connectionTimeout: 30000,
    requestTimeout: 30000,
  },
}));
