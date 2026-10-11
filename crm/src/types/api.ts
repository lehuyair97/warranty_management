import { EmployeeRole, InvoiceStatus, PaymentMethod, TicketStatus, TicketType } from './index';

/**
 * Standard pagination metadata structure.
 */
export interface PaginationMeta {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Standard generic wrapper for paginated collections.
 */
export interface PaginatedData<T> {
  items: T[];
  meta: PaginationMeta;
}

/**
 * Successful single/object API response payload.
 * When meta is absent, TypeScript narrows data to single entity T.
 */
export interface SingleSuccessResponse<T> {
  success: true;
  statusCode: number;
  message: string;
  data: T;
  meta?: never;
  timestamp: string;
}

/**
 * Successful paginated collection API response payload.
 * When meta is present, TypeScript narrows data to collection T[] and guarantees PaginationMeta.
 */
export interface PaginatedSuccessResponse<T> {
  success: true;
  statusCode: number;
  message: string;
  data: T[];
  meta: PaginationMeta;
  timestamp: string;
}

/**
 * Standardized API error payload contract.
 * Uses discriminated literal type `success: false`.
 */
export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  error?: string;
  errors?: Record<string, string[]>;
  timestamp: string;
  path?: string;
}

/**
 * Backward-compatible alias for single success envelope.
 */
export type ApiSuccessResponse<T> = SingleSuccessResponse<T>;

/**
 * Smart Discriminated Union for all API responses.
 *
 * Automatic Type Narrowing:
 * 1. if (!res.success) => ApiErrorResponse (access res.message, res.error)
 * 2. if (res.success && res.meta) => PaginatedSuccessResponse<T> (res.data is T[], res.meta is PaginationMeta)
 * 3. if (res.success && !res.meta) => SingleSuccessResponse<T> (res.data is T, res.meta is never)
 */
export type BaseResponse<T> =
  | SingleSuccessResponse<T>
  | PaginatedSuccessResponse<T>
  | ApiErrorResponse;

export type ApiResponse<T> = BaseResponse<T>;

/**
 * Explicit semantic aliases for specific response shapes.
 */
export type PaginatedResponse<T> = PaginatedSuccessResponse<T> | ApiErrorResponse;
export type SingleResponse<T> = SingleSuccessResponse<T> | ApiErrorResponse;

/**
 * Standard base pagination & sorting query parameters.
 */
export interface BasePaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * Query filter parameters for tickets list.
 */
export interface TicketQueryParams extends BasePaginationParams {
  status?: TicketStatus | string;
  ticketType?: TicketType;
  technicianId?: number;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Query filter parameters for parts inventory.
 */
export interface PartQueryParams extends BasePaginationParams {
  lowStockOnly?: boolean;
}

/**
 * Query filter parameters for invoices list.
 */
export interface InvoiceQueryParams extends BasePaginationParams {
  status?: InvoiceStatus | string;
  paymentMethod?: PaymentMethod | string;
}

/**
 * Query filter parameters for employees list.
 */
export interface EmployeeQueryParams extends BasePaginationParams {
  role?: EmployeeRole;
  isActive?: boolean;
}

/**
 * Query filter parameters for customer lookup and list.
 */
export interface CustomerQueryParams extends BasePaginationParams {
  phone?: string;
  name?: string;
}

/**
 * Query parameters for overdue delayed tickets report.
 */
export interface DelayedTicketsQueryParams {
  delayDays?: number;
}

/**
 * Guest public ticket tracking query payload.
 */
export interface PublicTrackingQueryDto {
  ticketCode: string;
  phoneNumber: string;
}

/**
 * Authentication request payload.
 */
export interface LoginCredentialsDto {
  username: string;
  password: string;
}

/**
 * Authentication response payload data.
 */
export interface LoginResponseData {
  user: {
    id: number;
    username: string;
    fullName: string;
    role: EmployeeRole;
    phoneNumber?: string | null;
    email?: string | null;
  };
  accessToken: string;
}

/**
 * Update authenticated user profile payload.
 */
export interface UpdateProfileDto {
  fullName?: string;
  phoneNumber?: string;
  email?: string;
  currentPassword?: string;
  password?: string;
}

/**
 * Create ticket request payload.
 */
export interface CreateTicketDto {
  deviceId: number;
  issueDescription: string;
  ticketType: TicketType | 'repair' | 'warranty' | 're_repair';
  initialCondition?: string | null;
  accessories?: string | null;
  estimatedCost?: number;
}

/**
 * Assign technician request payload.
 */
export interface AssignTechnicianDto {
  technicianId: number;
}

/**
 * Ticket status transition & inspection payload.
 */
export interface ProcessTicketDto {
  status: TicketStatus;
  faultCause?: string | null;
  repairSolution?: string | null;
  estimatedCost?: number;
}

/**
 * Customer creation payload.
 */
export interface CreateCustomerDto {
  fullName: string;
  phoneNumber: string;
  email?: string | null;
  address?: string | null;
}

/**
 * Device registration payload.
 */
export interface CreateDeviceDto {
  customerId: number;
  deviceName: string;
  deviceType?: string | null;
  brand?: string | null;
  serialNumber?: string | null;
  isUnderWarranty?: boolean;
  warrantyExpiryDate?: string | null;
}

/**
 * Device update payload.
 */
export type UpdateDeviceDto = Partial<CreateDeviceDto>;

/**
 * Spare part creation payload.
 */
export interface CreatePartDto {
  partName: string;
  partCode: string;
  stockQuantity: number;
  price: number;
  unit: string;
}

/**
 * Spare part update payload.
 */
export type UpdatePartDto = Partial<CreatePartDto>;

/**
 * Invoice creation payload.
 */
export interface CreateInvoiceDto {
  ticketId: number;
  laborFee?: number;
  discountAmount?: number;
}

/**
 * Add spare part to invoice payload.
 */
export interface AddInvoicePartDto {
  partId: number;
  quantity: number;
}

/**
 * Checkout invoice payload.
 */
export interface CheckoutInvoiceDto {
  paymentMethod: PaymentMethod | string;
}

/**
 * Employee account creation payload.
 */
export interface CreateEmployeeDto {
  username: string;
  password?: string;
  fullName: string;
  role: EmployeeRole;
  phoneNumber?: string | null;
  email?: string | null;
}

/**
 * Employee account update payload.
 */
export interface UpdateEmployeeDto {
  fullName?: string;
  role?: EmployeeRole;
  phoneNumber?: string | null;
  email?: string | null;
  password?: string;
  isActive?: boolean;
}

/**
 * Invoice audit payload and result.
 */
export interface AuditInvoicesDto {
  autoFix?: boolean;
}

export interface AuditInvoicesResult {
  discrepanciesFound: number;
  wasAutoFixed: boolean;
}

/**
 * Database backup file metadata.
 */
export interface BackupItem {
  fileName: string;
  sizeMb: number;
  createdAt: string;
}

/**
 * Result of native SQL Server full database backup.
 */
export interface BackupDatabaseResult {
  fileName: string;
  backupPath: string;
  createdAt: string;
}

/**
 * Result of native database restore operation.
 */
export interface RestoreDatabaseResult {
  message: string;
  restoredFrom: string;
}

/**
 * Result of bulk data import operation.
 */
export interface BulkImportResult {
  rowsAffected: number;
  totalRowsRead: number;
}

/**
 * Safe helper to extract error message from unknown catch variables without any.
 */
export function getErrorMessage(error: unknown, fallback: string = 'Đã có lỗi xảy ra'): string {
  if (typeof error === 'object' && error !== null) {
    if ('message' in error) {
      const msg = (error as { message: unknown }).message;
      if (typeof msg === 'string') return msg;
      if (Array.isArray(msg) && typeof msg[0] === 'string') return msg.join(', ');
    }
  }
  return fallback;
}
