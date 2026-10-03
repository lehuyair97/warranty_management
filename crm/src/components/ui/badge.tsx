import React from 'react';

export type BadgeVariant =
  | 'stone'
  | 'emerald'
  | 'amber'
  | 'blue'
  | 'rose'
  | 'bronze'
  | 'outline'
  | 'success'
  | 'warning'
  | 'primary'
  | 'info'
  | 'danger';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'stone',
  size = 'md',
  dot = false,
  className = '',
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    stone: 'bg-stone-100 text-stone-800 border-stone-300',
    outline: 'bg-white text-stone-700 border-stone-300',
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    amber: 'bg-amber-50 text-amber-800 border-amber-300',
    warning: 'bg-amber-50 text-amber-800 border-amber-300',
    blue: 'bg-blue-50 text-blue-800 border-blue-300',
    info: 'bg-blue-50 text-blue-800 border-blue-300',
    rose: 'bg-rose-50 text-rose-800 border-rose-300',
    danger: 'bg-rose-50 text-rose-800 border-rose-300',
    bronze: 'bg-amber-100 text-amber-900 border-amber-400',
    primary: 'bg-stone-900 text-white border-stone-900',
  };

  const dotStyles: Record<BadgeVariant, string> = {
    stone: 'bg-stone-500',
    outline: 'bg-stone-400',
    emerald: 'bg-emerald-500',
    success: 'bg-emerald-500',
    amber: 'bg-amber-500',
    warning: 'bg-amber-500',
    blue: 'bg-blue-500',
    info: 'bg-blue-500',
    rose: 'bg-rose-500',
    danger: 'bg-rose-500',
    bronze: 'bg-amber-700',
    primary: 'bg-amber-400',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap shrink-0 border leading-none ${variantStyles[variant]} ${sizeStyles} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotStyles[variant]}`}
        />
      )}
      {children}
    </span>
  );
};
