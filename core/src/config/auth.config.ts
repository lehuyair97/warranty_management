import { registerAs } from '@nestjs/config';

export const authConfig = registerAs('auth', () => ({
  jwtSecret: process.env.JWT_SECRET || 'super_secret_jwt_key_for_warranty_mgmt_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '30m',
  refreshSecret: process.env.REFRESH_TOKEN_SECRET || 'super_secret_refresh_key_for_warranty_mgmt_2026',
  refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  cookieSecret: process.env.COOKIE_SECRET || 'cookie_signing_secret_key_2026',
}));
