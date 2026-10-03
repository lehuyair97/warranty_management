import { registerAs } from '@nestjs/config';

export const corsConfig = registerAs('cors', () => ({
  origin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'https://uit.warranty.com',
        'http://uit.warranty.com',
        'https://api.warranty.com',
        'http://api.warranty.com',
      ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cookie',
  ],
}));
