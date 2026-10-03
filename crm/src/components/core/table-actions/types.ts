'use client';

import React from 'react';
import { EmployeeRole } from '@/types';

/**
 * Standard system action identifiers used across all admin table rows.
 * Categorized by operational domains and roles.
 */
export type ActionType =
  // Manager & Admin Actions
  | 'edit'
  | 'delete'
  | 'lock'
  | 'unlock'
  // Technician Actions
  | 'claim'
  | 'diagnose'
  | 'addPart'
  // Cashier & Billing Actions
  | 'checkout'
  | 'print'
  // Receptionist & Intake Actions
  | 'viewDetail'
  | 'createTicket'
  // Universal Utility Actions
  | 'add'
  | 'refresh'
  | 'custom';

/**
 * Visual variant semantic types for actions.
 */
export type ActionVariant =
  | 'default'
  | 'destructive'
  | 'primary'
  | 'success'
  | 'outline'
  | 'secondary'
  | 'ghost';

/**
 * Metadata configuration for an action type.
 */
export interface ActionConfig {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  variant: ActionVariant;
  tooltip?: string;
  /** Default roles permitted to execute this action */
  defaultRoles?: EmployeeRole[];
}

/**
 * Specification for a single action button/item within a table row.
 */
export interface TableActionItem {
  /** Canonical action type defined in ACTION_CONFIG */
  type: ActionType;
  /** Click event handler */
  onClick: () => void;
  /** Custom label override (defaults to ACTION_CONFIG[type].label) */
  label?: string;
  /** Custom icon override (defaults to ACTION_CONFIG[type].icon) */
  icon?: React.ComponentType<{ className?: string }>;
  /** Explicit disabled state */
  disabled?: boolean;
  /** Explicit hidden state (filters out completely) */
  hidden?: boolean;
  /** Tooltip or title attribute */
  tooltip?: string;
  /** Visual variant override */
  variant?: ActionVariant;
  /** Loading spinner indicator */
  isLoading?: boolean;
  /** Optional RBAC roles required to see/execute this action */
  requiredRoles?: EmployeeRole[];
  /** How to handle unauthorized role: 'hide' (default) or 'disable' */
  unauthorizedBehavior?: 'hide' | 'disable';
}

/**
 * Props for the TableActions component.
 */
export interface TableActionsProps {
  /** List of actions to display */
  actions: TableActionItem[];
  /**
   * Display mode:
   * - 'dropdown': renders an action trigger button (...) that opens a menu (FastCampus Admin style, default)
   * - 'inline': renders action buttons side-by-side
   * - 'auto': uses 'inline' when count <= 2, otherwise 'dropdown'
   */
  mode?: 'inline' | 'dropdown' | 'auto';
  /** Button sizing ('sm' = 32px height, 'md' = 36px height) */
  size?: 'sm' | 'md';
  /** Whether to show text label next to icon in inline mode */
  showLabel?: boolean;
  /** Alignment of container */
  align?: 'left' | 'center' | 'right';
  /** Additional container classes */
  className?: string;
  /** Trigger icon style for dropdown mode */
  triggerIcon?: 'horizontal' | 'vertical';
  /** Accessible label for trigger button */
  triggerLabel?: string;
  /** List of action types to precede with a visual divider line in dropdown */
  separatorBefore?: ActionType[];
  /** Explicit user role override (defaults to reading from authState) */
  userRole?: EmployeeRole | null;
}
