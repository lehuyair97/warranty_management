import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { EmployeeEntity } from '@/database/entities/employee.entity';
import { EmployeeRole } from '@/common/constants';
import * as cryptoUtil from '@/common/utils/crypto.util';

describe('AuthService', () => {
  let service: AuthService;
  let employeeRepo: { findOne: jest.Mock; update: jest.Mock };
  let jwtService: { signAsync: jest.Mock; verifyAsync: jest.Mock };
  let configService: { get: jest.Mock };

  beforeEach(async () => {
    employeeRepo = {
      findOne: jest.fn(),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    jwtService = {
      signAsync: jest.fn().mockImplementation((payload) => Promise.resolve(`signed_token_${payload.sub}`)),
      verifyAsync: jest.fn(),
    };

    configService = {
      get: jest.fn().mockImplementation((key: string, defaultVal: string) => defaultVal || 'mock_secret'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(EmployeeEntity), useValue: employeeRepo },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should throw UnauthorizedException if employee not found', async () => {
      employeeRepo.findOne.mockResolvedValue(null);

      await expect(
        service.login({ username: 'nonexistent', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      employeeRepo.findOne.mockResolvedValue({
        id: 1,
        username: 'admin',
        passwordHash: 'hashed_password',
        isActive: true,
      });

      jest.spyOn(cryptoUtil, 'comparePassword').mockResolvedValue(false);

      await expect(
        service.login({ username: 'admin', password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return accessToken, refreshToken, and user info on valid credentials', async () => {
      employeeRepo.findOne.mockResolvedValue({
        id: 1,
        username: 'admin',
        passwordHash: 'hashed_password',
        fullName: 'Admin User',
        role: EmployeeRole.MANAGER,
        isActive: true,
      });

      jest.spyOn(cryptoUtil, 'comparePassword').mockResolvedValue(true);
      jest.spyOn(cryptoUtil, 'hashPassword').mockResolvedValue('hashed_refresh_token');

      const result = await service.login({ username: 'admin', password: 'correctpassword' });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.username).toBe('admin');
      expect(employeeRepo.update).toHaveBeenCalledWith(1, { refreshTokenHash: 'hashed_refresh_token' });
    });
  });

  describe('logout', () => {
    it('should nullify the refresh token hash', async () => {
      const result = await service.logout(1);
      expect(employeeRepo.update).toHaveBeenCalledWith(1, { refreshTokenHash: null });
      expect(result.success).toBe(true);
    });
  });
});
