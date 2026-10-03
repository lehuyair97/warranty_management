'use client';

import React from 'react';
import { formatDateTime } from '@/common/helpers/date.helper';
import { formatTicketCode } from '@/common/helpers/ticket.helper';
import { BaseModal } from '@/components/core/BaseModal';
import { Ticket } from '@/types';

interface ReceptionSlipModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: Ticket | null;
}

export const ReceptionSlipModal: React.FC<ReceptionSlipModalProps> = ({
  open,
  onOpenChange,
  ticket,
}) => {
  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Biên nhận tiếp nhận thiết bị (Slip)"
      description={`Mã tiếp nhận hệ thống: ${
        ticket ? formatTicketCode(ticket.id) : ''
      }`}
      primaryActionLabel="In phiếu biên nhận"
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
            <span>MÃ BIÊN NHẬN:</span>
            <span className="font-bold text-amber-900">
              {ticket ? formatTicketCode(ticket.id) : ''}
            </span>
          </div>
          <div className="flex justify-between">
            <span>KHÁCH HÀNG:</span>
            <span>{ticket?.device?.customer?.fullName}</span>
          </div>
          <div className="flex justify-between">
            <span>SĐT LIÊN HỆ:</span>
            <span>{ticket?.device?.customer?.phoneNumber}</span>
          </div>
          <div className="flex justify-between">
            <span>THIẾT BỊ:</span>
            <span>{ticket?.device?.deviceName}</span>
          </div>
          <div className="flex justify-between">
            <span>SỐ SERIAL:</span>
            <span>{ticket?.device?.serialNumber || 'Không'}</span>
          </div>
          <div className="flex justify-between">
            <span>LOẠI DỊCH VỤ:</span>
            <span className="font-bold uppercase">{ticket?.ticketType}</span>
          </div>
          <div className="flex justify-between">
            <span>TIẾP NHẬN LÚC:</span>
            <span>{ticket ? formatDateTime(ticket.receivedAt) : ''}</span>
          </div>
        </div>

        <div className="border-t border-b border-dashed border-stone-300 py-2 space-y-1">
          <div>
            <span className="font-bold block">Hiện trạng tiếp nhận:</span>
            <span className="text-stone-700">
              {ticket?.initialCondition || 'Bình thường'}
            </span>
          </div>
          <div>
            <span className="font-bold block">Mô tả lỗi:</span>
            <span className="text-stone-700">
              {ticket?.issueDescription || 'Không có mô tả'}
            </span>
          </div>
          <div>
            <span className="font-bold block">Phụ kiện gửi kèm:</span>
            <span className="text-stone-700">
              {ticket?.accessories || 'Không kèm phụ kiện'}
            </span>
          </div>
        </div>

        <div className="text-center pt-3 text-[11px] text-stone-500 space-y-1">
          <p>Khách hàng vui lòng giữ phiếu để đối chiếu khi nhận lại thiết bị.</p>
          <p className="font-semibold text-stone-800">
            Tra cứu tiến độ trực tuyến tại: uit-care.vn/tra-cuu
          </p>
        </div>
      </div>
    </BaseModal>
  );
};
