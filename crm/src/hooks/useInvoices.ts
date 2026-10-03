import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/common/constants';
import { invoicesService } from '@/services/invoices.service';
import {
  AddInvoicePartDto,
  CheckoutInvoiceDto,
  CreateInvoiceDto,
  InvoiceQueryParams,
} from '@/types';

/**
 * Hook to retrieve a paginated list of billing invoices.
 */
export function useInvoices(params?: InvoiceQueryParams) {
  return useQuery({
    queryKey: queryKeys.invoices.list(params),
    queryFn: () => invoicesService.getInvoices(params),
  });
}

/**
 * Hook to retrieve single invoice details by ID.
 */
export function useInvoiceDetail(id?: number) {
  return useQuery({
    queryKey: queryKeys.invoices.detail(id as number),
    queryFn: () => invoicesService.getInvoiceById(id as number),
    enabled: typeof id === 'number' && !isNaN(id),
  });
}

/**
 * Hook to create a new draft invoice.
 */
export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateInvoiceDto) => invoicesService.createInvoice(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
    },
  });
}

/**
 * Hook to add a replacement part line item to an invoice.
 */
export function useAddInvoicePart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      invoiceId,
      ...dto
    }: {
      invoiceId: number;
    } & AddInvoicePartDto) => invoicesService.addInvoicePart(invoiceId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.parts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
    },
  });
}

/**
 * Hook to complete checkout payment for an invoice.
 */
export function useCheckoutInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      invoiceId,
      ...dto
    }: {
      invoiceId: number;
    } & CheckoutInvoiceDto) => invoicesService.checkoutInvoice(invoiceId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.parts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
    },
  });
}

/**
 * Hook to remove a replacement part line item from an invoice.
 */
export function useDeleteInvoicePart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      invoiceId,
      partId,
    }: {
      invoiceId: number;
      partId: number;
    }) => invoicesService.deleteInvoicePart(invoiceId, partId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.parts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
    },
  });
}
