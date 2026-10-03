'use client';

import { EmployeeRole } from '@/types';
import { TableActionItem } from '../types';

/**
 * Creates a standardized Technician Claim action item.
 */
export function createTechnicianClaimAction(
  onClick: () => void,
  isAssigning = false,
  hidden = false,
): TableActionItem {
  return {
    type: 'claim',
    onClick,
    disabled: isAssigning,
    hidden,
    variant: 'success',
    requiredRoles: [EmployeeRole.TECHNICIAN, EmployeeRole.MANAGER],
    tooltip: 'Nhận phiếu để bắt đầu xử lý sửa chữa',
  };
}

/**
 * Creates a standardized Technician Diagnosis / Repair action item.
 */
export function createTechnicianDiagnoseAction(
  onClick: () => void,
  isAssignedToMe = false,
  isFinished = false,
): TableActionItem {
  if (isFinished) {
    return {
      type: 'diagnose',
      label: 'Xem / Chỉnh sửa',
      onClick,
      variant: 'outline',
      tooltip: 'Xem lại hoặc chỉnh sửa thông tin kỹ thuật',
    };
  }

  return {
    type: 'diagnose',
    label: 'Chỉnh sửa',
    onClick,
    variant: 'primary',
    requiredRoles: [EmployeeRole.TECHNICIAN, EmployeeRole.MANAGER],
    tooltip: isAssignedToMe
      ? 'Chỉnh sửa chẩn đoán, linh kiện thay thế & tiến trình'
      : 'Chỉnh sửa phiếu (Quản lý / Hỗ trợ KTV)',
  };
}
