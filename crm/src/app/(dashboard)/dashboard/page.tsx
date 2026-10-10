'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { IconShieldAlert } from '@/assets/icon';
import { PageContainer, PageHeader } from '@/components/core';
import { Button } from '@/components/ui/button';
import { DashboardKpiGrid } from '@/features/dashboard/components/DashboardKpiGrid';
import { DelayedTicketsCard } from '@/features/dashboard/components/DelayedTicketsCard';
import { InvoiceAuditModal } from '@/features/dashboard/components/InvoiceAuditModal';
import { RevenueTrendAreaChart } from '@/features/dashboard/components/RevenueTrendAreaChart';
import { TicketStatusDonutChart } from '@/features/dashboard/components/TicketStatusDonutChart';
import { TopPartsLeaderboardCard } from '@/features/dashboard/components/TopPartsLeaderboardCard';
import { getDelayedTicketColumns } from '@/features/dashboard/config/delayed-tickets.columns';
import { useExecutiveDashboard } from '@/features/dashboard/hooks/useExecutiveDashboard';

/**
 * Executive Dashboard Controller Screen
 * Pure View Orchestrator delegating state and logic to useExecutiveDashboard and feature components.
 */
export default function DashboardPage() {
  const router = useRouter();
  const {
    summary,
    delayedTickets,
    isLoading,
    isManager,
    auditModalOpen,
    setAuditModalOpen,
    autoFixChecked,
    setAutoFixChecked,
    auditResult,
    handleRunAudit,
    handleRefreshAll,
    isAuditing,
  } = useExecutiveDashboard();

  const delayedColumns = useMemo(
    () =>
      getDelayedTicketColumns({
        onOpenDetail: (ticket) => router.push(`/tickets?search=${ticket.ticket_id}`),
      }),
    [router],
  );

  return (
    <PageContainer fitScreen={false}>
      {/* Header */}
      <PageHeader
        title="Tổng Quan Điều Hành (Executive Dashboard)"
        description="Báo cáo KPI thời gian thực, tiến độ bảo hành và số liệu doanh thu."
        onRefresh={handleRefreshAll}
        isRefreshing={isLoading}
        actions={
          isManager && (
            <Button
              size="sm"
              onClick={() => setAuditModalOpen(true)}
              leftIcon={<IconShieldAlert className="w-4 h-4" />}
            >
              Đối soát hóa đơn
            </Button>
          )
        }
      />

      {/* KPI Cards Grid Component with Animated Count-Up */}
      <DashboardKpiGrid summary={summary} />

      {/* Interactive Charts: Dual-axis Trend & Status Lifecycle Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RevenueTrendAreaChart monthlyTrends={summary?.monthlyTrends} />
        <TicketStatusDonutChart
          distribution={summary?.distribution?.byStatus}
          activeCount={summary?.overview?.activeTickets}
        />
      </div>

      {/* Top Consumed Parts & Top Active Technicians Leaderboard */}
      <TopPartsLeaderboardCard
        topParts={summary?.topParts}
        topTechnicians={summary?.topTechnicians}
      />

      {/* Delayed Tickets Alert Table Component */}
      <DelayedTicketsCard
        columns={delayedColumns}
        delayedTickets={delayedTickets}
        isLoading={isLoading}
      />

      {/* Feature Audit Modal */}
      <InvoiceAuditModal
        open={auditModalOpen}
        onOpenChange={setAuditModalOpen}
        autoFixChecked={autoFixChecked}
        onAutoFixChange={setAutoFixChecked}
        onRunAudit={handleRunAudit}
        isLoading={isAuditing}
        auditResult={auditResult}
      />
    </PageContainer>
  );
}
