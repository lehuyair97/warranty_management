'use client';

import { formatVND } from '@/common/helpers/currency.helper';
import { formatDateTime } from '@/common/helpers/date.helper';
import { formatTicketCode } from '@/common/helpers/ticket.helper';
import { BaseModal } from '@/components/core/BaseModal';
import { Invoice } from '@/types';

interface InvoiceReceiptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
}

export const InvoiceReceiptModal: React.FC<InvoiceReceiptModalProps> = ({
  open,
  onOpenChange,
  invoice,
}) => {
  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Biên lai thanh toán & Trả máy"
      description={`Mã hóa đơn: INV-#${invoice?.id.toString().padStart(4, '0')}`}
      primaryActionLabel="In hóa đơn"
      onPrimaryAction={() => window.print()}
      size="md"
    >
      <div className="printable-receipt p-6 bg-white border border-stone-200 rounded-2xl space-y-4 text-xs font-mono text-stone-900">
        <div className="text-center border-b border-dashed border-stone-300 pb-3">
          <h2 className="text-base font-bold uppercase tracking-wider">
            TRUNG TÂM BẢO HÀNH UIT CARE
          </h2>
          <p className="text-[11px] text-stone-500 mt-0.5">
            Khu phố 6, P. Linh Trung, TP. Thủ Đức, TP.HCM
          </p>
          <p className="text-[11px] text-stone-500">Hotline: 1900 8198</p>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between">
            <span>HÓA ĐƠN:</span>
            <span className="font-bold">INV-#{invoice?.id.toString().padStart(4, '0')}</span>
          </div>
          <div className="flex justify-between">
            <span>PHIẾU DỊCH VỤ:</span>
            <span className="font-bold">
              {invoice ? formatTicketCode(invoice.ticketId) : ''}
            </span>
          </div>
          <div className="flex justify-between">
            <span>KHÁCH HÀNG:</span>
            <span>{invoice?.ticket?.device?.customer?.fullName}</span>
          </div>
          <div className="flex justify-between">
            <span>SĐT LIÊN HỆ:</span>
            <span>{invoice?.ticket?.device?.customer?.phoneNumber}</span>
          </div>
          <div className="flex justify-between">
            <span>THIẾT BỊ:</span>
            <span>{invoice?.ticket?.device?.deviceName}</span>
          </div>
          <div className="flex justify-between">
            <span>SỐ SERIAL:</span>
            <span>{invoice?.ticket?.device?.serialNumber}</span>
          </div>
          <div className="flex justify-between">
            <span>THỜI GIAN TT:</span>
            <span>{invoice?.paidAt ? formatDateTime(invoice.paidAt) : ''}</span>
          </div>
          <div className="flex justify-between">
            <span>HÌNH THỨC:</span>
            <span className="font-bold uppercase">{invoice?.paymentMethod}</span>
          </div>
        </div>

        <div className="border-t border-b border-dashed border-stone-300 py-2 space-y-1.5">
          <div className="flex justify-between">
            <span>Công kỹ thuật / Chẩn đoán:</span>
            <span>{formatVND(Number(invoice?.laborFee || 0))}</span>
          </div>
          {invoice?.items?.map((it, idx) => (
            <div key={idx} className="flex justify-between">
              <span>
                {it.part?.partName} (x{it.quantity})
              </span>
              <span>{formatVND(Number(it.unitPrice) * it.quantity)}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-between text-sm font-bold pt-1">
          <span>TỔNG TIỀN ĐÃ THU:</span>
          <span className="text-amber-800">
            {formatVND(Number(invoice?.totalAmount || 0))}
          </span>
        </div>

        <div className="text-center pt-3 text-[11px] text-stone-500 border-t border-dashed border-stone-300">
          <p>Xin cảm ơn Quý khách đã tin tưởng dịch vụ tại UIT CARE!</p>
          <p className="mt-1">Thiết bị sửa chữa được bảo hành 90 ngày linh kiện.</p>
        </div>
      </div>
    </BaseModal>
  );
};
