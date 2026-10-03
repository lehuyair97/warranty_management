'use client';

import { useMemo } from 'react';
import { IconWrench } from '@/assets/icon';
import { DataTable, PageContainer, PageHeader } from '@/components/core';
import { Badge } from '@/components/ui/badge';
import { DiagnosisModal } from '@/features/technician/components/DiagnosisModal';
import { TechnicianFilterToolbar } from '@/features/technician/components/TechnicianFilterToolbar';
import { getTechnicianTicketColumns } from '@/features/technician/config/technician-tickets.columns';
import { useTechnicianWorkbench } from '@/features/technician/hooks/useTechnicianWorkbench';

/**
 * Technician Workbench Controller Screen (~60 lines)
 * Pure View Orchestrator delegating state and logic to useTechnicianWorkbench and feature components.
 */
export default function TechnicianWorkbenchPage() {
  const {
    tickets,
    parts,
    technicians,
    user,
    isLoading,
    refetch,
    filterMyTicketsOnly,
    setFilterMyTicketsOnly,
    page,
    setPage,
    pageSize,
    totalPages,
    totalItems,
    selectedTicket,
    selectedTechId,
    setSelectedTechId,
    diagnosisModalOpen,
    setDiagnosisModalOpen,
    diagnosisForm,
    handleClaimTicket,
    handleOpenDiagnosis,
    onDiagnosisSubmit,
    handleAddPartToTicket,
    handleRemovePartFromTicket,
    isAssigning,
    isProcessing,
    isAddingPart,
    isRemovingPart,
  } = useTechnicianWorkbench();

  const columns = useMemo(
    () =>
      getTechnicianTicketColumns({
        user,
        onClaim: handleClaimTicket,
        onOpenDiagnosis: handleOpenDiagnosis,
        isAssigning,
      }),
    [user, handleClaimTicket, handleOpenDiagnosis, isAssigning],
  );

  return (
    <PageContainer>
      {/* Header & Filter Controls */}
      <PageHeader
        title="Bàn Làm Việc Kỹ Thuật Viên"
        description="Chẩn đoán lỗi, nhận phiếu bảo hành, xuất linh kiện và cập nhật tiến độ sửa chữa."
        badge={
          <Badge variant="outline" size="sm">
            <IconWrench className="w-3.5 h-3.5" />
            {totalItems} Phiếu sửa chữa
          </Badge>
        }
        filter={
          <TechnicianFilterToolbar
            filterMyTicketsOnly={filterMyTicketsOnly}
            onChange={setFilterMyTicketsOnly}
          />
        }
        onRefresh={refetch}
        isRefreshing={isLoading}
      />

      {/* Main Data Table */}
      <DataTable
        columns={columns}
        data={tickets}
        isLoading={isLoading}
        emptyMessage="Không có phiếu sửa chữa nào cần xử lý lúc này."
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setPage}
        className="flex-1"
      />

      {/* Feature Modal */}
      <DiagnosisModal
        open={diagnosisModalOpen}
        onOpenChange={setDiagnosisModalOpen}
        ticket={selectedTicket}
        form={diagnosisForm}
        onSubmit={onDiagnosisSubmit}
        isLoading={isProcessing}
        technicians={technicians}
        selectedTechId={selectedTechId}
        onSelectTechnician={setSelectedTechId}
        parts={parts}
        onAddPart={handleAddPartToTicket}
        onRemovePart={handleRemovePartFromTicket}
        isAddingPart={isAddingPart || isRemovingPart}
      />
    </PageContainer>
  );
}
