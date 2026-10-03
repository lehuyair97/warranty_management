'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { IconMoreHorizontal, IconMoreVertical } from '@/assets/icon';
import { cn } from '@/lib/utils';
import { ACTION_CONFIG } from './constants';
import { getDropdownItemVariantClasses } from './helpers';
import { ActionType, TableActionItem } from './types';

export interface TableActionDropdownProps {
  actions: TableActionItem[];
  triggerIcon?: 'horizontal' | 'vertical';
  triggerLabel?: string;
  align?: 'left' | 'center' | 'right';
  alignClass: string;
  className?: string;
  separatorBefore?: ActionType[];
}

interface MenuPosition {
  top: number;
  right?: number;
  left?: number;
  openUpwards: boolean;
}

/**
 * Pure presentation component rendering actions in an accessible floating dropdown menu.
 * Uses React Portal to guarantee the floating menu is never clipped by table overflow wrappers.
 * Memoized to prevent re-renders when other table rows update.
 */
export const TableActionDropdown = React.memo(function TableActionDropdown({
  actions,
  triggerIcon = 'horizontal',
  triggerLabel = 'Tùy chọn thao tác',
  align = 'right',
  alignClass,
  className = '',
  separatorBefore = ['delete', 'lock'],
}: TableActionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<MenuPosition | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Compute fixed viewport coordinates based on trigger button rect
  const updatePosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpwards = spaceBelow < 190 && rect.top > 190;

    const top = openUpwards ? rect.top - 6 : rect.bottom + 6;
    const right = window.innerWidth - rect.right;
    const left = rect.left;

    setPosition({
      top,
      right: align === 'right' ? right : undefined,
      left: align === 'left' ? left : undefined,
      openUpwards,
    });
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOpen) {
      setIsOpen(false);
    } else {
      updatePosition();
      setIsOpen(true);
    }
  };

  // Close dropdown on outside click, window scroll/resize, or Escape key
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    function handleScrollOrResize() {
      setIsOpen(false);
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen]);

  const TriggerIconComponent =
    triggerIcon === 'vertical' ? IconMoreVertical : IconMoreHorizontal;

  return (
    <div className={cn('relative inline-flex items-center', alignClass, className)}>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        title={triggerLabel}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className={cn(
          'w-8 h-8 min-w-[32px] min-h-[32px] rounded-lg border border-sand-200 bg-white text-stone-500',
          'hover:text-stone-900 hover:bg-sand-100 hover:border-sand-300 shadow-2xs',
          'inline-flex items-center justify-center transition-all duration-150 active:scale-95 cursor-pointer',
          isOpen && 'bg-sand-100 border-stone-400 text-stone-900 ring-2 ring-stone-400/20',
        )}
      >
        <span className="sr-only">{triggerLabel}</span>
        <TriggerIconComponent className="w-4 h-4" />
      </button>

      {isOpen &&
        position &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-orientation="vertical"
            style={{
              position: 'fixed',
              top: position.openUpwards ? undefined : position.top,
              bottom: position.openUpwards ? window.innerHeight - position.top : undefined,
              right: position.right,
              left: position.left,
            }}
            className={cn(
              'min-w-[170px] bg-white border border-sand-200 rounded-xl shadow-xl py-1 z-[9999]',
              'animate-in fade-in-0 zoom-in-95 duration-100 select-none',
            )}
          >
            {actions.map((action) => {
              const config = ACTION_CONFIG[action.type] || ACTION_CONFIG.custom;
              const Icon = action.icon || config.icon;
              const displayLabel = action.label || config.label;
              const effectiveVariant = action.variant || config.variant;
              const itemVariantClasses = getDropdownItemVariantClasses(effectiveVariant);
              const showSeparator = separatorBefore.includes(action.type);

              return (
                <React.Fragment key={action.type}>
                  {showSeparator && (
                    <div className="my-1 border-t border-sand-100" />
                  )}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsOpen(false);
                      if (!action.disabled && !action.isLoading) {
                        action.onClick();
                      }
                    }}
                    disabled={action.disabled || action.isLoading}
                    title={action.tooltip || displayLabel}
                    className={cn(
                      'w-full text-left px-3 py-2 text-xs font-medium flex items-center gap-2.5 transition-colors cursor-pointer',
                      'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
                      itemVariantClasses,
                    )}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{displayLabel}</span>
                  </button>
                </React.Fragment>
              );
            })}
          </div>,
          document.body,
        )}
    </div>
  );
});
