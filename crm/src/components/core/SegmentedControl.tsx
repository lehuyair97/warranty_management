'use client';

import React, { useId } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

export type SegmentedControlVariant =
  | 'default'
  | 'stone'
  | 'amber'
  | 'emerald'
  | 'rose'
  | 'blue'
  | 'bronze';

export type SegmentedControlType = 'pill' | 'underline';

export interface SegmentedControlOption<T> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  count?: number | string;
  variant?: SegmentedControlVariant;
  disabled?: boolean;
}

export interface SegmentedControlProps<T> {
  value: T;
  onChange: (value: T) => void;
  options: SegmentedControlOption<T>[];
  size?: 'sm' | 'md' | 'lg';
  type?: SegmentedControlType;
  layoutId?: string;
  fullWidth?: boolean;
  className?: string;
  itemClassName?: string;
}

/**
 * Universal Animated SegmentedControl & Underline Tabs Component.
 * Supports sliding background pill and sliding underline indicators powered by Motion.
 * Standardizes iOS/Tailwind pill tab controls and quick status filters across the application.
 */
export function SegmentedControl<T extends string | number | boolean>({
  value,
  onChange,
  options,
  size = 'md',
  type = 'pill',
  layoutId,
  fullWidth = false,
  className = '',
  itemClassName = '',
}: SegmentedControlProps<T>) {
  const uniqueId = useId();
  const effectiveLayoutId = layoutId || `segmented-${type}-${uniqueId}`;

  const isUnderline = type === 'underline';

  // Size styling maps
  const pillSizeStyles = {
    sm: 'px-2.5 py-1 text-[11px] gap-1.5 min-h-[30px]',
    md: 'px-3 py-1.5 text-xs gap-1.5 min-h-[34px]',
    lg: 'px-4 py-2 text-sm gap-2 min-h-[40px]',
  }[size];

  const underlineSizeStyles = {
    sm: 'px-3 py-1.5 text-[11px] gap-1.5',
    md: 'px-3.5 py-2 text-xs gap-2',
    lg: 'px-4.5 py-2.5 text-sm gap-2',
  }[size];

  // Active text color styles
  const activeTextStyles: Record<SegmentedControlVariant, string> = {
    default: 'text-stone-900 font-bold',
    stone: 'text-stone-900 font-bold',
    amber: 'text-amber-900 font-bold',
    emerald: 'text-emerald-900 font-bold',
    rose: 'text-rose-900 font-bold',
    blue: 'text-blue-900 font-bold',
    bronze: 'text-amber-900 font-bold',
  };

  const activeUnderlineTextStyles: Record<SegmentedControlVariant, string> = {
    default: 'text-stone-900 font-bold',
    stone: 'text-stone-900 font-bold',
    amber: 'text-amber-700 font-bold',
    emerald: 'text-emerald-700 font-bold',
    rose: 'text-rose-700 font-bold',
    blue: 'text-blue-700 font-bold',
    bronze: 'text-amber-700 font-bold',
  };

  // Underline indicator color styles
  const activeUnderlineIndicatorStyles: Record<SegmentedControlVariant, string> = {
    default: 'bg-stone-900',
    stone: 'bg-stone-800',
    amber: 'bg-amber-600',
    emerald: 'bg-emerald-600',
    rose: 'bg-rose-600',
    blue: 'bg-blue-600',
    bronze: 'bg-amber-600',
  };

  // Pill active background styles
  const activePillBgStyles: Record<SegmentedControlVariant, string> = {
    default: 'bg-white shadow-xs border border-stone-200/60',
    stone: 'bg-white shadow-xs border border-stone-200/60',
    amber: 'bg-white shadow-xs border border-amber-200/60',
    emerald: 'bg-white shadow-xs border border-emerald-200/60',
    rose: 'bg-white shadow-xs border border-rose-200/60',
    blue: 'bg-white shadow-xs border border-blue-200/60',
    bronze: 'bg-white shadow-xs border border-amber-200/60',
  };

  if (isUnderline) {
    return (
      <div
        role="tablist"
        className={cn(
          'inline-flex items-center border-b border-stone-200 text-xs select-none relative gap-1',
          fullWidth && 'w-full flex',
          className,
        )}
      >
        {options.map((option) => {
          const isSelected = option.value === value;
          const variant = option.variant || 'default';

          return (
            <button
              key={String(option.value)}
              type="button"
              role="tab"
              aria-selected={isSelected}
              disabled={option.disabled}
              onClick={() => onChange(option.value)}
              className={cn(
                'relative inline-flex items-center justify-center transition-colors duration-150 cursor-pointer select-none font-medium',
                underlineSizeStyles,
                fullWidth && 'flex-1',
                isSelected
                  ? activeUnderlineTextStyles[variant]
                  : 'text-stone-500 hover:text-stone-800',
                option.disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
                itemClassName,
              )}
            >
              <span className="relative z-10 inline-flex items-center gap-1.5">
                {option.icon && <span className="shrink-0 inline-flex">{option.icon}</span>}
                <span>{option.label}</span>
                {option.count !== undefined && (
                  <span
                    className={cn(
                      'ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold transition-colors',
                      isSelected
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-stone-100 text-stone-600',
                    )}
                  >
                    {option.count}
                  </span>
                )}
              </span>

              {isSelected && (
                <motion.div
                  layoutId={effectiveLayoutId}
                  transition={{
                    type: 'spring',
                    stiffness: 500,
                    damping: 38,
                    mass: 0.8,
                  }}
                  className={cn(
                    'absolute bottom-0 left-0 right-0 h-0.5 rounded-full z-10',
                    activeUnderlineIndicatorStyles[variant],
                  )}
                />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Pill mode (Default)
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs select-none relative',
        fullWidth && 'w-full flex',
        className,
      )}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        const variant = option.variant || 'default';

        return (
          <button
            key={String(option.value)}
            type="button"
            role="tab"
            aria-selected={isSelected}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              'relative inline-flex items-center justify-center rounded-lg transition-colors duration-150 cursor-pointer select-none active:scale-[0.98]',
              pillSizeStyles,
              fullWidth && 'flex-1',
              isSelected
                ? activeTextStyles[variant]
                : 'text-stone-500 hover:text-stone-800 font-medium',
              option.disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
              itemClassName,
            )}
          >
            {isSelected && (
              <motion.div
                layoutId={effectiveLayoutId}
                transition={{
                  type: 'spring',
                  stiffness: 500,
                  damping: 38,
                  mass: 0.8,
                }}
                className={cn(
                  'absolute inset-0 rounded-lg z-0',
                  activePillBgStyles[variant],
                )}
              />
            )}

            <span className="relative z-10 inline-flex items-center gap-1.5">
              {option.icon && <span className="shrink-0 inline-flex">{option.icon}</span>}
              <span>{option.label}</span>
              {option.count !== undefined && (
                <span
                  className={cn(
                    'ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold transition-colors',
                    isSelected
                      ? 'bg-stone-100 text-stone-700'
                      : 'bg-stone-200/80 text-stone-600',
                  )}
                >
                  {option.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// Convenient aliases for filter & tab contexts
export const Tabs = SegmentedControl;
export const SegmentedFilter = SegmentedControl;
