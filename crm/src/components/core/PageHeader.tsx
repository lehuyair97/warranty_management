'use client';

import React from 'react';
import { IconRefresh } from '@/assets/icon';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface PageHeaderProps {
  /** Screen main heading title */
  title: React.ReactNode;
  /** Secondary subtitle or helper description */
  description?: React.ReactNode;
  /** Counter badge or status badges placed next to the title */
  badge?: React.ReactNode;
  /** Callback invoked when clicking the standard Refresh button */
  onRefresh?: () => void;
  /** Loading spinner indicator on the refresh button */
  isRefreshing?: boolean;
  /** Custom label for the refresh button (defaults to 'Làm mới') */
  refreshLabel?: string;
  /** Quick filter controls or segmented tabs placed in the action controls bar */
  filter?: React.ReactNode;
  /** Custom primary action buttons or additional controls */
  actions?: React.ReactNode;
  /** Optional additional CSS classes for header container */
  className?: string;
  /** Optional child elements rendered inside the header actions area */
  children?: React.ReactNode;
}

/**
 * Universal PageHeader Component.
 * Standardizes page headings, responsive flex alignments, badge counters,
 * quick status filters, and action button toolbars.
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  badge,
  onRefresh,
  isRefreshing = false,
  refreshLabel = 'Làm mới',
  filter,
  actions,
  className = '',
  children,
}) => {
  const hasActions = Boolean(filter || onRefresh || actions || children);

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center justify-between gap-4',
        className,
      )}
    >
      {/* Title, Badge & Subtitle */}
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="text-sm text-stone-500 mt-1">
            {description}
          </p>
        )}
      </div>

      {/* Filter, Refresh & Actions */}
      {hasActions && (
        <div className="flex items-center gap-2 flex-wrap">
          {filter}

          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              isLoading={isRefreshing}
              leftIcon={<IconRefresh className="w-4 h-4" />}
            >
              {refreshLabel}
            </Button>
          )}

          {actions}
          {children}
        </div>
      )}
    </div>
  );
};
