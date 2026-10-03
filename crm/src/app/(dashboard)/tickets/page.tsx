'use client';

import React, { useMemo } from 'react';
import { IconFileText } from '@/assets/icon';
import { DataTable, PageContainer, PageHeader } from '@/components/core';
import { Badge } from '@/components/ui/badge';
import { TicketDetailModal } from '@/features/tickets/components/TicketDetailModal';
import { TicketsFilterToolbar } from '@/features/tickets/components/TicketsFilterToolbar';
import { getTicketDirectoryColumns } from '@/features/tickets/config/tickets.columns';
import { useTicketsDirectory } from '@/features/tickets/hooks/useTicketsDirectory';

/**
 * Tickets Directory Controller Screen (~60 lines)
 * Pure View Orchestrator delegating state and logic to useTicketsDirectory and feature components.
 */
export default function TicketsDirectoryPage() {
  const {
    tickets,
    isLoading,
    refetch,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    searchTerm,
    setSearchTerm,
    isFiltered,
    resetFilters,
    page,
    setPage,
    pageSize,
    totalPages,
    totalItems,
    selectedTicket,
    detailModalOpen,
    setDetailModalOpen,
    handleOpenDetail,
    statusOptions,
    typeOptions,
  } = useTicketsDirectory();

  const columns = useMemo(
    () =>
      getTicketDirectoryColumns({
        onOpenDetail: handleOpenDetail,
      }),
    [handleOpenDetail],
  );

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title="Tra Cứu & Quản Lý Phiếu Dịch Vụ"
        description="Toàn bộ danh sách phiếu tiếp nhận, sửa chữa, trạng thái và tiến độ xử lý thiết bị."
        badge={
          <Badge variant="outline" size="sm">
            <IconFileText className="w-3.5 h-3.5" />
            {totalItems} Phiếu
          </Badge>
        }
        onRefresh={refetch}
        isRefreshing={isLoading}
      />

      {/* Feature Filter Toolbar */}
      <TicketsFilterToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={statusOptions}
        typeFilter={typeFilter}
        onTypeChange={setTypeFilter}
        typeOptions={typeOptions}
        isFiltered={isFiltered}
        onResetFilters={resetFilters}
      />

      {/* Main Data Table */}
      <DataTable
        columns={columns}
        data={tickets}
        isLoading={isLoading}
        emptyMessage="Không tìm thấy phiếu nào phù hợp với điều kiện lọc."
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setPage}
        className="flex-1"
      />

      {/* Detail Drawer Modal */}
      <TicketDetailModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        ticket={selectedTicket}
      />
    </PageContainer>
  );
}
