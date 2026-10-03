'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export type PageContainerSpacing = 'default' | 'compact' | 'none';

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Vertical rhythm spacing between direct page sections. Default is 'default'. */
  spacing?: PageContainerSpacing;
  /** When true, locks the container to full screen height without page scrolling. Default is true. */
  fitScreen?: boolean;
  /** Optional additional CSS classes */
  className?: string;
}

/**
 * Universal PageContainer component.
 * Standardizes page view boundaries, ensuring full-height flex column layout
 * and consistent vertical rhythm across all application screens.
 */
export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  spacing = 'default',
  fitScreen = true,
  className = '',
  ...props
}) => {
  const spacingStyles: Record<PageContainerSpacing, string> = {
    default: fitScreen ? 'gap-4 sm:gap-5' : 'space-y-6',
    compact: fitScreen ? 'gap-3 sm:gap-4' : 'space-y-4',
    none: '',
  };

  return (
    <div
      className={cn(
        'flex-1 flex flex-col min-w-0',
        fitScreen && 'min-h-0 h-full overflow-hidden',
        spacingStyles[spacing],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};
