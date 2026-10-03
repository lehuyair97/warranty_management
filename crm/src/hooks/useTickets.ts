import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/common/constants';
import { ticketsService } from '@/services/tickets.service';
import {
  AssignTechnicianDto,
  CreateTicketDto,
  ProcessTicketDto,
  TicketQueryParams,
} from '@/types';

/**
 * Hook to retrieve a paginated list of tickets.
 */
export function useTickets(params?: TicketQueryParams) {
  return useQuery({
    queryKey: queryKeys.tickets.list(params),
    queryFn: () => ticketsService.getTickets(params),
  });
}

/**
 * Hook to retrieve single ticket details by ID.
 */
export function useTicketDetail(id?: number) {
  return useQuery({
    queryKey: queryKeys.tickets.detail(id as number),
    queryFn: () => ticketsService.getTicketById(id as number),
    enabled: typeof id === 'number' && !isNaN(id),
  });
}

/**
 * Hook to create a new ticket.
 */
export function useCreateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateTicketDto) => ticketsService.createTicket(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
    },
  });
}

/**
 * Hook to assign or update the assigned technician.
 */
export function useAssignTechnician() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      ticketId,
      ...dto
    }: {
      ticketId: number;
    } & AssignTechnicianDto) => ticketsService.assignTechnician(ticketId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
    },
  });
}

/**
 * Hook to transition ticket status, diagnose, or mark completed.
 */
export function useProcessTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      ticketId,
      ...dto
    }: {
      ticketId: number;
    } & ProcessTicketDto) => ticketsService.processTicket(ticketId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.parts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
    },
  });
}

/**
 * Hook to delete a repair ticket and its unpaid invoices.
 */
export function useDeleteTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ticketId: number) => ticketsService.deleteTicket(ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
    },
  });
}
