'use client';

import { yupResolver } from '@hookform/resolvers/yup';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { formatTicketCode } from '@/common/helpers/ticket.helper';
import { useCheckoutInvoice, useInvoices } from '@/hooks/useInvoices';
import { CheckoutFormValues, checkoutSchema } from '@/schemas/checkout.schema';
import { uiActions } from '@/stores/ui.store';
import { getErrorMessage, Invoice, InvoiceQueryParams, PaymentMethod } from '@/types';

export function useCashierBilling() {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);

  const handleFilterStatusChange = (status: string) => {
    setFilterStatus(status);
    setPage(1);
  };

  const queryParams: InvoiceQueryParams = useMemo(() => {
    const params: InvoiceQueryParams = { page, limit: pageSize };
    if (filterStatus) params.status = filterStatus;
    return params;
  }, [filterStatus, page, pageSize]);

  const { data: invoicesData, isLoading, refetch } = useInvoices(queryParams);
  const checkoutMutation = useCheckoutInvoice();

  const checkoutForm = useForm<CheckoutFormValues>({
    resolver: yupResolver(checkoutSchema),
    defaultValues: {
      paymentMethod: PaymentMethod.CASH,
    },
  });

  const handleOpenCheckout = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setCheckoutModalOpen(true);
  };

  const handleViewReceipt = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setReceiptModalOpen(true);
  };

  const onCheckoutSubmit = async (values: CheckoutFormValues) => {
    if (!selectedInvoice) return;

    try {
      const updated = await checkoutMutation.mutateAsync({
        invoiceId: selectedInvoice.id,
        paymentMethod: values.paymentMethod,
      });

      setSelectedInvoice(updated);
      setCheckoutModalOpen(false);
      setReceiptModalOpen(true);

      uiActions.addToast({
        type: 'success',
        title: 'Thanh toán thành công!',
        message: `Hóa đơn #${updated.id} đã hoàn tất. Phiếu sửa chữa #${formatTicketCode(
          updated.ticketId,
        )} được tự động chuyển sang: ĐÃ TRẢ KHÁCH (DELIVERED).`,
      });
    } catch (err: unknown) {
      uiActions.addToast({
        type: 'error',
        title: 'Thanh toán thất bại',
        message: getErrorMessage(err, 'Thanh toán thất bại. Vui lòng thử lại.'),
      });
    }
  };

  const invoices = invoicesData?.items || [];
  const totalPages = invoicesData?.meta?.totalPages || 1;
  const totalItems = invoicesData?.meta?.totalItems !== undefined ? invoicesData.meta.totalItems : invoices.length;

  return {
    invoices,
    isLoading,
    refetch,
    filterStatus,
    setFilterStatus: handleFilterStatusChange,
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
    isCheckingOut: checkoutMutation.isPending,
  };
}
