'use client';

import React from 'react';
import { formatVND } from '@/common/helpers/currency.helper';
import { formatTicketCode } from '@/common/helpers/ticket.helper';
import {
  Column,
  createCashierCheckoutAction,
  TableActions,
} from '@/components/core';
import { Ticket } from '@/types';

interface CashierColumnsOptions {
  onCheckout: (ticket: Ticket) => void;
}

/**
 * Standardized column definitions for Cashier Billing tickets table.
 * Uses core TableActions component for consistent UI across the platform.
 */
export function getCashierColumns({
  onCheckout,
}: CashierColumnsOptions): Column<Ticket>[] {
  return [
    {
      key: 'id',
      header: 'Mã Phiếu',
      width: '135px',
      className: 'whitespace-nowrap min-w-[130px]',
      render: (row) => (
        <span className="font-mono font-bold text-stone-900 bg-sand-100 px-2.5 py-1 rounded-md text-xs border border-sand-200 shadow-2xs whitespace-nowrap inline-block">
          {formatTicketCode(row.id)}
        </span>
      ),
    },
    {
      key: 'customer',
      header: 'Khách Hàng',
      render: (row) => (
        <div>
          <div className="font-semibold text-stone-900">
            {row.device?.customer?.fullName || 'Khách vãng lai'}
          </div>
          <div className="text-[11px] text-stone-500 font-mono">
            {row.device?.customer?.phoneNumber || ''}
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
            {row.device?.deviceName || 'Thiết bị'}
          </span>
          {row.device?.serialNumber && (
            <span className="text-[11px] text-stone-400 font-mono">
              {row.device.serialNumber}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'technician',
      header: 'KTV Xử Lý',
      width: '150px',
      render: (row) => (
        <span className="text-xs text-stone-700">
          {row.technician?.fullName || (
            <span className="text-stone-400 italic">Chưa chỉ định</span>
          )}
        </span>
      ),
    },
    {
      key: 'estimatedCost',
      header: 'Phí Dự Kiến',
      align: 'right',
      width: '140px',
      render: (row) => (
        <span className="font-mono font-bold text-emerald-700 text-xs">
          {formatVND(Number(row.estimatedCost || 0))}
        </span>
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
            createCashierCheckoutAction(() => onCheckout(row)),
          ]}
        />
      ),
    },
  ];
}
