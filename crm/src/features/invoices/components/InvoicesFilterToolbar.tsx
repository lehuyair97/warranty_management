'use client';

import React from 'react';
import { IconSearch } from '@/assets/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface InvoicesFilterToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onReset: () => void;
}

/**
 * Standardized Filter Toolbar for Invoices screen.
 * Matches design system layout from TicketsFilterToolbar with 44px min touch target.
 */
export const InvoicesFilterToolbar = React.memo<InvoicesFilterToolbarProps>(
  ({ searchTerm, onSearchChange, onReset }) => {
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

        {searchTerm.trim().length > 0 && (
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
