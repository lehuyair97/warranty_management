'use client';

import { EmployeeRole } from '@/types';
import { ACTION_CONFIG } from './constants';
import { ActionVariant, TableActionItem } from './types';

/**
 * Pure helper function determining action visibility and disabled state
 * based on explicit props and user RBAC role.
 */
export function checkIsActionAllowed(
  item: TableActionItem,
  userRole?: EmployeeRole | null,
): { isVisible: boolean; isDisabled: boolean } {
  // 1. Explicit hidden flag
  if (item.hidden) {
    return { isVisible: false, isDisabled: true };
  }

  // 2. Check required roles
  const config = ACTION_CONFIG[item.type] || ACTION_CONFIG.custom;
  const allowedRoles = item.requiredRoles || config.defaultRoles;

  if (allowedRoles && allowedRoles.length > 0) {
    const hasPermission = userRole ? allowedRoles.includes(userRole) : false;
    if (!hasPermission) {
      if (item.unauthorizedBehavior === 'disable') {
        return { isVisible: true, isDisabled: true };
      }
      return { isVisible: false, isDisabled: true };
    }
  }

  return {
    isVisible: true,
    isDisabled: Boolean(item.disabled || item.isLoading),
  };
}

/**
 * Pure helper function returning Tailwind classes for action button variants.
 */
export function getActionVariantClasses(variant: ActionVariant): string {
  switch (variant) {
    case 'destructive':
      return 'border border-rose-200 bg-white text-rose-600 hover:text-rose-700 hover:bg-rose-50 hover:border-rose-300 shadow-2xs';
    case 'primary':
      return 'border border-stone-900 bg-stone-900 text-white hover:bg-stone-800 shadow-2xs';
    case 'success':
      return 'border border-emerald-200 bg-white text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 shadow-2xs';
    case 'secondary':
      return 'border border-sand-200 bg-sand-100 text-stone-800 hover:bg-sand-200 shadow-2xs';
    case 'ghost':
      return 'border border-transparent text-stone-600 hover:text-stone-900 hover:bg-sand-100';
    case 'outline':
    case 'default':
    default:
      return 'border border-sand-200 bg-white text-stone-700 hover:text-stone-900 hover:bg-sand-50 hover:border-stone-300 shadow-2xs';
  }
}

/**
 * Pure helper function returning Tailwind classes for dropdown menu item variants.
 */
export function getDropdownItemVariantClasses(variant: ActionVariant): string {
  switch (variant) {
    case 'destructive':
      return 'text-rose-600 hover:bg-rose-50 focus:bg-rose-50';
    case 'success':
      return 'text-emerald-600 hover:bg-emerald-50 focus:bg-emerald-50';
    case 'primary':
      return 'text-stone-900 font-semibold hover:bg-sand-100 focus:bg-sand-100';
    default:
      return 'text-stone-700 hover:bg-sand-50 hover:text-stone-900 focus:bg-sand-50';
  }
}

/**
 * Pure helper function checking alignment classes.
 */
export function getAlignmentClasses(align: 'left' | 'center' | 'right'): string {
  switch (align) {
    case 'left':
      return 'justify-start';
    case 'center':
      return 'justify-center';
    case 'right':
    default:
      return 'justify-end';
  }
}
