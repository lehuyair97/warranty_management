'use client';

import React, { useMemo } from 'react';
import { IconCreditCard } from '@/assets/icon';
import { DataTable, PageContainer, PageHeader } from '@/components/core';
import { Badge } from '@/components/ui/badge';
import { CashierFilterToolbar } from '@/features/cashier/components/CashierFilterToolbar';
import { InvoiceCheckoutModal } from '@/features/cashier/components/InvoiceCheckoutModal';
import { InvoiceReceiptModal } from '@/features/cashier/components/InvoiceReceiptModal';
import { getCashierInvoiceColumns } from '@/features/cashier/config/cashier-invoices.columns';
import { useCashierBilling } from '@/features/cashier/hooks/useCashierBilling';

/**
 * Cashier Billing Controller Screen (~60 lines)
 * Pure View Orchestrator delegating state and logic to useCashierBilling and feature components.
 */
export default function CashierBillingPage() {
  const {
    invoices,
    isLoading,
    refetch,
    filterStatus,
    setFilterStatus,
    page,
    setPage,
    pageSize,
    totalPages,
    totalItems,
    selectedInvoice,
    checkoutModalOpen,
    setCheckoutModalOpen,
    receiptModalOpen,
    setReceiptModalOpen,
    checkoutForm,
    handleOpenCheckout,
    handleViewReceipt,
    onCheckoutSubmit,
    isCheckingOut,
  } = useCashierBilling();

  const columns = useMemo(
    () =>
      getCashierInvoiceColumns({
        onOpenCheckout: handleOpenCheckout,
        onViewReceipt: handleViewReceipt,
      }),
    [handleOpenCheckout, handleViewReceipt],
  );

  return (
    <PageContainer>
      {/* Header & Filter Controls */}
      <PageHeader
        title="Quầy Thu Ngân & Quyết Toán Hóa Đơn"
        description="Quyết toán viện phí dịch vụ sửa chữa, hoàn tất thanh toán và in biên lai giao trả máy."
        badge={
          <Badge variant="outline" size="sm">
            <IconCreditCard className="w-3.5 h-3.5" />
            {totalItems} Hóa đơn
          </Badge>
        }
        filter={
          <CashierFilterToolbar
            status={filterStatus}
            onChange={setFilterStatus}
          />
        }
        onRefresh={refetch}
        isRefreshing={isLoading}
      />

      {/* Main Data Table */}
      <DataTable
        columns={columns}
        data={invoices}
        isLoading={isLoading}
        emptyMessage="Không có hóa đơn nào phù hợp với bộ lọc."
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setPage}
        className="flex-1"
      />

      {/* Feature Modals */}
      <InvoiceCheckoutModal
        open={checkoutModalOpen}
        onOpenChange={setCheckoutModalOpen}
        invoice={selectedInvoice}
        form={checkoutForm}
        onSubmit={onCheckoutSubmit}
        isLoading={isCheckingOut}
      />

      <InvoiceReceiptModal
        open={receiptModalOpen}
        onOpenChange={setReceiptModalOpen}
        invoice={selectedInvoice}
      />
    </PageContainer>
  );
}
