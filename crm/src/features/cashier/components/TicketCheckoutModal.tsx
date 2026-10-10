'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BaseModal } from '@/components/core/BaseModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { api } from '@/lib/api-client';
import { uiActions } from '@/stores/ui.store';
import { Ticket } from '@/types';

interface TicketCheckoutModalProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TicketCheckoutModal({ ticket, isOpen, onClose }: TicketCheckoutModalProps) {
  const queryClient = useQueryClient();
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [laborFee, setLaborFee] = useState<number>(ticket?.estimatedCost || 0);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!ticket) return;
      return api.post<{ invoice_id: number }>(`/tickets/${ticket.id}/checkout`, {
        laborFee: Number(laborFee),
        paymentMethod,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      uiActions.addToast({
        type: 'success',
        title: 'Thanh toán thành công',
        message: `Đã tạo hóa đơn INV-${(data?.invoice_id || '').toString().padStart(5, '0')}`,
      });
      onClose();
    },
    onError: (error: Error) => {
      uiActions.addToast({
        type: 'error',
        title: 'Lỗi thanh toán',
        message: error?.message || 'Có lỗi xảy ra trong quá trình thanh toán!',
      });
    },
  });

  const paymentOptions = [
    { value: 'cash', label: 'Tiền mặt' },
    { value: 'bank_transfer', label: 'Chuyển khoản' },
    { value: 'credit_card', label: 'Thẻ tín dụng' },
  ];

  return (
    <BaseModal
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title="Thanh Toán & Xuất Hóa Đơn"
      description={`Phiếu sửa chữa TCK-${ticket?.id?.toString().padStart(5, '0')} - ${ticket?.device?.customer?.fullName || 'Khách hàng'}`}
      size="md"
      footerContent={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button variant="outline" size="sm" onClick={onClose} disabled={mutation.isPending}>
            Hủy
          </Button>
          <Button
            size="sm"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            isLoading={mutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Xác nhận thanh toán
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 py-2">
        <Input
          label="Phí dịch vụ / Công sửa chữa (VNĐ)"
          type="number"
          value={laborFee}
          onChange={(e) => setLaborFee(Number(e.target.value))}
        />
        <Select
          label="Phương thức thanh toán"
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          options={paymentOptions}
        />
      </div>
    </BaseModal>
  );
}
