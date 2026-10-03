'use client';

import { EmployeeRole } from '@/types';
import { TableActionItem } from '../types';

/**
 * Creates a standardized Cashier Checkout action item.
 */
export function createCashierCheckoutAction(
  onClick: () => void,
  disabled = false,
): TableActionItem {
  return {
    type: 'checkout',
    onClick,
    disabled,
    variant: 'primary',
    requiredRoles: [EmployeeRole.RECEPTIONIST, EmployeeRole.MANAGER],
    tooltip: 'Tiến hành thanh toán hóa đơn dịch vụ',
  };
}

/**
 * Creates a standardized Cashier Print Receipt action item.
 */
export function createCashierPrintAction(
  onClick: () => void,
  disabled = false,
): TableActionItem {
  return {
    type: 'print',
    onClick,
    disabled,
    variant: 'outline',
    tooltip: 'In phiếu thu / biên lai thanh toán',
  };
}
