'use client';

import React from 'react';
import { IconAlertTriangle } from '@/assets/icon';
import { ColumnDef, DataTable } from '@/components/core';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DelayedTicket } from '@/types';

export interface DelayedTicketsCardProps {
  columns: ColumnDef<DelayedTicket>[];
  delayedTickets: DelayedTicket[];
  isLoading: boolean;
}

/**
 * Delayed Tickets Alert Card component for Executive Dashboard.
 * Displays overdue ticket warnings (>14 days) and associated data table.
 */
export const DelayedTicketsCard = React.memo<DelayedTicketsCardProps>(
  ({ columns, delayedTickets, isLoading }) => {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-700">
              <IconAlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-sm">
                Cảnh Báo Phiếu Tồn Đọng Quá Hạn (&gt;14 Ngày)
              </h3>
              <p className="text-xs text-stone-500">
                Thủ tục lưu trữ dbo.sp_alert_delayed_tickets tự động phát hiện phiếu chưa xử lý xong.
              </p>
            </div>
          </div>
          <Badge variant="warning" size="sm">
            {delayedTickets.length} Phiếu cảnh báo
          </Badge>
        </div>

        <DataTable
          columns={columns}
          data={delayedTickets}
          isLoading={isLoading}
          emptyMessage="Không có phiếu nào tồn đọng quá hạn. Hệ thống vận hành rất tốt!"
        />
      </Card>
    );
  },
);

DelayedTicketsCard.displayName = 'DelayedTicketsCard';
