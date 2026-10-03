'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type BaseModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

const sizeClasses: Record<BaseModalSize, string> = {
  sm: 'sm:max-w-[425px]',
  md: 'sm:max-w-[560px]',
  lg: 'sm:max-w-[760px]',
  xl: 'sm:max-w-[960px]',
  '2xl': 'sm:max-w-[1200px]',
  full: 'sm:max-w-[calc(100vw-32px)] max-h-[calc(100vh-32px)]',
};

export interface BaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  headerContent?: React.ReactNode;
  children?: React.ReactNode;
  primaryActionLabel?: string;
  onPrimaryAction?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  primaryActionDisabled?: boolean;
  primaryActionVariant?: 'primary' | 'danger' | 'outline' | 'secondary' | 'bronze';
  isPrimaryActionLoading?: boolean;
  primaryActionType?: 'button' | 'submit' | 'reset';
  primaryActionFormId?: string;
  secondaryActionLabel?: string;
  onSecondaryAction?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  secondaryActionDisabled?: boolean;
  footerContent?: React.ReactNode;
  hideFooter?: boolean;
  size?: BaseModalSize;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  preventCloseOnOutsideClick?: boolean;
}

/**
 * Universal BaseModal based on fastcampus architecture with Radix UI primitives.
 */
export const BaseModal: React.FC<BaseModalProps> = ({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  headerContent,
  children,
  primaryActionLabel = 'Lưu thay đổi',
  onPrimaryAction,
  primaryActionDisabled = false,
  primaryActionVariant = 'primary',
  isPrimaryActionLoading = false,
  primaryActionType = 'submit',
  primaryActionFormId,
  secondaryActionLabel = 'Hủy bỏ',
  onSecondaryAction,
  secondaryActionDisabled = false,
  footerContent,
  hideFooter = false,
  size = 'md',
  className,
  headerClassName,
  bodyClassName,
  footerClassName,
  preventCloseOnOutsideClick = true,
}) => {
  const hasActions =
    !!onPrimaryAction || !!onSecondaryAction || !!primaryActionFormId;
  const shouldShowFooter = !hideFooter && (hasActions || !!footerContent);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

      <DialogContent
        onInteractOutside={(e) => {
          if (preventCloseOnOutsideClick) {
            e.preventDefault();
          }
        }}
        className={cn(
          'p-0 flex flex-col overflow-hidden max-h-[90vh] bg-white border-sand-200',
          sizeClasses[size],
          className,
        )}
      >
        {/* Header - Fixed top */}
        <DialogHeader
          className={cn(
            'px-6 py-4.5 border-b border-sand-200 bg-sand-50 shrink-0',
            headerClassName,
          )}
        >
          {headerContent ? (
            headerContent
          ) : (
            <>
              {title && <DialogTitle>{title}</DialogTitle>}
              {description && (
                <DialogDescription className="mt-0.5">
                  {description}
                </DialogDescription>
              )}
            </>
          )}
        </DialogHeader>

        {/* Scrollable Body - Scrollable middle with min-h-0 */}
        {children && (
          <div
            className={cn(
              'flex-1 min-h-0 px-6 py-5 overflow-y-auto overscroll-contain',
              bodyClassName,
            )}
          >
            {children}
          </div>
        )}

        {/* Footer - Fixed bottom */}
        {shouldShowFooter && (
          <DialogFooter
            className={cn(
              'px-6 py-3.5 border-t border-sand-200 bg-sand-50 shrink-0 w-full flex items-center justify-end gap-2.5',
              footerClassName,
            )}
          >
            {footerContent ? (
              footerContent
            ) : (
              <>
                {onSecondaryAction && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onSecondaryAction}
                    disabled={secondaryActionDisabled}
                  >
                    {secondaryActionLabel}
                  </Button>
                )}
                {primaryActionLabel && (
                  <Button
                    type={primaryActionType}
                    form={primaryActionFormId}
                    onClick={onPrimaryAction}
                    disabled={primaryActionDisabled || isPrimaryActionLoading}
                    isLoading={isPrimaryActionLoading}
                    variant={primaryActionVariant}
                  >
                    {primaryActionLabel}
                  </Button>
                )}
              </>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
