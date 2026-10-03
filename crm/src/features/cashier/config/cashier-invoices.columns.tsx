'use client';

import React from 'react';
import { formatVND } from '@/common/helpers/currency.helper';
import { formatDate } from '@/common/helpers/date.helper';
import {
  getInvoiceStatusConfig,
  getTicketTypeConfig,
} from '@/common/helpers/status.helper';
import { formatTicketCode } from '@/common/helpers/ticket.helper';
import {
  Column,
  createCashierCheckoutAction,
  createCashierPrintAction,
  TableActions,
} from '@/components/core';
import { Badge } from '@/components/ui/badge';
import { Invoice, InvoiceStatus, TicketType } from '@/types';

interface CashierColumnsOptions {
  onOpenCheckout: (invoice: Invoice) => void;
  onViewReceipt: (invoice: Invoice) => void;
}

export function getCashierInvoiceColumns({
  onOpenCheckout,
  onViewReceipt,
}: CashierColumnsOptions): Column<Invoice>[] {
  return [
    {
      key: 'id',
      header: 'Số Hóa Đơn',
      width: '120px',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-stone-900 bg-stone-100 px-2 py-1 rounded">
          INV-#{row.id.toString().padStart(4, '0')}
        </span>
      ),
    },
    {
      key: 'ticket',
      header: 'Phiếu dịch vụ & Khách hàng',
      render: (row) => (
        <div>
          <span className="font-semibold text-stone-900 block">
            {formatTicketCode(row.ticketId)} - {row.ticket?.device?.deviceName}
          </span>
          <span className="text-xs text-stone-500 block">
            Khách: {row.ticket?.device?.customer?.fullName} ({row.ticket?.device?.customer?.phoneNumber})
          </span>
          <Badge variant="outline" size="sm" className="mt-1">
            {getTicketTypeConfig(row.ticket?.ticketType || TicketType.REPAIR).label}
          </Badge>
        </div>
      ),
    },
    {
      key: 'partsCount',
      header: 'Linh kiện',
      width: '100px',
      align: 'center',
      render: (row) => (
        <span className="text-xs font-medium text-stone-700">
          {row.items?.length || 0} mục
        </span>
      ),
    },
    {
      key: 'totalAmount',
      header: 'Tổng tiền thanh toán',
      align: 'right',
      render: (row) => (
        <span className="font-bold text-stone-900">
          {formatVND(Number(row.totalAmount))}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      width: '130px',
      render: (row) => {
        const cfg = getInvoiceStatusConfig(row.status);
        return (
          <Badge variant={row.status === InvoiceStatus.PAID ? 'success' : 'warning'} size="sm">
            {cfg.label}
          </Badge>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Ngày lập',
      width: '110px',
      render: (row) => (
        <span className="text-xs text-stone-500">
          {formatDate(row.createdAt)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Thao tác',
      align: 'right',
      width: '80px',
      render: (row) => {
        const isPaid = row.status === InvoiceStatus.PAID;
        return (
          <TableActions
            actions={[
              !isPaid
                ? createCashierCheckoutAction(() => onOpenCheckout(row))
                : createCashierPrintAction(() => onViewReceipt(row)),
            ]}
          />
        );
      },
    },
  ];
}
