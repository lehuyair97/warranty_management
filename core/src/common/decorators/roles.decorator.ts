import { SetMetadata } from '@nestjs/common';
import { EmployeeRole, ROLES_KEY } from '../constants';

/**
 * Decorator to enforce employee role authorization on routes.
 * @param roles Allowed EmployeeRole list
 */
export const Roles = (...roles: EmployeeRole[]) => SetMetadata(ROLES_KEY, roles);
