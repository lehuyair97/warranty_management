'use client';

import { TableActionItem } from '../types';

/**
 * Creates a standardized Receptionist View Detail action item.
 */
export function createReceptionistDetailAction(
  onClick: () => void,
  options?: Partial<TableActionItem>,
): TableActionItem {
  return {
    type: 'viewDetail',
    onClick,
    tooltip: options?.tooltip || 'Xem chi tiết & cập nhật hồ sơ phiếu',
    ...options,
  };
}
