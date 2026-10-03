import {
  CustomerQueryParams,
  EmployeeQueryParams,
  InvoiceQueryParams,
  PartQueryParams,
  TicketQueryParams,
} from '@/types';

/**
 * Standardized Query Key Factories following official TanStack Query guidelines.
 * Structure:
 * - all: Root level key for full-entity invalidation (cascades to all sub-queries)
 * - lists(): Key for all list collections
 * - list(params): Key for specific parameterized list queries
 * - details(): Key for all individual entity records
 * - detail(id): Key for a specific entity record
 * - specialized sub-queries (e.g. technicians, lowStock, byPhone)
 */

export const ticketKeys = {
  all: ['tickets'] as const,
  lists: () => [...ticketKeys.all, 'list'] as const,
  list: (params?: TicketQueryParams) => [...ticketKeys.lists(), params] as const,
  details: () => [...ticketKeys.all, 'detail'] as const,
  detail: (id: number) => [...ticketKeys.details(), id] as const,
};

export const invoiceKeys = {
  all: ['invoices'] as const,
  lists: () => [...invoiceKeys.all, 'list'] as const,
  list: (params?: InvoiceQueryParams) => [...invoiceKeys.lists(), params] as const,
  details: () => [...invoiceKeys.all, 'detail'] as const,
  detail: (id: number) => [...invoiceKeys.details(), id] as const,
};

export const partKeys = {
  all: ['parts'] as const,
  lists: () => [...partKeys.all, 'list'] as const,
  list: (params?: PartQueryParams) => [...partKeys.lists(), params] as const,
  details: () => [...partKeys.all, 'detail'] as const,
  detail: (id: number) => [...partKeys.details(), id] as const,
  lowStock: () => [...partKeys.all, 'low-stock'] as const,
};

export const employeeKeys = {
  all: ['employees'] as const,
  lists: () => [...employeeKeys.all, 'list'] as const,
  list: (params?: EmployeeQueryParams) => [...employeeKeys.lists(), params] as const,
  details: () => [...employeeKeys.all, 'detail'] as const,
  detail: (id: number) => [...employeeKeys.details(), id] as const,
  technicians: () => [...employeeKeys.all, 'technicians'] as const,
};

export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  list: (params?: CustomerQueryParams) => [...customerKeys.lists(), params] as const,
  details: () => [...customerKeys.all, 'detail'] as const,
  detail: (id: number) => [...customerKeys.details(), id] as const,
  byPhone: (phone: string) => [...customerKeys.all, 'phone', phone] as const,
};

export const reportKeys = {
  all: ['reports'] as const,
  dashboard: () => [...reportKeys.all, 'dashboard'] as const,
  delayedTickets: (delayDays: number = 14) => [...reportKeys.all, 'delayed-tickets', delayDays] as const,
};

export const deviceKeys = {
  all: ['devices'] as const,
  lists: () => [...deviceKeys.all, 'list'] as const,
  list: (params?: unknown) => [...deviceKeys.lists(), params] as const,
  details: () => [...deviceKeys.all, 'detail'] as const,
  detail: (id: number) => [...deviceKeys.details(), id] as const,
  bySerial: (serial: string) => [...deviceKeys.all, 'serial', serial] as const,
  warranty: (id: number) => [...deviceKeys.all, 'warranty', id] as const,
  history: (id: number) => [...deviceKeys.all, 'history', id] as const,
};

/**
 * Consolidated Query Key registry for clean imports across the application.
 */
export const queryKeys = {
  tickets: ticketKeys,
  devices: deviceKeys,
  invoices: invoiceKeys,
  parts: partKeys,
  employees: employeeKeys,
  customers: customerKeys,
  reports: reportKeys,
} as const;
