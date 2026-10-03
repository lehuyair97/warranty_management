'use client';

import React, { useMemo } from 'react';
import { IconPlus, IconUsers } from '@/assets/icon';
import { DataTable, PageContainer, PageHeader } from '@/components/core';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AddEmployeeModal } from '@/features/employees/components/AddEmployeeModal';
import { EditEmployeeModal } from '@/features/employees/components/EditEmployeeModal';
import { getEmployeeColumns } from '@/features/employees/config/employees.columns';
import { useEmployeeRoster } from '@/features/employees/hooks/useEmployeeRoster';

/**
 * Employees Management Controller Screen (~70 lines)
 * Pure View Orchestrator delegating state and logic to useEmployeeRoster.
 */
export default function EmployeesPage() {
  const {
    employees,
    isLoading,
    refetch,
    page,
    setPage,
    pageSize,
    totalPages,
    totalItems,
    isManager,
    currentUserId,
    form,
    addModalOpen,
    setAddModalOpen,
    editModalOpen,
    setEditModalOpen,
    selectedEmployee,
    onAddSubmit,
    handleOpenEdit,
    handleToggleActive,
    isCreating,
  } = useEmployeeRoster();

  const columns = useMemo(
    () =>
      getEmployeeColumns({
        onEdit: handleOpenEdit,
        onToggleActive: handleToggleActive,
        currentUserId,
        isManager,
      }),
    [handleOpenEdit, handleToggleActive, currentUserId, isManager],
  );

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title="Danh Sách Nhân Sự & Phân Quyền"
        description="Quản lý tài khoản đăng nhập nội bộ, vai trò và trạng thái hoạt động của nhân viên."
        badge={
          <Badge variant="outline" size="sm">
            <IconUsers className="w-3.5 h-3.5" />
            {totalItems} Nhân viên
          </Badge>
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
              Thêm nhân viên
            </Button>
          )
        }
      />

      {/* Main Data Table */}
      <DataTable
        columns={columns}
        data={employees}
        isLoading={isLoading}
        emptyMessage="Không có dữ liệu nhân viên."
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setPage}
        className="flex-1"
      />

      {/* Feature Modals */}
      <AddEmployeeModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        form={form}
        onSubmit={onAddSubmit}
        isLoading={isCreating}
      />

      <EditEmployeeModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        employee={selectedEmployee}
      />
    </PageContainer>
  );
}
