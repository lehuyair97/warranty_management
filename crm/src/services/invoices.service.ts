import { api } from '@/lib/axios';
import {
  AddInvoicePartDto,
  CheckoutInvoiceDto,
  CreateInvoiceDto,
  Invoice,
  InvoiceQueryParams,
  PaginatedData,
} from '@/types';

/**
 * Invoicing & Billing Service.
 * Encapsulates billing creation, attached parts management, and checkout payments.
 */
export const invoicesService = {
  /**
   * Retrieves a paginated list of billing invoices with optional filtering.
   */
  async getInvoices(params?: InvoiceQueryParams): Promise<PaginatedData<Invoice>> {
    return api.get<PaginatedData<Invoice>>(
      '/invoices',
      params as unknown as Record<string, unknown>,
    );
  },

  /**
   * Retrieves full details for a single invoice including line items.
   */
  async getInvoiceById(id: number): Promise<Invoice> {
    return api.get<Invoice>(`/invoices/${id}`);
  },

  /**
   * Creates an initial invoice draft for a given ticket.
   */
  async createInvoice(dto: CreateInvoiceDto): Promise<Invoice> {
    return api.post<Invoice, CreateInvoiceDto>('/invoices', dto);
  },

  /**
   * Appends a replacement spare part to an existing invoice.
   */
  async addInvoicePart(invoiceId: number, dto: AddInvoicePartDto): Promise<Invoice> {
    return api.post<Invoice, AddInvoicePartDto>(
      `/invoices/${invoiceId}/parts`,
      dto,
    );
  },

  /**
   * Removes an attached spare part from an existing invoice.
   */
  async deleteInvoicePart(invoiceId: number, partId: number): Promise<Invoice> {
    return api.delete<Invoice>(`/invoices/${invoiceId}/parts/${partId}`);
  },

  /**
   * Completes payment settlement and marks invoice as PAID.
   */
  async checkoutInvoice(
    invoiceId: number,
    dto: CheckoutInvoiceDto,
  ): Promise<Invoice> {
    return api.post<Invoice, CheckoutInvoiceDto>(
      `/invoices/${invoiceId}/checkout`,
      dto,
    );
  },
};
