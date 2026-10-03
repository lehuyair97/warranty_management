'use client';

import { EmployeeRole } from '@/types';
import { TableActionItem } from '../types';

/**
 * Creates a standardized Manager Edit action item.
 */
export function createManagerEditAction(
  onClick: () => void,
  isManager = true,
  options?: Partial<TableActionItem>,
): TableActionItem {
  return {
    type: 'edit',
    onClick,
    disabled: !isManager,
    requiredRoles: [EmployeeRole.MANAGER],
    tooltip: options?.tooltip || 'Chỉnh sửa thông tin',
    ...options,
  };
}

/**
 * Creates a standardized Manager Delete action item.
 */
export function createManagerDeleteAction(
  onClick: () => void,
  isManager = true,
  options?: Partial<TableActionItem>,
): TableActionItem {
  return {
    type: 'delete',
    onClick,
    disabled: !isManager,
    requiredRoles: [EmployeeRole.MANAGER],
    tooltip: options?.tooltip || 'Xóa mục khỏi hệ thống',
    ...options,
  };
}

/**
 * Creates a standardized Manager Lock / Unlock toggle action item for user rosters.
 */
export function createManagerLockToggleAction(
  active: boolean,
  onToggle: () => void,
  isSelf = false,
  isManager = true,
): TableActionItem {
  if (active) {
    return {
      type: 'lock',
      onClick: onToggle,
      disabled: !isManager || isSelf,
      requiredRoles: [EmployeeRole.MANAGER],
      tooltip: isSelf ? 'Không thể tự khóa tài khoản của chính mình' : 'Khóa tài khoản nhân sự',
    };
  }

  return {
    type: 'unlock',
    onClick: onToggle,
    disabled: !isManager,
    requiredRoles: [EmployeeRole.MANAGER],
    tooltip: 'Mở khóa kích hoạt tài khoản',
  };
}
