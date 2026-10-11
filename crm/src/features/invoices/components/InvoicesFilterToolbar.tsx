'use client';

import React from 'react';
import { IconChevronDown, IconSearch } from '@/assets/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InvoiceStatus } from '@/types';

/** Payment status filter options; empty value means all statuses. */
const INVOICE_STATUS_OPTIONS: { value: '' | InvoiceStatus; label: string }[] = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: InvoiceStatus.UNPAID, label: 'Chưa thanh toán' },
  { value: InvoiceStatus.PAID, label: 'Đã thanh toán' },
];

export interface InvoicesFilterToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  /** Selected payment status filter; empty string means no filter. */
  statusFilter: '' | InvoiceStatus;
  onStatusChange: (value: '' | InvoiceStatus) => void;
  onReset: () => void;
}

/**
 * Checks whether any invoice filter is currently active.
 */
const checkIsFilterActive = (searchTerm: string, statusFilter: string): boolean =>
  searchTerm.trim().length > 0 || statusFilter !== '';

/**
 * Standardized Filter Toolbar for Invoices screen.
 * Matches design system layout from TicketsFilterToolbar with 44px min touch target.
 */
export const InvoicesFilterToolbar = React.memo<InvoicesFilterToolbarProps>(
  ({ searchTerm, onSearchChange, statusFilter, onStatusChange, onReset }) => {
    return (
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 bg-white p-3.5 rounded-2xl border border-stone-200 shadow-2xs">
        <div className="flex-1">
          <Input
            placeholder="Tìm theo mã hóa đơn, tên khách hàng, số điện thoại, số serial..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            leftIcon={<IconSearch className="w-4 h-4 text-stone-400" />}
            className="min-h-[44px] h-11 text-xs"
          />
        </div>

        {/* Payment status dropdown with custom centered chevron */}
        <div className="w-full md:w-56 shrink-0 relative flex items-center">
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value as '' | InvoiceStatus)}
            className="w-full h-11 min-h-[44px] px-3.5 pr-10 text-xs font-semibold rounded-xl border border-sand-200 bg-white text-stone-800 focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 appearance-none cursor-pointer transition-colors"
          >
            {INVOICE_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-3.5 flex items-center justify-center pointer-events-none text-stone-400">
            <IconChevronDown size={15} className="w-3.5 h-3.5" />
          </div>
        </div>

        {checkIsFilterActive(searchTerm, statusFilter) && (
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            className="min-h-[44px] h-11 text-xs px-3.5 text-stone-600 hover:text-stone-900 shrink-0"
          >
            Đặt lại
          </Button>
        )}
      </div>
    );
  },
);

InvoicesFilterToolbar.displayName = 'InvoicesFilterToolbar';
