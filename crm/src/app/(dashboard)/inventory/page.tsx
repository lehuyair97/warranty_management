'use client';

import React, { useMemo, useState } from 'react';
import {
  IconAlertTriangle,
  IconDownload,
  IconPackage,
  IconPlus,
  IconUpload,
} from '@/assets/icon';
import { DataTable, PageContainer, PageHeader } from '@/components/core';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AddPartModal } from '@/features/inventory/components/AddPartModal';
import { EditPartModal } from '@/features/inventory/components/EditPartModal';
import { ImportPartsModal } from '@/features/inventory/components/ImportPartsModal';
import { getPartColumns } from '@/features/inventory/config/parts.columns';
import { useInventoryCatalog } from '@/features/inventory/hooks/useInventoryCatalog';
import { databaseAdminService } from '@/services/database-admin.service';
import { uiActions } from '@/stores/ui.store';

/**
 * Inventory Directory Controller Screen (~70 lines)
 * Orchestrates data table, modals, and business operations cleanly.
 */
export default function InventoryPage() {
  const {
    parts,
    lowStockCount,
    isLoading,
    refetch,
    page,
    setPage,
    pageSize,
    totalPages,
    totalItems,
    isManager,
    form,
    addModalOpen,
    setAddModalOpen,
    editModalOpen,
    setEditModalOpen,
    selectedEditPart,
    handleOpenEdit,
    handleDeletePart,
    onAddSubmit,
    isCreating,
  } = useInventoryCatalog();

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportParts = async () => {
    setIsExporting(true);
    try {
      await databaseAdminService.exportTable('parts', 'csv');
      uiActions.addToast({
        type: 'success',
        title: 'Xuất dữ liệu thành công',
        message: 'File CSV linh kiện đang được tải về thiết bị của bạn.',
      });
    } catch (error) {
      uiActions.addToast({
        type: 'error',
        title: 'Xuất dữ liệu thất bại',
        message: (error as Error).message || 'Có lỗi xảy ra khi xuất dữ liệu!',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const columns = useMemo(
    () =>
      getPartColumns({
        onEdit: handleOpenEdit,
        onDelete: handleDeletePart,
        isManager,
      }),
    [handleOpenEdit, handleDeletePart, isManager],
  );

  return (
    <PageContainer>
      {/* Header & Stats */}
      <PageHeader
        title="Kho Phụ Tùng & Linh Kiện"
        description="Quản lý tồn kho linh kiện thay thế, giá niêm yết và mức cảnh báo dự trữ."
        badge={
          <>
            <Badge variant="outline" size="sm">
              <IconPackage className="w-3.5 h-3.5" />
              {totalItems} Mặt hàng
            </Badge>
            {lowStockCount > 0 && (
              <Badge variant="warning" size="sm">
                <IconAlertTriangle className="w-3.5 h-3.5" />
                {lowStockCount} Sắp hết hàng
              </Badge>
            )}
          </>
        }
        onRefresh={refetch}
        isRefreshing={isLoading}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<IconDownload className="w-4 h-4" />}
              onClick={handleExportParts}
              isLoading={isExporting}
            >
              Xuất CSV
            </Button>
            {isManager && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<IconUpload className="w-4 h-4" />}
                  onClick={() => setImportModalOpen(true)}
                >
                  Nhập CSV (Bulk)
                </Button>
                <Button
                  size="sm"
                  leftIcon={<IconPlus className="w-4 h-4" />}
                  onClick={() => setAddModalOpen(true)}
                >
                  Thêm linh kiện
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* Main Data Table */}
      <DataTable
        columns={columns}
        data={parts}
        isLoading={isLoading}
        emptyMessage="Không có linh kiện nào trong kho."
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setPage}
        className="flex-1"
      />

      {/* Feature Modals */}
      <AddPartModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        form={form}
        onSubmit={onAddSubmit}
        isLoading={isCreating}
      />

      <EditPartModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        part={selectedEditPart}
      />

      <ImportPartsModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onSuccess={refetch}
      />
    </PageContainer>
  );
}
