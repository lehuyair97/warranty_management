'use client';

import React from 'react';
import { authState } from '@/stores/auth.store';
import { checkIsActionAllowed, getAlignmentClasses } from './helpers';
import { TableActionDropdown } from './TableActionDropdown';
import { TableActionInline } from './TableActionInline';
import { TableActionItem, TableActionsProps } from './types';

/**
 * Core TableActions View Orchestrator.
 * Modularized component inspired by FastCampus Admin architecture.
 * Automatically checks RBAC roles, filters unauthorized actions,
 * and delegates rendering to optimized inline or dropdown presentation modules.
 */
export const TableActions = React.memo(function TableActions({
  actions,
  mode = 'dropdown',
  size = 'sm',
  showLabel = true,
  align = 'right',
  className = '',
  triggerIcon = 'horizontal',
  triggerLabel = 'Tùy chọn thao tác',
  separatorBefore = ['delete', 'lock'],
  userRole,
}: TableActionsProps) {
  // Resolve effective role from props or global auth state
  const effectiveRole = userRole !== undefined ? userRole : authState.user?.role;

  // Filter actions based on visibility and RBAC role permissions
  const permittedActions: TableActionItem[] = [];

  for (const action of actions) {
    const { isVisible, isDisabled } = checkIsActionAllowed(action, effectiveRole);
    if (isVisible) {
      permittedActions.push(
        isDisabled !== action.disabled
          ? { ...action, disabled: isDisabled }
          : action,
      );
    }
  }

  if (permittedActions.length === 0) {
    return null;
  }

  const isDropdownMode =
    mode === 'dropdown' || (mode === 'auto' && permittedActions.length > 2);

  const alignClass = getAlignmentClasses(align);

  if (isDropdownMode) {
    return (
      <TableActionDropdown
        actions={permittedActions}
        triggerIcon={triggerIcon}
        triggerLabel={triggerLabel}
        align={align}
        alignClass={alignClass}
        className={className}
        separatorBefore={separatorBefore}
      />
    );
  }

  return (
    <TableActionInline
      actions={permittedActions}
      size={size}
      showLabel={showLabel}
      alignClass={alignClass}
      className={className}
    />
  );
});
