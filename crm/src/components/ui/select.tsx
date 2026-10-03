'use client';

import React from 'react';
import { IconAlertCircle, IconChevronDown } from '@/assets/icon';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string | number; label: string }>;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = '', id, ...props }, ref) => {
    const selectId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-xs font-semibold uppercase tracking-wider text-stone-700">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            id={selectId}
            ref={ref}
            className={`w-full min-h-[48px] px-3.5 py-2.5 pr-10 text-sm bg-white border rounded-xl text-stone-900 transition-colors focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 appearance-none cursor-pointer disabled:bg-stone-50 disabled:text-stone-400 ${
              error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20' : 'border-sand-200'
            } ${className}`}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-3.5 text-stone-500 pointer-events-none flex items-center justify-center">
            <IconChevronDown size={16} className="w-4 h-4" />
          </div>
        </div>
        {error && (
          <div className="flex items-center gap-1.5 text-xs text-rose-600 font-medium">
            <IconAlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  },
);

Select.displayName = 'Select';
