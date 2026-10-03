import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeeEntity } from '@/database/entities/employee.entity';
import { AuthenticatedUser } from '@/common/decorators/current-user.decorator';
import { EmployeeRole } from '@/common/constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepo: Repository<EmployeeEntity>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('auth.jwtSecret'),
    });
  }

  async validate(payload: { sub: number; username: string; role: EmployeeRole }): Promise<AuthenticatedUser> {
    const employee = await this.employeeRepo.findOne({
      where: { id: payload.sub, isActive: true },
    });

    if (!employee) {
      throw new UnauthorizedException('User account not found or deactivated');
    }

    return {
      id: employee.id,
      username: employee.username,
      role: employee.role,
      full_name: employee.fullName,
    };
  }
}
