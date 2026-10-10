'use client';

import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { IconDownload, IconFileText } from '@/assets/icon';
import { DataTable, PageContainer, PageHeader } from '@/components/core';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InvoiceDetailModal } from '@/features/invoices/components/InvoiceDetailModal';
import { InvoicesFilterToolbar } from '@/features/invoices/components/InvoicesFilterToolbar';
import { getInvoiceColumns } from '@/features/invoices/config/invoices.columns';
import { api } from '@/lib/api-client';
import { databaseAdminService } from '@/services/database-admin.service';
import { uiActions } from '@/stores/ui.store';
import { Invoice, PaginationMeta } from '@/types';

/**
 * Invoices Directory Screen (~70 lines).
 * Thin Screen orchestrator matching Tickets and Inventory layout standards.
 */
export default function InvoicesPage() {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const { data, isLoading, refetch } = useQuery<{ items: Invoice[]; meta: PaginationMeta }>({
    queryKey: ['invoices', page, pageSize, searchTerm],
    queryFn: async () => {
      const params: Record<string, unknown> = { page, limit: pageSize };
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      return api.get<{ items: Invoice[]; meta: PaginationMeta }>('/invoices', params);
    },
  });

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await databaseAdminService.exportTable('invoices', 'csv');
      uiActions.addToast({
        type: 'success',
        title: 'Xuất dữ liệu thành công',
        message: 'File danh sách hóa đơn đang được tải về thiết bị của bạn.',
      });
    } catch (err) {
      uiActions.addToast({
        type: 'error',
        title: 'Lỗi xuất dữ liệu',
        message: (err as Error).message || 'Không thể xuất danh sách hóa đơn!',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const columns = useMemo(
    () =>
      getInvoiceColumns({
        onOpenDetail: (inv) => setSelectedInvoiceId(inv.id),
      }),
    [],
  );

  const totalItems = data?.meta?.totalItems ?? data?.items?.length ?? 0;
  const totalPages = data?.meta?.totalPages ?? 1;

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title="Danh Sách Hóa Đơn & Biên Lai"
        description="Quản lý và tra cứu toàn bộ lịch sử hóa đơn thanh toán, biên lai dịch vụ sửa chữa."
        badge={
          <Badge variant="outline" size="sm">
            <IconFileText className="w-3.5 h-3.5" />
            {totalItems} Hóa đơn
          </Badge>
        }
        onRefresh={refetch}
        isRefreshing={isLoading}
        actions={
          <Button
            variant="outline"
            size="sm"
            leftIcon={<IconDownload className="w-4 h-4" />}
            onClick={handleExport}
            isLoading={isExporting}
          >
            Xuất Excel
          </Button>
        }
      />

      {/* Filter Toolbar */}
      <InvoicesFilterToolbar
        searchTerm={searchTerm}
        onSearchChange={(val) => {
          setSearchTerm(val);
          setPage(1);
        }}
        onReset={() => {
          setSearchTerm('');
          setPage(1);
        }}
      />

      {/* Main Data Table */}
      <DataTable<Invoice>
        columns={columns}
        data={data?.items || []}
        isLoading={isLoading}
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setPage}
        emptyMessage="Không tìm thấy hóa đơn nào phù hợp với điều kiện tìm kiếm."
        className="flex-1"
      />

      {/* Detail Modal */}
      {selectedInvoiceId && (
        <InvoiceDetailModal
          invoiceId={selectedInvoiceId}
          isOpen={!!selectedInvoiceId}
          onClose={() => setSelectedInvoiceId(null)}
        />
      )}
    </PageContainer>
  );
}
