import { api } from '@/lib/axios';
import {
  AssignTechnicianDto,
  CreateTicketDto,
  PaginatedData,
  ProcessTicketDto,
  PublicTicketTracking,
  PublicTrackingQueryDto,
  Ticket,
  TicketQueryParams,
} from '@/types';

/**
 * Tickets Management & Public Tracking Service.
 * Encapsulates ticket operations, status transitions, and public guest queries.
 */
export const ticketsService = {
  /**
   * Retrieves a paginated list of repair/warranty tickets with optional filters.
   */
  async getTickets(params?: TicketQueryParams): Promise<PaginatedData<Ticket>> {
    return api.get<PaginatedData<Ticket>>(
      '/tickets',
      params as unknown as Record<string, unknown>,
    );
  },

  /**
   * Retrieves full details for a single ticket by its numerical ID.
   */
  async getTicketById(id: number): Promise<Ticket> {
    return api.get<Ticket>(`/tickets/${id}`);
  },

  /**
   * Creates a new warranty or repair ticket.
   */
  async createTicket(dto: CreateTicketDto): Promise<Ticket> {
    return api.post<Ticket, CreateTicketDto>('/tickets', dto);
  },

  /**
   * Assigns or delegates a technician to an existing ticket.
   */
  async assignTechnician(ticketId: number, dto: AssignTechnicianDto): Promise<Ticket> {
    return api.patch<Ticket, AssignTechnicianDto>(
      `/tickets/${ticketId}/assign-technician`,
      dto,
    );
  },

  /**
   * Transitions ticket status, updates diagnosis, or completes repair.
   */
  async processTicket(ticketId: number, dto: ProcessTicketDto): Promise<Ticket> {
    return api.patch<Ticket, ProcessTicketDto>(`/tickets/${ticketId}/process`, dto);
  },

  /**
   * Public guest tracking lookup by ticket code and registered customer phone number.
   */
  async trackPublicTicket(dto: PublicTrackingQueryDto): Promise<PublicTicketTracking> {
    return api.get<PublicTicketTracking>(
      '/tickets/public/track',
      dto as unknown as Record<string, unknown>,
    );
  },

  /**
   * Deletes a repair ticket and its unpaid invoices.
   */
  async deleteTicket(ticketId: number): Promise<{ success: boolean; message: string }> {
    return api.delete<{ success: boolean; message: string }>(`/tickets/${ticketId}`);
  },
};
