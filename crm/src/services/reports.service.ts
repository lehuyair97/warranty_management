import { api } from '@/lib/axios';
import {
  AuditInvoicesDto,
  AuditInvoicesResult,
  DashboardSummary,
  DelayedTicketReport,
  DelayedTicketsQueryParams,
} from '@/types';

/**
 * Analytics, Auditing & Executive Reports Service.
 * Encapsulates management metrics, overdue alerts, and billing discrepancy audits.
 */
export const reportsService = {
  /**
   * Retrieves high-level operational metrics and status distribution charts.
   */
  async getDashboardSummary(): Promise<DashboardSummary> {
    return api.get<DashboardSummary>('/reports/dashboard');
  },

  /**
   * Retrieves overdue/delayed tickets using the stored procedure sp_alert_delayed_tickets.
   */
  async getDelayedTickets(
    params?: DelayedTicketsQueryParams,
  ): Promise<DelayedTicketReport[]> {
    return api.get<DelayedTicketReport[]>(
      '/reports/delayed-tickets',
      params as unknown as Record<string, unknown>,
    );
  },

  /**
   * Triggers an invoice audit via stored procedure sp_audit_invoices.
   * Optionally auto-fixes math discrepancies when autoFix=true.
   */
  async auditInvoices(dto?: AuditInvoicesDto): Promise<AuditInvoicesResult> {
    return api.post<AuditInvoicesResult, AuditInvoicesDto>(
      '/reports/audit-invoices',
      dto,
    );
  },
};
