'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { IconPrinter } from '@/assets/icon';
import { formatVND } from '@/common/helpers/currency.helper';
import { formatDate } from '@/common/helpers/date.helper';
import { BaseModal } from '@/components/core/BaseModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api-client';
import { Invoice } from '@/types';

interface InvoiceDetailModalProps {
  invoiceId: number;
  isOpen: boolean;
  onClose: () => void;
}

export function InvoiceDetailModal({ invoiceId, isOpen, onClose }: InvoiceDetailModalProps) {
  const { data: invoice, isLoading } = useQuery<Invoice>({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => {
      return api.get<Invoice>(`/invoices/${invoiceId}`);
    },
    enabled: isOpen && !!invoiceId,
  });

  return (
    <BaseModal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title="Chi Tiết Hóa Đơn & Biên Lai"
      description={`Mã tra cứu: INV-${invoiceId.toString().padStart(5, '0')}`}
      size="lg"
      footerContent={
        <div className="flex items-center justify-between w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            leftIcon={<IconPrinter className="w-4 h-4" />}
          >
            In Biên Lai
          </Button>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Đóng
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <div className="flex justify-center py-12 text-stone-500 text-sm">Đang tải chi tiết hóa đơn...</div>
      ) : invoice ? (
        <div className="printable-invoice space-y-6 text-stone-800" id="invoice-print-area">
          {/* Print-Only Business Header */}
          <div className="hidden print:block text-center border-b border-dashed border-stone-300 pb-3 mb-2">
            <h2 className="text-base font-bold uppercase tracking-wider text-stone-900">
              TRUNG TÂM BẢO HÀNH & SỬA CHỮA THIẾT BỊ UIT CARE
            </h2>
            <p className="text-[11px] text-stone-600 mt-0.5">
              Khu phố 6, P. Linh Trung, TP. Thủ Đức, TP.HCM • Hotline: 1900 8198
            </p>
            <p className="text-[11px] text-stone-500 font-mono">
              Website: warranty.uitcare.vn • Email: hotro@uitcare.vn
            </p>
          </div>

          {/* Header info */}
          <div className="grid grid-cols-2 gap-4 text-sm bg-sand-50/60 p-4 rounded-xl border border-sand-200">
            <div>
              <p className="text-xs text-stone-500 font-medium">Mã hóa đơn</p>
              <p className="font-mono font-bold text-base text-stone-900">
                INV-{invoice.id?.toString().padStart(5, '0')}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-stone-500 font-medium">Thời gian xuất hóa đơn</p>
              <p className="font-medium text-stone-800">{formatDate(invoice.createdAt)}</p>
            </div>
          </div>

          {/* Customer & Ticket Info */}
          <div className="grid grid-cols-2 gap-4 text-sm bg-white p-4 rounded-xl border border-sand-200">
            <div>
              <p className="text-xs text-stone-500 font-medium mb-1">Khách hàng</p>
              <p className="font-semibold text-stone-900">{invoice.ticket?.device?.customer?.fullName || 'N/A'}</p>
              <p className="text-xs font-mono text-stone-600">{invoice.ticket?.device?.customer?.phoneNumber || 'N/A'}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-stone-500 font-medium mb-1">Thiết bị sửa chữa</p>
              <p className="font-semibold text-stone-900">{invoice.ticket?.device?.deviceName || 'N/A'}</p>
              <p className="text-xs font-mono text-stone-500">
                Mã phiếu: TCK-{invoice.ticket?.id?.toString().padStart(5, '0')}
              </p>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <h4 className="font-semibold text-stone-900 mb-2 text-sm">Chi tiết phí & Phụ tùng thay thế</h4>
            <div className="border border-sand-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-sand-100 text-stone-700 font-semibold border-b border-sand-200">
                  <tr>
                    <th className="p-2.5">Hạng mục</th>
                    <th className="p-2.5 text-center">SL</th>
                    <th className="p-2.5 text-right">Đơn giá</th>
                    <th className="p-2.5 text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-200">
                  {/* Spare Parts */}
                  {invoice.items && invoice.items.length > 0 ? (
                    invoice.items.map((item) => (
                      <tr key={item.id} className="hover:bg-sand-50/50">
                        <td className="p-2.5 font-medium text-stone-900">{item.part?.partName || 'Linh kiện'}</td>
                        <td className="p-2.5 text-center font-mono">{item.quantity}</td>
                        <td className="p-2.5 text-right font-mono">{formatVND(Number(item.unitPrice))}</td>
                        <td className="p-2.5 text-right font-mono font-semibold">{formatVND(Number(item.totalPrice))}</td>
                      </tr>
                    ))
                  ) : null}
                  {/* Labor Fee */}
                  <tr className="hover:bg-sand-50/50">
                    <td className="p-2.5 font-medium text-stone-900">Tiền công dịch vụ sửa chữa</td>
                    <td className="p-2.5 text-center font-mono">1</td>
                    <td className="p-2.5 text-right font-mono">{formatVND(Number(invoice.laborFee))}</td>
                    <td className="p-2.5 text-right font-mono font-semibold">{formatVND(Number(invoice.laborFee))}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary */}
          <div className="flex justify-end pt-2">
            <div className="w-72 space-y-2 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Tổng tiền hàng & dịch vụ:</span>
                <span className="font-mono">
                  {formatVND(
                    Number(invoice.laborFee) +
                      (invoice.items?.reduce((a, b) => a + Number(b.totalPrice), 0) || 0),
                  )}
                </span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>Giảm giá / Ưu đãi bảo hành:</span>
                <span className="font-mono">- {formatVND(Number(invoice.discountAmount))}</span>
              </div>
              <div className="border-t border-sand-200 my-2" />
              <div className="flex justify-between font-bold text-sm text-emerald-700">
                <span>Thực thanh toán:</span>
                <span className="font-mono text-base">{formatVND(Number(invoice.totalAmount))}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs text-stone-600 pt-2 border-t border-sand-100">
            <span>Phương thức thanh toán:</span>
            <Badge variant="outline" className="font-medium">
              {invoice.paymentMethod === 'cash'
                ? 'Tiền mặt'
                : invoice.paymentMethod === 'bank_transfer'
                  ? 'Chuyển khoản'
                  : invoice.paymentMethod === 'credit_card'
                    ? 'Thẻ tín dụng'
                    : 'Chưa thanh toán'}
            </Badge>
          </div>

          {/* Print-Only Signatures & Terms */}
          <div className="hidden print:block pt-6 border-t border-dashed border-stone-300">
            <div className="text-[11px] text-stone-500 text-center mb-6">
              <p>Linh kiện thay thế được bảo hành tiêu chuẩn 90 ngày kể từ ngày xuất hóa đơn.</p>
              <p>Quý khách vui lòng giữ hóa đơn / biên lai này để đối chiếu khi cần bảo hành.</p>
            </div>
            <div className="grid grid-cols-2 gap-8 text-center text-xs text-stone-800">
              <div>
                <p className="font-bold uppercase tracking-wider">Khách Hàng</p>
                <p className="text-[10px] text-stone-400 italic mt-0.5">(Ký và ghi rõ họ tên)</p>
                <div className="h-16" />
              </div>
              <div>
                <p className="font-bold uppercase tracking-wider">Đại Diện UIT CARE</p>
                <p className="text-[10px] text-stone-400 italic mt-0.5">(Ký và đóng dấu xác nhận)</p>
                <div className="h-16" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-stone-500 text-sm">Không tìm thấy dữ liệu hóa đơn.</div>
      )}
    </BaseModal>
  );
}
