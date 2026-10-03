import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  header,
  footer,
  padding = 'md',
  className = '',
  ...props
}) => {
  const paddingClass = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-6 sm:p-8',
  }[padding];

  return (
    <div
      className={`bg-white border border-sand-200 rounded-2xl shadow-xs overflow-hidden ${className}`}
      {...props}
    >
      {header && (
        <div className="px-5 py-4 border-b border-sand-200 bg-sand-50 flex items-center justify-between">
          {header}
        </div>
      )}
      <div className={paddingClass}>{children}</div>
      {footer && (
        <div className="px-5 py-3 border-t border-sand-200 bg-sand-50">
          {footer}
        </div>
      )}
    </div>
  );
};
