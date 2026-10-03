'use client';

import React from 'react';
import { IconRefresh } from '@/assets/icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'bronze';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/**
 * Universal Button Component with POS touch target ergonomics (min 48px)
 * and tactile micro-interactions (active:scale-[0.98]).
 */
export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-xl cursor-pointer transition-all duration-150 select-none focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]';

  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 min-h-[38px] gap-1.5',
    md: 'text-sm px-4 py-2.5 min-h-[48px] gap-2', // Standard POS touch target
    lg: 'text-base px-6 py-3 min-h-[52px] gap-2.5',
  }[size];

  const variantClasses = {
    primary:
      'bg-stone-900 text-white hover:bg-stone-800 focus:ring-stone-900 shadow-sm',
    secondary:
      'bg-sand-100 text-stone-800 hover:bg-sand-200 focus:ring-sand-300',
    bronze:
      'bg-bronze-600 text-white hover:bg-bronze-700 focus:ring-bronze-600 shadow-sm',
    outline:
      'border border-sand-200 bg-white text-stone-700 hover:bg-sand-50 focus:ring-stone-400',
    danger:
      'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500 shadow-sm',
    ghost:
      'text-stone-600 hover:bg-sand-100 hover:text-stone-900 focus:ring-stone-300',
  }[variant];

  return (
    <button
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <IconRefresh className="w-4 h-4 animate-spin" />
          <span>Đang xử lý...</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};
