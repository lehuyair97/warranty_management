'use client';

import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { IconCreditCard } from '@/assets/icon';
import { DataTable, PageContainer, PageHeader } from '@/components/core';
import { Badge } from '@/components/ui/badge';
import { TicketCheckoutModal } from '@/features/cashier/components/TicketCheckoutModal';
import { getCashierColumns } from '@/features/cashier/config/cashier.columns';
import { api } from '@/lib/api-client';
import { Ticket } from '@/types';

export default function CashierBillingPage() {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const { data, isLoading, refetch } = useQuery<{ items: Ticket[] }>({
    queryKey: ['tickets', 'completed'],
    queryFn: async () => {
      return api.get<{ items: Ticket[] }>('/tickets', { status: 'completed' });
    },
  });

  const columns = useMemo(
    () =>
      getCashierColumns({
        onCheckout: (ticket) => setSelectedTicket(ticket),
      }),
    [],
  );

  const tickets = data?.items || [];

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title="Quầy Thu Ngân"
        description="Thanh toán phiếu sửa chữa đã hoàn thành, xuất hóa đơn và bàn giao thiết bị cho khách hàng."
        badge={
          <Badge variant="outline" size="sm">
            <IconCreditCard className="w-3.5 h-3.5" />
            {tickets.length} Chờ thanh toán
          </Badge>
        }
        onRefresh={refetch}
        isRefreshing={isLoading}
      />

      {/* Main Data Table */}
      <DataTable<Ticket>
        columns={columns}
        data={tickets}
        isLoading={isLoading}
        emptyMessage="Không có phiếu sửa chữa nào cần thanh toán lúc này."
        className="flex-1"
        hidePagination={tickets.length <= 10}
      />

      {/* Checkout Modal */}
      {selectedTicket && (
        <TicketCheckoutModal
          ticket={selectedTicket}
          isOpen={!!selectedTicket}
          onClose={() => {
            setSelectedTicket(null);
            refetch();
          }}
        />
      )}
    </PageContainer>
  );
}
