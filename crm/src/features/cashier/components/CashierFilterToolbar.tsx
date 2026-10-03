'use client';

import React from 'react';
import { SegmentedControl, SegmentedControlOption } from '@/components/core';

export interface CashierFilterToolbarProps {
  status: string;
  onChange: (status: string) => void;
}

const CASHIER_FILTER_OPTIONS: SegmentedControlOption<string>[] = [
  { value: '', label: 'Tất cả' },
  { value: 'unpaid', label: 'Chờ thanh toán', variant: 'amber' },
  { value: 'paid', label: 'Đã thu tiền', variant: 'emerald' },
];

/**
 * Cashier status filter toolbar component.
 * Encapsulates billing status filter options and UI inside the cashier feature module.
 */
export const CashierFilterToolbar = React.memo<CashierFilterToolbarProps>(
  ({ status, onChange }) => {
    return (
      <SegmentedControl
        value={status}
        onChange={onChange}
        options={CASHIER_FILTER_OPTIONS}
      />
    );
  },
);

CashierFilterToolbar.displayName = 'CashierFilterToolbar';
