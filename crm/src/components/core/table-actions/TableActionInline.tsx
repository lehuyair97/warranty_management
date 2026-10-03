'use client';

import React from 'react';
import { IconRefresh } from '@/assets/icon';
import { cn } from '@/lib/utils';
import { ACTION_CONFIG } from './constants';
import { getActionVariantClasses } from './helpers';
import { TableActionItem } from './types';

export interface TableActionInlineProps {
  actions: TableActionItem[];
  size?: 'sm' | 'md';
  showLabel?: boolean;
  alignClass: string;
  className?: string;
}

/**
 * Pure presentation component rendering inline action buttons.
 * Memoized to avoid unnecessary DOM reflows across data tables.
 */
export const TableActionInline = React.memo(function TableActionInline({
  actions,
  size = 'sm',
  showLabel = true,
  alignClass,
  className = '',
}: TableActionInlineProps) {
  const isCompactSize = size === 'sm';
  const sizeClasses = isCompactSize
    ? showLabel
      ? 'h-8 px-2.5 py-1 text-xs gap-1.5'
      : 'w-8 h-8 min-w-[32px] min-h-[32px] p-0'
    : showLabel
      ? 'h-9 px-3 py-1.5 text-sm gap-2'
      : 'w-9 h-9 min-w-[36px] min-h-[36px] p-0';

  const iconClasses = isCompactSize ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <div className={cn('flex items-center gap-1.5', alignClass, className)}>
      {actions.map((action) => {
        const config = ACTION_CONFIG[action.type] || ACTION_CONFIG.custom;
        const Icon = action.icon || config.icon;
        const displayLabel = action.label || config.label;
        const effectiveVariant = action.variant || config.variant;
        const variantClasses = getActionVariantClasses(effectiveVariant);

        return (
          <button
            key={action.type}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (!action.disabled && !action.isLoading) {
                action.onClick();
              }
            }}
            disabled={action.disabled || action.isLoading}
            title={action.tooltip || displayLabel}
            className={cn(
              'inline-flex items-center justify-center font-medium rounded-lg select-none',
              'transition-all duration-150 active:scale-95 cursor-pointer',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
              sizeClasses,
              variantClasses,
            )}
          >
            {action.isLoading ? (
              <IconRefresh className={cn(iconClasses, 'animate-spin')} />
            ) : (
              <Icon className={cn(iconClasses, 'shrink-0')} />
            )}
            {showLabel && <span className="whitespace-nowrap">{displayLabel}</span>}
          </button>
        );
      })}
    </div>
  );
});
