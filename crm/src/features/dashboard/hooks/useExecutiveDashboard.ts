'use client';

import { useState } from 'react';
import { useSnapshot } from 'valtio';
import {
  useAuditInvoices,
  useDashboardSummary,
  useDelayedTickets,
} from '@/hooks/useReports';
import { authState } from '@/stores/auth.store';
import { uiActions } from '@/stores/ui.store';
import { EmployeeRole, getErrorMessage } from '@/types';

export function useExecutiveDashboard() {
  const { user } = useSnapshot(authState);
  const isManager = user?.role === EmployeeRole.MANAGER;

  const {
    data: summary,
    isLoading: isSummaryLoading,
    refetch: refetchSummary,
  } = useDashboardSummary();

  const {
    data: delayedTickets,
    isLoading: isDelayedLoading,
    refetch: refetchDelayed,
  } = useDelayedTickets(14);

  const auditMutation = useAuditInvoices();

  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [autoFixChecked, setAutoFixChecked] = useState(false);
  const [auditResult, setAuditResult] = useState<{
    discrepanciesFound: number;
    wasAutoFixed: boolean;
  } | null>(null);

  const handleRunAudit = async () => {
    try {
      const result = await auditMutation.mutateAsync(autoFixChecked);
      setAuditResult(result);

      uiActions.addToast({
        type: result.discrepanciesFound > 0 ? 'warning' : 'success',
        title: 'Đối soát hóa đơn hoàn tất',
        message:
          result.discrepanciesFound > 0
            ? `Phát hiện ${result.discrepanciesFound} hóa đơn sai lệch số dư.${
                result.wasAutoFixed ? ' Đã tự động hiệu chỉnh thành công.' : ''
              }`
            : 'Toàn bộ hóa đơn khớp số dư chính xác!',
      });
    } catch (err: unknown) {
      uiActions.addToast({
        type: 'error',
        title: 'Lỗi chạy đối soát',
        message: getErrorMessage(err, 'Lỗi chạy đối soát'),
      });
    }
  };

  const handleRefreshAll = () => {
    refetchSummary();
    refetchDelayed();
  };

  return {
    summary,
    delayedTickets: delayedTickets || [],
    isLoading: isSummaryLoading || isDelayedLoading,
    isManager,
    auditModalOpen,
    setAuditModalOpen,
    autoFixChecked,
    setAutoFixChecked,
    auditResult,
    handleRunAudit,
    handleRefreshAll,
    isAuditing: auditMutation.isPending,
  };
}
