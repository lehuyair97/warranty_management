'use client';

import {
  IconCheck,
  IconDollarSign,
  IconEdit,
  IconEye,
  IconFileText,
  IconLock,
  IconPlus,
  IconPrinter,
  IconRefresh,
  IconTrash,
} from '@/assets/icon';
import { EmployeeRole } from '@/types';
import { ActionConfig, ActionType } from './types';

/**
 * Centralized core configuration dictionary for all table action types.
 * Defines canonical icon, default Vietnamese label, semantic variant, tooltip,
 * and default permitted employee roles.
 */
export const ACTION_CONFIG: Record<ActionType, ActionConfig> = {
  // ── Manager Actions ──
  edit: {
    icon: IconEdit,
    label: 'Sửa',
    variant: 'outline',
    tooltip: 'Chỉnh sửa thông tin',
    defaultRoles: [EmployeeRole.MANAGER],
  },
  delete: {
    icon: IconTrash,
    label: 'Xóa',
    variant: 'destructive',
    tooltip: 'Xóa mục khỏi hệ thống',
    defaultRoles: [EmployeeRole.MANAGER],
  },
  lock: {
    icon: IconLock,
    label: 'Khóa',
    variant: 'destructive',
    tooltip: 'Khóa tài khoản nhân sự',
    defaultRoles: [EmployeeRole.MANAGER],
  },
  unlock: {
    icon: IconCheck,
    label: 'Mở',
    variant: 'success',
    tooltip: 'Mở khóa kích hoạt tài khoản',
    defaultRoles: [EmployeeRole.MANAGER],
  },

  // ── Technician Actions ──
  claim: {
    icon: IconCheck,
    label: 'Nhận việc',
    variant: 'primary',
    tooltip: 'Tiếp nhận xử lý phiếu sửa chữa',
    defaultRoles: [EmployeeRole.TECHNICIAN, EmployeeRole.MANAGER],
  },
  diagnose: {
    icon: IconEdit,
    label: 'Chỉnh sửa',
    variant: 'outline',
    tooltip: 'Chỉnh sửa thông tin & tiến trình sửa chữa',
    defaultRoles: [EmployeeRole.TECHNICIAN, EmployeeRole.MANAGER],
  },
  addPart: {
    icon: IconPlus,
    label: 'Linh kiện',
    variant: 'outline',
    tooltip: 'Xuất linh kiện thay thế',
    defaultRoles: [EmployeeRole.TECHNICIAN, EmployeeRole.MANAGER],
  },

  // ── Cashier Actions ──
  checkout: {
    icon: IconDollarSign,
    label: 'Thanh toán',
    variant: 'primary',
    tooltip: 'Tiến hành thanh toán thu ngân',
    defaultRoles: [EmployeeRole.RECEPTIONIST, EmployeeRole.MANAGER],
  },
  print: {
    icon: IconPrinter,
    label: 'In biên lai',
    variant: 'outline',
    tooltip: 'In phiếu / biên nhận thanh toán',
    defaultRoles: [EmployeeRole.RECEPTIONIST, EmployeeRole.MANAGER],
  },

  // ── Receptionist Actions ──
  viewDetail: {
    icon: IconEye,
    label: 'Chi tiết',
    variant: 'outline',
    tooltip: 'Xem thông tin chi tiết',
  },
  createTicket: {
    icon: IconFileText,
    label: 'Tạo phiếu',
    variant: 'primary',
    tooltip: 'Lập phiếu tiếp nhận mới',
    defaultRoles: [EmployeeRole.RECEPTIONIST, EmployeeRole.MANAGER],
  },

  // ── Universal Actions ──
  add: {
    icon: IconPlus,
    label: 'Thêm',
    variant: 'primary',
    tooltip: 'Thêm mới dữ liệu',
  },
  refresh: {
    icon: IconRefresh,
    label: 'Làm mới',
    variant: 'outline',
    tooltip: 'Tải lại dữ liệu',
  },
  custom: {
    icon: IconEdit,
    label: 'Thao tác',
    variant: 'outline',
    tooltip: 'Thực hiện thao tác',
  },
};
