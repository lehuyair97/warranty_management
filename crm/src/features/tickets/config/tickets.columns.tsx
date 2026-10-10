'use client';

import { formatDate } from '@/common/helpers/date.helper';
import {
  getTicketStatusConfig,
  getTicketTypeConfig,
} from '@/common/helpers/status.helper';
import { formatTicketCode } from '@/common/helpers/ticket.helper';
import {
  Column,
  createReceptionistDetailAction,
  TableActions,
} from '@/components/core';
import { Ticket } from '@/types';

interface TicketColumnsOptions {
  onOpenDetail: (ticket: Ticket) => void;
}

export function getTicketDirectoryColumns({
  onOpenDetail,
}: TicketColumnsOptions): Column<Ticket>[] {
  return [
    {
      key: 'id',
      header: 'Mã Phiếu',
      width: '125px',
      className: 'whitespace-nowrap min-w-[125px]',
      render: (row) => (
        <span className="font-mono font-bold text-stone-900 bg-stone-100 px-2 py-1 rounded text-xs whitespace-nowrap inline-block">
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
            {row.device?.customer?.fullName}
          </div>
          <div className="text-[11px] text-stone-500 font-mono">
            {row.device?.customer?.phoneNumber}
          </div>
        </div>
      ),
    },
    {
      key: 'device',
      header: 'Thiết Bị',
      render: (row) => (
        <div>
          <div className="font-medium text-stone-800">{row.device?.deviceName}</div>
          <div className="text-[11px] text-stone-400 font-mono">
            {row.device?.serialNumber || 'Không có serial'}
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Loại Dịch Vụ',
      width: '130px',
      render: (row) => {
        const typeCfg = getTicketTypeConfig(row.ticketType);
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-700 border border-stone-200 whitespace-nowrap">
            {typeCfg.label}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Trạng Thái',
      width: '160px',
      render: (row) => {
        const statusCfg = getTicketStatusConfig(row.status);
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap border ${statusCfg.bgClass} ${statusCfg.borderClass} ${statusCfg.textClass}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusCfg.dotClass}`}
            />
            <span>{statusCfg.label}</span>
          </span>
        );
      },
    },
    {
      key: 'technician',
      header: 'KTV Phụ Trách',
      render: (row) => (
        <span className="text-xs text-stone-600">
          {row.technician?.fullName || (
            <span className="text-stone-400 italic">Chưa chỉ định</span>
          )}
        </span>
      ),
    },
    {
      key: 'receivedAt',
      header: 'Ngày Nhận',
      width: '110px',
      render: (row) => (
        <span className="text-xs text-stone-500">
          {formatDate(row.receivedAt)}
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
          actions={[createReceptionistDetailAction(() => onOpenDetail(row))]}
        />
      ),
    },
  ];
}
