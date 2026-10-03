'use client';

import React, { useMemo } from 'react';
import {
  IconAlertTriangle,
  IconPackage,
  IconPlus,
} from '@/assets/icon';
import { DataTable, PageContainer, PageHeader } from '@/components/core';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AddPartModal } from '@/features/inventory/components/AddPartModal';
import { EditPartModal } from '@/features/inventory/components/EditPartModal';
import { getPartColumns } from '@/features/inventory/config/parts.columns';
import { useInventoryCatalog } from '@/features/inventory/hooks/useInventoryCatalog';

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
          isManager && (
            <Button
              size="sm"
              leftIcon={<IconPlus className="w-4 h-4" />}
              onClick={() => setAddModalOpen(true)}
            >
              Thêm linh kiện
            </Button>
          )
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
    </PageContainer>
  );
}
