'use client';

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { formatVND } from '@/common/helpers/currency.helper';
import { formatTicketCode } from '@/common/helpers/ticket.helper';
import { BaseModal } from '@/components/core/BaseModal';
import { Select } from '@/components/ui/select';
import { CheckoutFormValues } from '@/schemas/checkout.schema';
import { Invoice, PaymentMethod } from '@/types';

interface InvoiceCheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
  form: UseFormReturn<CheckoutFormValues>;
  onSubmit: (values: CheckoutFormValues) => void;
  isLoading: boolean;
}

export const InvoiceCheckoutModal: React.FC<InvoiceCheckoutModalProps> = ({
  open,
  onOpenChange,
  invoice,
  form,
  onSubmit,
  isLoading,
}) => {
  const { register, handleSubmit } = form;

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title={`Xác nhận thanh toán: Hóa đơn #${invoice?.id}`}
      description="Kiểm tra bảng kê chi phí linh kiện & nhân công trước khi xác nhận tất toán."
      primaryActionLabel="Xác nhận thanh toán & Trả máy"
      onPrimaryAction={handleSubmit(onSubmit)}
      isPrimaryActionLoading={isLoading}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {/* Customer & Ticket Info */}
        <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs grid grid-cols-2 gap-2">
          <div>
            <span className="text-stone-500 block">Khách hàng:</span>
            <span className="font-semibold text-stone-900">
              {invoice?.ticket?.device?.customer?.fullName}
            </span>
          </div>
          <div>
            <span className="text-stone-500 block">Phiếu sửa chữa:</span>
            <span className="font-mono font-bold text-amber-900">
              {invoice ? formatTicketCode(invoice.ticketId) : ''}
            </span>
          </div>
        </div>

        {/* Invoice Item Breakdown */}
        <div className="border border-stone-200 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-100 border-b border-stone-200 text-stone-600 font-semibold">
              <tr>
                <th className="p-2.5">Hạng mục</th>
                <th className="p-2.5 text-center">SL</th>
                <th className="p-2.5 text-right">Đơn giá</th>
                <th className="p-2.5 text-right">Thành tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              <tr>
                <td className="p-2.5 font-medium text-stone-900">
                  Tiền công kỹ thuật & chẩn đoán
                </td>
                <td className="p-2.5 text-center">1</td>
                <td className="p-2.5 text-right">
                  {formatVND(Number(invoice?.laborFee || 0))}
                </td>
                <td className="p-2.5 text-right font-medium text-stone-900">
                  {formatVND(Number(invoice?.laborFee || 0))}
                </td>
              </tr>
              {invoice?.items?.map((item, idx) => (
                <tr key={idx}>
                  <td className="p-2.5">
                    <span className="font-medium text-stone-900 block">
                      {item.part?.partName}
                    </span>
                    <span className="text-[10px] font-mono text-stone-400">
                      {item.part?.partCode}
                    </span>
                  </td>
                  <td className="p-2.5 text-center">{item.quantity}</td>
                  <td className="p-2.5 text-right">
                    {formatVND(Number(item.unitPrice))}
                  </td>
                  <td className="p-2.5 text-right font-medium text-stone-900">
                    {formatVND(Number(item.unitPrice) * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="p-3 bg-stone-50 border-t border-stone-200 flex justify-between items-center text-sm font-bold">
            <span className="text-stone-900">TỔNG CỘNG THANH TOÁN:</span>
            <span className="text-lg text-amber-700">
              {formatVND(Number(invoice?.totalAmount || 0))}
            </span>
          </div>
        </div>

        <Select
          label="Phương thức thu tiền"
          {...register('paymentMethod')}
          options={[
            { value: PaymentMethod.CASH, label: 'Tiền mặt (Cash)' },
            { value: PaymentMethod.BANK_TRANSFER, label: 'Chuyển khoản VietQR / Banking' },
            { value: PaymentMethod.CREDIT_CARD, label: 'Quẹt thẻ tín dụng / POS Card' },
          ]}
        />
      </form>
    </BaseModal>
  );
};
