import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/common/constants';
import { reportsService } from '@/services/reports.service';

/**
 * Hook to retrieve executive dashboard metrics and chart summaries.
 */
export function useDashboardSummary() {
  return useQuery({
    queryKey: queryKeys.reports.dashboard(),
    queryFn: () => reportsService.getDashboardSummary(),
  });
}

/**
 * Hook to retrieve overdue delayed tickets alert.
 */
export function useDelayedTickets(delayDays: number = 14) {
  return useQuery({
    queryKey: queryKeys.reports.delayedTickets(delayDays),
    queryFn: () => reportsService.getDelayedTickets({ delayDays }),
  });
}

/**
 * Hook to trigger invoice discrepancy audit and optional auto-remediation.
 */
export function useAuditInvoices() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (autoFix: boolean = false) =>
      reportsService.auditInvoices({ autoFix }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
    },
  });
}
