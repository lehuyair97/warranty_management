'use client';

import React from 'react';
import {
  IconCreditCard,
  IconLaptop,
  IconPrinter,
  IconWrench,
} from '@/assets/icon';
import { formatVND } from '@/common/helpers/currency.helper';
import { formatDateTime } from '@/common/helpers/date.helper';
import {
  getInvoiceStatusConfig,
  getTicketTypeConfig,
} from '@/common/helpers/status.helper';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TrackingTimeline } from './TrackingTimeline';
import { PublicTicketDetail } from '@/types';

export interface TrackingResultCardProps {
  ticket: PublicTicketDetail;
}

/**
 * Public Ticket Detail & Status Result Card.
 * Displays timeline progress, device specifications, technical diagnosis, and invoice billing.
 */
export const TrackingResultCard = React.memo<TrackingResultCardProps>(({ ticket }) => {
  return (
    <Card className="p-6 space-y-6">
      {/* Header Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-base font-extrabold text-stone-900 bg-stone-100 px-3 py-1 rounded-lg">
              {ticket.ticketCode}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-amber-100 text-amber-900">
              {getTicketTypeConfig(ticket.ticketType).label}
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Tiếp nhận lúc: {formatDateTime(ticket.receivedAt)}
          </p>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-xs text-stone-500 block">Khách hàng đăng ký</span>
          <span className="font-bold text-stone-900">
            {ticket.customer.fullName} ({ticket.customer.maskedPhone})
          </span>
        </div>
      </div>

      {/* Stepper Timeline */}
      <TrackingTimeline status={ticket.status} />

      {/* Device & Technical Findings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
          <div className="flex items-center gap-2 font-bold text-stone-900">
            <IconLaptop className="w-4 h-4 text-amber-700" />
            Thông tin thiết bị
          </div>
          <div>Model: <span className="font-semibold">{ticket.device.deviceName}</span></div>
          <div>Thương hiệu: <span className="font-semibold">{ticket.device.brand}</span></div>
          <div>Số Serial: <span className="font-mono font-semibold">{ticket.device.serialNumber}</span></div>
          <div>
            Kỹ thuật viên phụ trách:{' '}
            <span className="font-semibold text-amber-900">
              {ticket.technician?.fullName || 'Đang chờ phân công'}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
          <div className="flex items-center gap-2 font-bold text-stone-900">
            <IconWrench className="w-4 h-4 text-amber-700" />
            Hiện trạng & Kết quả xử lý
          </div>
          <div>Mô tả lỗi: <span className="font-medium text-stone-800">{ticket.issueDescription}</span></div>
          <div>Nguyên nhân: <span className="font-medium text-stone-800">{ticket.faultCause || 'Đang kiểm tra'}</span></div>
          <div>Giải pháp: <span className="font-medium text-stone-800">{ticket.repairSolution || 'Đang lên phương án'}</span></div>
          {ticket.completedAt && (
            <div>
              Hoàn thành lúc:{' '}
              <span className="font-semibold text-emerald-700">
                {formatDateTime(ticket.completedAt)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Billing Breakdown */}
      {ticket.invoices && ticket.invoices.length > 0 && (
        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-stone-900 text-xs">
              <IconCreditCard className="w-4 h-4 text-amber-700" />
              Chi phí dịch vụ & Quyết toán
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              leftIcon={<IconPrinter className="w-3.5 h-3.5" />}
            >
              In thông tin
            </Button>
          </div>

          {ticket.invoices.map((inv: PublicTicketDetail['invoices'][number]) => (
            <div key={inv.id} className="flex justify-between items-center text-xs pt-1">
              <span>Hóa đơn #{inv.id} ({getInvoiceStatusConfig(inv.status).label})</span>
              <span className="font-bold text-sm text-stone-900">
                {formatVND(Number(inv.totalAmount))}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
});

TrackingResultCard.displayName = 'TrackingResultCard';
