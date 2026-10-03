import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeeEntity } from '@/database/entities/employee.entity';
import { comparePassword, hashPassword } from '@/common/utils/crypto.util';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepo: Repository<EmployeeEntity>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Authenticates an employee and issues access token + refresh token.
   */
  async login(loginDto: LoginDto) {
    const { username, password } = loginDto;

    const employee = await this.employeeRepo.findOne({
      where: { username },
      select: ['id', 'username', 'passwordHash', 'fullName', 'role', 'isActive'],
    });

    if (!employee || !employee.isActive) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const isPasswordValid = await comparePassword(password, employee.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const tokens = await this.generateTokens(employee.id, employee.username, employee.role);
    await this.updateRefreshTokenHash(employee.id, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: employee.id,
        username: employee.username,
        fullName: employee.fullName,
        role: employee.role,
      },
    };
  }

  /**
   * Refreshes access token and rotates refresh token using stored hash.
   */
  async refreshTokens(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    let payload: { sub: number; username: string; role: string };
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('auth.refreshSecret'),
      });
    } catch {
      throw new ForbiddenException('Invalid or expired refresh token');
    }

    const employee = await this.employeeRepo.findOne({
      where: { id: payload.sub, isActive: true },
      select: ['id', 'username', 'role', 'fullName', 'refreshTokenHash', 'isActive'],
    });

    if (!employee || !employee.refreshTokenHash) {
      throw new ForbiddenException('Access denied. Token revoked or user inactive');
    }

    const isTokenMatch = await comparePassword(refreshToken, employee.refreshTokenHash);
    if (!isTokenMatch) {
      // Possible token reuse detected -> invalidate token immediately
      await this.employeeRepo.update(employee.id, { refreshTokenHash: null });
      throw new ForbiddenException('Access denied. Token reuse detected');
    }

    const tokens = await this.generateTokens(employee.id, employee.username, employee.role);
    await this.updateRefreshTokenHash(employee.id, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: employee.id,
        username: employee.username,
        fullName: employee.fullName,
        role: employee.role,
      },
    };
  }

  /**
   * Logs out employee by nullifying the stored refresh token hash.
   */
  async logout(employeeId?: number) {
    if (employeeId) {
      await this.employeeRepo.update(employeeId, { refreshTokenHash: null });
    }
    return { success: true, message: 'Logged out successfully' };
  }

  /**
   * Invalidates refresh token in database by extracting subject from token.
   */
  async logoutByToken(refreshToken?: string) {
    if (!refreshToken) {
      return { success: true, message: 'Logged out successfully' };
    }
    try {
      const payload = await this.jwtService.verifyAsync<{ sub: number }>(refreshToken, {
        secret: this.configService.get<string>('auth.refreshSecret'),
      });
      if (payload?.sub) {
        await this.employeeRepo.update(payload.sub, { refreshTokenHash: null });
      }
    } catch {
      // Ignore token verification errors during logout
    }
    return { success: true, message: 'Logged out successfully' };
  }

  /**
   * Retrieves profile information for authenticated user.
   */
  async getProfile(employeeId: number) {
    const employee = await this.employeeRepo.findOne({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new UnauthorizedException('Employee profile not found');
    }

    return employee;
  }

  /**
   * Updates profile information for the authenticated user.
   */
  async updateProfile(employeeId: number, dto: UpdateProfileDto) {
    const employee = await this.employeeRepo.findOne({
      where: { id: employeeId },
      select: [
        'id',
        'username',
        'passwordHash',
        'fullName',
        'role',
        'phoneNumber',
        'email',
        'isActive',
      ],
    });

    if (!employee) {
      throw new UnauthorizedException('Employee profile not found');
    }

    if (dto.password) {
      if (!dto.currentPassword) {
        throw new BadRequestException('Mật khẩu hiện tại là bắt buộc khi đổi mật khẩu mới');
      }
      const isMatch = await comparePassword(dto.currentPassword, employee.passwordHash);
      if (!isMatch) {
        throw new BadRequestException('Mật khẩu hiện tại không chính xác');
      }
      employee.passwordHash = await hashPassword(dto.password);
    }

    if (dto.fullName !== undefined) {
      employee.fullName = dto.fullName.trim();
    }
    if (dto.phoneNumber !== undefined) {
      employee.phoneNumber = dto.phoneNumber?.trim() || null;
    }
    if (dto.email !== undefined) {
      employee.email = dto.email?.trim() || null;
    }

    await this.employeeRepo.save(employee);

    // Return sanitized employee object
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, refreshTokenHash, ...sanitized } = employee as EmployeeEntity & {
      passwordHash?: string;
      refreshTokenHash?: string;
    };
    return sanitized;
  }

  /**
   * Internal helper to generate dual tokens.
   */
  private async generateTokens(userId: number, username: string, role: string) {
    const payload = { sub: userId, username, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('auth.jwtSecret'),
        expiresIn: this.configService.get<string>('auth.jwtExpiresIn', '30m'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('auth.refreshSecret'),
        expiresIn: this.configService.get<string>('auth.refreshExpiresIn', '7d'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  /**
   * Stores hashed refresh token in database for rotation validation.
   */
  private async updateRefreshTokenHash(userId: number, refreshToken: string) {
    const hash = await hashPassword(refreshToken);
    await this.employeeRepo.update(userId, { refreshTokenHash: hash });
  }
}
