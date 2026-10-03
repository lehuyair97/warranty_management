'use client';

import React from 'react';
import { IconAlertTriangle } from '@/assets/icon';
import { getTicketStatusConfig } from '@/common/helpers/status.helper';
import { formatTicketCode } from '@/common/helpers/ticket.helper';
import {
  Column,
  createReceptionistDetailAction,
  TableActions,
} from '@/components/core';
import { Badge } from '@/components/ui/badge';
import { DelayedTicketReport } from '@/types';

export interface DelayedTicketColumnsOptions {
  onOpenDetail?: (ticket: DelayedTicketReport) => void;
}

export function getDelayedTicketColumns(
  options?: DelayedTicketColumnsOptions,
): Column<DelayedTicketReport>[] {
  return [
    {
      key: 'ticket_id',
      header: 'Mã Phiếu',
      width: '120px',
      render: (row) => (
        <span className="font-mono font-bold text-stone-900 bg-stone-100 px-2 py-1 rounded text-xs">
          {formatTicketCode(row.ticket_id)}
        </span>
      ),
    },
    {
      key: 'customer_name',
      header: 'Khách Hàng',
      render: (row) => (
        <div>
          <div className="font-semibold text-stone-900">{row.customer_name}</div>
          <div className="text-[11px] text-stone-400 font-mono">{row.phone_number}</div>
        </div>
      ),
    },
    {
      key: 'device_name',
      header: 'Thiết Bị',
      render: (row) => <span className="font-medium text-stone-700">{row.device_name}</span>,
    },
    {
      key: 'status',
      header: 'Trạng Thái',
      render: (row) => (
        <Badge variant="outline" size="sm">
          {getTicketStatusConfig(row.status).label}
        </Badge>
      ),
    },
    {
      key: 'assigned_technician',
      header: 'KTV Phụ Trách',
      render: (row) => (
        <span className="text-xs text-stone-600">
          {row.assigned_technician || (
            <span className="text-amber-700 font-medium italic">Chưa chỉ định</span>
          )}
        </span>
      ),
    },
    {
      key: 'overdue_days',
      header: 'Tồn Đọng',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1 text-rose-700 font-bold text-xs">
          <IconAlertTriangle className="w-3.5 h-3.5" />
          {row.overdue_days} ngày
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Thao tác',
      align: 'right',
      width: '80px',
      render: (row) => (
        <TableActions
          actions={[
            createReceptionistDetailAction(
              () => {
                options?.onOpenDetail?.(row);
              },
              { tooltip: 'Xem chi tiết phiếu tồn đọng' },
            ),
          ]}
        />
      ),
    },
  ];
}
