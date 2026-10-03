'use client';

import React from 'react';
import { IconChevronDown, IconSearch } from '@/assets/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface FilterOption {
  value: string;
  label: string;
}

export interface TicketsFilterToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  statusOptions: FilterOption[];
  typeFilter: string;
  onTypeChange: (value: string) => void;
  typeOptions: FilterOption[];
  isFiltered: boolean;
  onResetFilters: () => void;
}

/**
 * Filter Toolbar component for the Tickets Directory screen.
 * Encapsulates search bar, status and service type dropdowns, and reset controls.
 * Adheres to Thin Screen architecture by separating complex UI from page orchestrators.
 */
export const TicketsFilterToolbar = React.memo<TicketsFilterToolbarProps>(
  ({
    searchTerm,
    onSearchChange,
    statusFilter,
    onStatusChange,
    statusOptions,
    typeFilter,
    onTypeChange,
    typeOptions,
    isFiltered,
    onResetFilters,
  }) => {
    return (
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 bg-white p-3.5 rounded-2xl border border-stone-200 shadow-2xs">
        {/* Search input with centered search icon */}
        <div className="flex-1">
          <Input
            placeholder="Tìm theo mã phiếu, SĐT khách, tên máy, số serial..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            leftIcon={<IconSearch className="w-4 h-4 text-stone-400" />}
            className="min-h-[44px] h-11 text-xs"
          />
        </div>

        {/* Status Dropdown with custom centered chevron */}
        <div className="w-full md:w-56 shrink-0 relative flex items-center">
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full h-11 min-h-[44px] px-3.5 pr-10 text-xs font-semibold rounded-xl border border-sand-200 bg-white text-stone-800 focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 appearance-none cursor-pointer transition-colors"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-3.5 flex items-center justify-center pointer-events-none text-stone-400">
            <IconChevronDown size={15} className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Service Type Dropdown with custom centered chevron */}
        <div className="w-full md:w-48 shrink-0 relative flex items-center">
          <select
            value={typeFilter}
            onChange={(e) => onTypeChange(e.target.value)}
            className="w-full h-11 min-h-[44px] px-3.5 pr-10 text-xs font-semibold rounded-xl border border-sand-200 bg-white text-stone-800 focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 appearance-none cursor-pointer transition-colors"
          >
            {typeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-3.5 flex items-center justify-center pointer-events-none text-stone-400">
            <IconChevronDown size={15} className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Reset Filters Action */}
        {isFiltered && (
          <Button
            variant="outline"
            size="sm"
            onClick={onResetFilters}
            className="min-h-[44px] h-11 text-xs px-3.5 text-stone-600 hover:text-stone-900 shrink-0"
          >
            Đặt lại
          </Button>
        )}
      </div>
    );
  },
);

TicketsFilterToolbar.displayName = 'TicketsFilterToolbar';
