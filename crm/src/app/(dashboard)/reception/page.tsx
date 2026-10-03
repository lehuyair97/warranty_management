'use client';

import React from 'react';
import { PageContainer, PageHeader } from '@/components/core';
import { ReceptionPosForm } from '@/features/reception/components/ReceptionPosForm';
import { ReceptionSlipModal } from '@/features/reception/components/ReceptionSlipModal';
import { useReceptionDesk } from '@/features/reception/hooks/useReceptionDesk';

/**
 * Reception POS Desk Controller Screen (~50 lines)
 * Pure View Orchestrator delegating state and logic to useReceptionDesk and ReceptionPosForm.
 */
export default function ReceptionPOSPage() {
  const {
    register,
    handleSubmit,
    errors,
    isUnderWarranty,
    existingCustomer,
    isSearchingCustomer,
    createdTicket,
    receiptModalOpen,
    setReceiptModalOpen,
    isSubmitting,
    onSubmit,
  } = useReceptionDesk();

  return (
    <PageContainer spacing="compact">
      {/* Screen Title & Quick Status */}
      <PageHeader
        title="Quầy Tiếp Nhận Thiết Bị (Reception POS)"
        description="Quy trình tiếp nhận 3 bước tích hợp trong một màn hình duy nhất cho quầy dịch vụ."
      />

      {/* Feature Master Form Component */}
      <ReceptionPosForm
        register={register}
        handleSubmit={handleSubmit}
        onSubmit={onSubmit}
        errors={errors}
        isUnderWarranty={isUnderWarranty}
        existingCustomer={existingCustomer ?? null}
        isSearchingCustomer={isSearchingCustomer}
        isSubmitting={isSubmitting}
      />

      {/* Printable Check-in Slip Modal */}
      <ReceptionSlipModal
        open={receiptModalOpen}
        onOpenChange={setReceiptModalOpen}
        ticket={createdTicket}
      />
    </PageContainer>
  );
}
