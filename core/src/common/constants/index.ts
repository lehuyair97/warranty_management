/**
 * Application roles for employees.
 */
export enum EmployeeRole {
  RECEPTIONIST = 'receptionist',
  TECHNICIAN = 'technician',
  MANAGER = 'manager',
}

/**
 * Ticket status lifecycle values.
 */
export enum TicketStatus {
  RECEIVED = 'received',
  INSPECTING = 'inspecting',
  WAITING_FOR_PARTS = 'waiting_for_parts',
  REPAIRING = 'repairing',
  COMPLETED = 'completed',
  PAID = 'paid',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

/**
 * Ticket types categorization.
 */
export enum TicketType {
  REPAIR = 'repair',
  WARRANTY = 'warranty',
  RE_REPAIR = 're_repair',
}

/**
 * Invoice payment statuses.
 */
export enum InvoiceStatus {
  UNPAID = 'unpaid',
  PAID = 'paid',
}

/**
 * Supported payment methods.
 */
export enum PaymentMethod {
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  CREDIT_CARD = 'credit_card',
}

/**
 * Metadata key for public routes.
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Metadata key for roles authorization.
 */
export const ROLES_KEY = 'roles';
