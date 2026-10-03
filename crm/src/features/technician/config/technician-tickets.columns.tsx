'use client';

import React from 'react';
import { formatDate } from '@/common/helpers/date.helper';
import {
  getTicketStatusConfig,
  getTicketTypeConfig,
} from '@/common/helpers/status.helper';
import { formatTicketCode } from '@/common/helpers/ticket.helper';
import {
  Column,
  createTechnicianClaimAction,
  createTechnicianDiagnoseAction,
  TableActions,
} from '@/components/core';
import { Badge } from '@/components/ui/badge';
import { Ticket, TicketStatus, UserProfile } from '@/types';

interface TechnicianColumnsOptions {
  user: UserProfile | null;
  onClaim: (ticket: Ticket) => void;
  onOpenDiagnosis: (ticket: Ticket) => void;
  isAssigning: boolean;
}

export function getTechnicianTicketColumns({
  user,
  onClaim,
  onOpenDiagnosis,
  isAssigning,
}: TechnicianColumnsOptions): Column<Ticket>[] {
  return [
    {
      key: 'ticketCode',
      header: 'Mã phiếu',
      width: '110px',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-stone-900 bg-stone-100 px-2 py-1 rounded">
          {formatTicketCode(row.id)}
        </span>
      ),
    },
    {
      key: 'device',
      header: 'Thiết bị & Hiện trạng',
      render: (row) => (
        <div>
          <span className="font-semibold text-stone-900 block">
            {row.device?.deviceName || 'Thiết bị'}
          </span>
          <span className="text-xs text-stone-500 block truncate max-w-xs">
            {row.issueDescription || 'Không có mô tả'}
          </span>
          <span className="text-[11px] text-stone-400 font-mono">
            S/N: {row.device?.serialNumber}
          </span>
        </div>
      ),
    },
    {
      key: 'ticketType',
      header: 'Loại dịch vụ',
      width: '110px',
      render: (row) => {
        const typeCfg = getTicketTypeConfig(row.ticketType);
        return (
          <Badge variant="outline" size="sm">
            {typeCfg.label}
          </Badge>
        );
      },
    },
    {
      key: 'status',
      header: 'Trạng thái',
      width: '140px',
      render: (row) => {
        const statusCfg = getTicketStatusConfig(row.status);
        return (
          <Badge
            variant={
              row.status === TicketStatus.COMPLETED || row.status === TicketStatus.DELIVERED
                ? 'success'
                : row.status === TicketStatus.REPAIRING
                  ? 'warning'
                  : 'outline'
            }
            size="sm"
          >
            {statusCfg.label}
          </Badge>
        );
      },
    },
    {
      key: 'technician',
      header: 'KTV Phụ trách',
      width: '140px',
      render: (row) => {
        if (!row.technician) {
          return (
            <span className="text-xs text-amber-700 italic font-medium">
              Chưa phân công
            </span>
          );
        }
        const isMe = row.technician.id === user?.id;
        return (
          <span
            className={`text-xs font-medium block ${
              isMe ? 'text-amber-800 font-bold' : 'text-stone-700'
            }`}
          >
            {row.technician.fullName} {isMe && '(Tôi)'}
          </span>
        );
      },
    },
    {
      key: 'receivedAt',
      header: 'Tiếp nhận lúc',
      width: '120px',
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
      render: (row) => {
        const isAssignedToMe = row.technician?.id === user?.id;
        const isUnassigned = !row.technician;
        const isFinished =
          row.status === TicketStatus.COMPLETED ||
          row.status === TicketStatus.DELIVERED ||
          row.status === TicketStatus.CANCELLED;

        if (isFinished) {
          return (
            <TableActions
              actions={[
                createTechnicianDiagnoseAction(() => onOpenDiagnosis(row), false, true),
              ]}
            />
          );
        }

        return (
          <TableActions
            actions={[
              createTechnicianClaimAction(() => onClaim(row), isAssigning, !isUnassigned),
              createTechnicianDiagnoseAction(() => onOpenDiagnosis(row), isAssignedToMe, false),
            ]}
          />
        );
      },
    },
  ];
}
