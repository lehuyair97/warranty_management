'use client';

import React, { useMemo, useState } from 'react';
import { IconDownload, IconFileText, IconUpload } from '@/assets/icon';
import { DataTable, PageContainer, PageHeader } from '@/components/core';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ImportTicketsModal } from '@/features/tickets/components/ImportTicketsModal';
import { TicketDetailModal } from '@/features/tickets/components/TicketDetailModal';
import { TicketsFilterToolbar } from '@/features/tickets/components/TicketsFilterToolbar';
import { getTicketDirectoryColumns } from '@/features/tickets/config/tickets.columns';
import { useTicketsDirectory } from '@/features/tickets/hooks/useTicketsDirectory';
import { databaseAdminService } from '@/services/database-admin.service';
import { uiActions } from '@/stores/ui.store';

/**
 * Tickets Directory Controller Screen (~60 lines)
 * Pure View Orchestrator delegating state and logic to useTicketsDirectory and feature components.
 */
export default function TicketsDirectoryPage() {
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

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

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await databaseAdminService.exportTable('tickets', 'csv');
      uiActions.addToast({
        type: 'success',
        title: 'Xuất dữ liệu thành công',
        message: 'File CSV danh sách phiếu sửa đang được tải về!',
      });
    } catch (err) {
      uiActions.addToast({
        type: 'error',
        title: 'Lỗi xuất dữ liệu',
        message: (err as Error).message || 'Không thể xuất danh sách phiếu sửa!',
      });
    } finally {
      setIsExporting(false);
    }
  };

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
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<IconDownload className="w-4 h-4" />}
              onClick={handleExport}
              isLoading={isExporting}
            >
              Xuất CSV
            </Button>
            <Button
              size="sm"
              leftIcon={<IconUpload className="w-4 h-4" />}
              onClick={() => setImportModalOpen(true)}
            >
              Nhập CSV (Bulk)
            </Button>
          </div>
        }
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

      {/* Bulk Import Tickets Modal */}
      <ImportTicketsModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onSuccess={() => refetch()}
      />
    </PageContainer>
  );
}
