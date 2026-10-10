'use client';

import React from 'react';
import { formatVND } from '@/common/helpers/currency.helper';
import { formatDate } from '@/common/helpers/date.helper';
import {
  Column,
  createReceptionistDetailAction,
  TableActions,
} from '@/components/core';
import { Badge } from '@/components/ui/badge';
import { Invoice } from '@/types';

interface InvoiceColumnsOptions {
  onOpenDetail: (invoice: Invoice) => void;
}

/**
 * Standardized column definitions for Invoices DataTable.
 * Uses centralized TableActions component to match Ticket and Inventory screens.
 */
export function getInvoiceColumns({
  onOpenDetail,
}: InvoiceColumnsOptions): Column<Invoice>[] {
  return [
    {
      key: 'id',
      header: 'Mã HĐ',
      width: '135px',
      className: 'whitespace-nowrap min-w-[130px]',
      render: (row) => (
        <span className="font-mono font-bold text-stone-900 bg-sand-100 px-2.5 py-1 rounded-md text-xs border border-sand-200 shadow-2xs whitespace-nowrap inline-block">
          INV-{row.id.toString().padStart(5, '0')}
        </span>
      ),
    },
    {
      key: 'ticket',
      header: 'Mã Phiếu',
      width: '135px',
      className: 'whitespace-nowrap min-w-[130px]',
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-stone-700 bg-stone-50 px-2.5 py-1 rounded-md border border-sand-200 whitespace-nowrap inline-block">
          TCK-{(row.ticketId || row.ticket?.id || 0).toString().padStart(5, '0')}
        </span>
      ),
    },
    {
      key: 'customer',
      header: 'Khách Hàng',
      render: (row) => (
        <div>
          <div className="font-semibold text-stone-900">
            {row.ticket?.device?.customer?.fullName || 'N/A'}
          </div>
          <div className="text-[11px] text-stone-500 font-mono">
            {row.ticket?.device?.customer?.phoneNumber || ''}
          </div>
        </div>
      ),
    },
    {
      key: 'device',
      header: 'Thiết Bị',
      render: (row) => (
        <div>
          <span className="text-xs text-stone-800 font-medium block">
            {row.ticket?.device?.deviceName || 'N/A'}
          </span>
          {row.ticket?.device?.serialNumber && (
            <span className="text-[11px] text-stone-400 font-mono">
              {row.ticket.device.serialNumber}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Ngày Tạo',
      width: '120px',
      className: 'whitespace-nowrap',
      render: (row) => (
        <span className="text-xs text-stone-500 whitespace-nowrap">
          {formatDate(row.createdAt)}
        </span>
      ),
    },
    {
      key: 'totalAmount',
      header: 'Tổng Tiền',
      width: '130px',
      className: 'whitespace-nowrap',
      render: (row) => (
        <span className="font-mono font-bold text-emerald-700 text-xs whitespace-nowrap">
          {formatVND(Number(row.totalAmount))}
        </span>
      ),
    },
    {
      key: 'paymentMethod',
      header: 'PT Thanh Toán',
      width: '130px',
      className: 'whitespace-nowrap',
      render: (row) => {
        const methodLabel =
          row.paymentMethod === 'cash'
            ? 'Tiền mặt'
            : row.paymentMethod === 'bank_transfer'
              ? 'Chuyển khoản'
              : row.paymentMethod === 'credit_card'
                ? 'Thẻ tín dụng'
                : 'Chưa thanh toán';
        return (
          <Badge variant="outline" size="sm" className="font-medium text-[11px] whitespace-nowrap">
            {methodLabel}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      header: 'Thao tác',
      align: 'right',
      width: '80px',
      render: (row) => (
        <TableActions
          actions={[
            createReceptionistDetailAction(() => onOpenDetail(row), {
              tooltip: 'Xem chi tiết hóa đơn & biên lai',
            }),
          ]}
        />
      ),
    },
  ];
}
