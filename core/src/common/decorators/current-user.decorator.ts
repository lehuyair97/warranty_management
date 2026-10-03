import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { EmployeeRole } from '../constants';

/**
 * Interface representing authenticated employee payload from JWT.
 */
export interface AuthenticatedUser {
  id: number;
  username: string;
  role: EmployeeRole;
  full_name: string;
}

/**
 * Decorator to extract the authenticated user from request object.
 */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser;

    return data ? user?.[data] : user;
  },
);
