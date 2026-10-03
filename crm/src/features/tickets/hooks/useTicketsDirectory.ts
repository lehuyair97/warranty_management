'use client';

import { useMemo, useState } from 'react';
import { useSnapshot } from 'valtio';
import { useTickets } from '@/hooks/useTickets';
import { authState } from '@/stores/auth.store';
import {
  EmployeeRole,
  Ticket,
  TicketQueryParams,
  TicketStatus,
  TicketType,
} from '@/types';

export const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: TicketStatus.RECEIVED, label: 'Mới tiếp nhận (Received)' },
  { value: TicketStatus.INSPECTING, label: 'Đang kiểm tra (Inspecting)' },
  { value: TicketStatus.WAITING_FOR_PARTS, label: 'Chờ linh kiện (Waiting Parts)' },
  { value: TicketStatus.REPAIRING, label: 'Đang sửa chữa (Repairing)' },
  { value: TicketStatus.COMPLETED, label: 'Đã sửa xong (Completed)' },
  { value: TicketStatus.DELIVERED, label: 'Đã trả khách (Delivered)' },
  { value: TicketStatus.CANCELLED, label: 'Đã hủy tiếp nhận (Cancelled)' },
];

export const TYPE_OPTIONS = [
  { value: 'ALL', label: 'Tất cả loại dịch vụ' },
  { value: 'repair', label: 'Sửa chữa tính phí' },
  { value: 'warranty', label: 'Bảo hành miễn phí' },
  { value: 're_repair', label: 'Sửa lại / BH sửa chữa' },
];

export function useTicketsDirectory() {
  const { user } = useSnapshot(authState);
  const isManager = user?.role === EmployeeRole.MANAGER;

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const queryParams: TicketQueryParams = useMemo(() => {
    const params: TicketQueryParams = {
      page,
      limit: pageSize,
    };
    if (statusFilter !== 'ALL') {
      params.status = statusFilter;
    }
    if (typeFilter !== 'ALL') {
      params.ticketType = typeFilter as TicketType;
    }
    if (searchTerm) {
      params.search = searchTerm;
    }
    return params;
  }, [statusFilter, typeFilter, searchTerm, page, pageSize]);

  const handleStatusChange = (val: string) => {
    setStatusFilter(val);
    setPage(1);
  };

  const handleTypeChange = (val: string) => {
    setTypeFilter(val);
    setPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setPage(1);
  };

  const handleResetFilters = () => {
    setStatusFilter('ALL');
    setTypeFilter('ALL');
    setSearchTerm('');
    setPage(1);
  };

  const { data: ticketsData, isLoading, refetch } = useTickets(queryParams);

  const handleOpenDetail = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setDetailModalOpen(true);
  };

  const tickets = ticketsData?.items || [];
  const totalPages = ticketsData?.meta?.totalPages || 1;
  const totalItems = ticketsData?.meta?.totalItems !== undefined ? ticketsData.meta.totalItems : tickets.length;
  const isFiltered = statusFilter !== 'ALL' || typeFilter !== 'ALL' || !!searchTerm;

  const activeSelectedTicket = selectedTicket
    ? tickets.find((t) => t.id === selectedTicket.id) || selectedTicket
    : null;

  return {
    tickets,
    isLoading,
    refetch,
    statusFilter,
    setStatusFilter: handleStatusChange,
    typeFilter,
    setTypeFilter: handleTypeChange,
    searchTerm,
    setSearchTerm: handleSearchChange,
    isFiltered,
    resetFilters: handleResetFilters,
    page,
    setPage,
    pageSize,
    totalPages,
    totalItems,
    selectedTicket: activeSelectedTicket,
    detailModalOpen,
    setDetailModalOpen,
    handleOpenDetail,
    isManager,
    statusOptions: STATUS_OPTIONS,
    typeOptions: TYPE_OPTIONS,
  };
}
