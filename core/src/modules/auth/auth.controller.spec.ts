import { Test, TestingModule } from '@nestjs/testing';
import { FastifyReply, FastifyRequest } from 'fastify';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmployeeRole } from '@/common/constants';
import { AuthenticatedUser } from '@/common/decorators/current-user.decorator';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    login: jest.Mock;
    refreshTokens: jest.Mock;
    logout: jest.Mock;
    getProfile: jest.Mock;
    updateProfile: jest.Mock;
  };
  let replyMock: Partial<FastifyReply>;

  beforeEach(async () => {
    authService = {
      login: jest.fn(),
      refreshTokens: jest.fn(),
      logout: jest.fn(),
      getProfile: jest.fn(),
      updateProfile: jest.fn(),
    };

    replyMock = {
      setCookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should authenticate user and set HttpOnly refresh token cookie', async () => {
      const mockResult = {
        accessToken: 'access_token_123',
        refreshToken: 'refresh_token_456',
        user: {
          id: 1,
          username: 'manager_admin',
          fullName: 'Manager Admin',
          role: EmployeeRole.MANAGER,
        },
      };

      authService.login.mockResolvedValue(mockResult);

      const res = await controller.login(
        { username: 'manager_admin', password: 'password123' },
        replyMock as FastifyReply,
      );

      expect(authService.login).toHaveBeenCalledWith({
        username: 'manager_admin',
        password: 'password123',
      });
      expect(replyMock.setCookie).toHaveBeenCalledWith(
        'refreshToken',
        'refresh_token_456',
        expect.objectContaining({
          httpOnly: true,
          path: '/api/auth',
        }),
      );
      expect(res).toEqual({
        accessToken: 'access_token_123',
        user: mockResult.user,
      });
    });
  });

  describe('refresh', () => {
    it('should rotate tokens and update HttpOnly cookie', async () => {
      const mockRequest = {
        cookies: {
          refreshToken: 'existing_refresh_token',
        },
      } as unknown as FastifyRequest;

      const mockResult = {
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
        user: {
          id: 1,
          username: 'manager_admin',
          fullName: 'Manager Admin',
          role: EmployeeRole.MANAGER,
        },
      };

      authService.refreshTokens.mockResolvedValue(mockResult);

      const res = await controller.refresh(mockRequest, replyMock as FastifyReply);

      expect(authService.refreshTokens).toHaveBeenCalledWith('existing_refresh_token');
      expect(replyMock.setCookie).toHaveBeenCalledWith(
        'refreshToken',
        'new_refresh_token',
        expect.objectContaining({
          httpOnly: true,
          path: '/api/auth',
        }),
      );
      expect(res).toEqual({
        accessToken: 'new_access_token',
        user: mockResult.user,
      });
    });
  });

  describe('logout', () => {
    it('should revoke refresh token in database and clear cookie', async () => {
      authService.logout.mockResolvedValue(undefined);

      const res = await controller.logout(1, replyMock as FastifyReply);

      expect(authService.logout).toHaveBeenCalledWith(1);
      expect(replyMock.clearCookie).toHaveBeenCalledWith('refreshToken', { path: '/api/auth' });
      expect(res).toEqual({ message: 'Logged out successfully' });
    });
  });

  describe('getMe', () => {
    it('should return employee profile of authenticated user', async () => {
      const mockUser: AuthenticatedUser = {
        id: 1,
        username: 'manager_admin',
        role: EmployeeRole.MANAGER,
        full_name: 'Manager Admin',
      };

      const mockProfile = {
        id: 1,
        username: 'manager_admin',
        fullName: 'Manager Admin',
        role: EmployeeRole.MANAGER,
        phoneNumber: '0901234567',
        email: 'manager@warranty.vn',
        isActive: true,
      };

      authService.getProfile.mockResolvedValue(mockProfile);

      const res = await controller.getMe(mockUser);

      expect(authService.getProfile).toHaveBeenCalledWith(1);
      expect(res).toEqual(mockProfile);
    });
  });

  describe('updateProfile', () => {
    it('should update authenticated employee profile', async () => {
      const updateDto = {
        fullName: 'Updated Name',
        phoneNumber: '0909999999',
        email: 'updated@warranty.vn',
      };

      const updatedProfile = {
        id: 1,
        username: 'manager_admin',
        ...updateDto,
        role: EmployeeRole.MANAGER,
        isActive: true,
      };

      authService.updateProfile.mockResolvedValue(updatedProfile);

      const res = await controller.updateProfile(1, updateDto);

      expect(authService.updateProfile).toHaveBeenCalledWith(1, updateDto);
      expect(res).toEqual(updatedProfile);
    });
  });
});
