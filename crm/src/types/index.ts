/**
 * Employee roles supported in the system.
 */
export enum EmployeeRole {
  RECEPTIONIST = 'receptionist',
  TECHNICIAN = 'technician',
  MANAGER = 'manager',
}

/**
 * Ticket lifecycle statuses.
 */
export enum TicketStatus {
  RECEIVED = 'received',
  INSPECTING = 'inspecting',
  WAITING_FOR_PARTS = 'waiting_for_parts',
  REPAIRING = 'repairing',
  COMPLETED = 'completed',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

/**
 * Ticket classification categories.
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

// Re-export modern generic API response and DTO contracts
export * from './api';


/**
 * Logged in employee user context.
 */
export interface UserProfile {
  id: number;
  username: string;
  fullName: string;
  role: EmployeeRole;
  phoneNumber?: string | null;
  email?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Customer profile.
 */
export interface Customer {
  id: number;
  fullName: string;
  phoneNumber: string;
  email?: string | null;
  address?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Registered equipment device.
 */
export interface Device {
  id: number;
  customerId: number;
  deviceName: string;
  deviceType?: string | null;
  brand?: string | null;
  serialNumber?: string | null;
  isUnderWarranty: boolean;
  warrantyExpiryDate?: string | null;
  customer?: Customer;
  createdAt: string;
  updatedAt: string;
}

/**
 * Spare part inventory item.
 */
export interface Part {
  id: number;
  partName: string;
  partCode: string;
  stockQuantity: number;
  price: number;
  unit: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Invoice item for attached spare parts.
 */
export interface InvoiceItem {
  id: number;
  invoiceId: number;
  partId: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  part?: Part;
}

/**
 * Billing invoice.
 */
export interface Invoice {
  id: number;
  ticketId: number;
  status: InvoiceStatus;
  laborFee: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod?: PaymentMethod | null;
  paidAt?: string | null;
  createdAt: string;
  updatedAt: string;
  ticket?: Ticket;
  items?: InvoiceItem[];
}

/**
 * Repair ticket.
 */
export interface Ticket {
  id: number;
  deviceId: number;
  receptionistId: number;
  technicianId?: number | null;
  ticketType: TicketType;
  issueDescription: string;
  initialCondition?: string | null;
  accessories?: string | null;
  receivedAt: string;
  faultCause?: string | null;
  repairSolution?: string | null;
  estimatedCost: number;
  status: TicketStatus;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  device?: Device;
  receptionist?: UserProfile;
  technician?: UserProfile | null;
  invoices?: Invoice[];
  statusHistory?: TicketStatusHistory[];
}

/**
 * Ticket status transition audit log recorded by database trigger.
 */
export interface TicketStatusHistory {
  id: number;
  ticketId: number;
  oldStatus?: TicketStatus | null;
  newStatus: TicketStatus;
  technicianId?: number | null;
  technician?: UserProfile | null;
  note?: string | null;
  createdAt: string;
}

/**
 * Public guest tracking inquiry result.
 */
export interface PublicTicketTracking {
  ticketId: number;
  ticketCode: string;
  status: TicketStatus;
  ticketType: TicketType;
  receivedAt: string;
  completedAt?: string | null;
  issueDescription: string;
  faultCause?: string | null;
  repairSolution?: string | null;
  estimatedCost: number;
  device: {
    deviceName: string;
    deviceType?: string | null;
    brand?: string | null;
    serialNumber?: string | null;
  };
  customer: {
    fullName: string;
    maskedPhone: string;
  };
  technician?: {
    fullName: string;
  } | null;
  invoices: {
    id: number;
    status: InvoiceStatus;
    laborFee: number;
    discountAmount: number;
    totalAmount: number;
    paymentMethod?: PaymentMethod | null;
    paidAt?: string | null;
  }[];
}

/**
 * Executive dashboard overview metrics.
 */
export interface DashboardSummary {
  overview: {
    totalTickets: number;
    activeTickets: number;
    completedTickets: number;
    deliveredTickets: number;
    totalCustomers: number;
    totalRevenue: number;
    lowStockPartsCount: number;
  };
  distribution: {
    byStatus: Record<string, number>;
    byType: Record<string, number>;
  };
  monthlyTrends?: {
    month: string;
    tickets: number;
    revenue: number;
  }[];
  topParts?: {
    id: number;
    partName: string;
    unit: string;
    totalQuantity: number;
    totalAmount: number;
  }[];
}

/**
 * Overdue delayed ticket record from sp_alert_delayed_tickets.
 */
export interface DelayedTicketReport {
  ticket_id: number;
  customer_name: string;
  phone_number: string;
  device_name: string;
  status: TicketStatus;
  overdue_days: number;
  assigned_technician: string | null;
}

export type DelayedTicket = DelayedTicketReport;
export type PublicTicketDetail = PublicTicketTracking;
