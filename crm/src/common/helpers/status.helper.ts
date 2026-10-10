import { TicketStatus, TicketType } from '@/types';
import { cva } from 'class-variance-authority';

export const getTicketStatusVariant = cva('badge-base', {
  variants: {
    status: {
      [TicketStatus.RECEIVED]: 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200',
      [TicketStatus.INSPECTING]: 'bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200',
      [TicketStatus.WAITING_FOR_PARTS]: 'bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200',
      [TicketStatus.REPAIRING]: 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200',
      [TicketStatus.COMPLETED]: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200',
      [TicketStatus.PAID]: 'bg-teal-100 text-teal-700 hover:bg-teal-200 border-teal-200',
      [TicketStatus.DELIVERED]: 'bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200',
      [TicketStatus.CANCELLED]: 'bg-rose-100 text-rose-700 hover:bg-rose-200 border-rose-200',
    },
  },
  defaultVariants: {
    status: TicketStatus.RECEIVED,
  },
});

export const getTicketStatusLabel = (status: TicketStatus): string => {
  const map: Record<TicketStatus, string> = {
    [TicketStatus.RECEIVED]: 'Đã tiếp nhận',
    [TicketStatus.INSPECTING]: 'Đang kiểm tra',
    [TicketStatus.WAITING_FOR_PARTS]: 'Chờ linh kiện',
    [TicketStatus.REPAIRING]: 'Đang sửa chữa',
    [TicketStatus.COMPLETED]: 'Đã hoàn thành',
    [TicketStatus.PAID]: 'Đã thanh toán',
    [TicketStatus.DELIVERED]: 'Đã trả khách',
    [TicketStatus.CANCELLED]: 'Đã hủy',
  };
  return map[status] || status;
};

export const getTicketTypeLabel = (type: TicketType): string => {
  const map: Record<TicketType, string> = {
    [TicketType.REPAIR]: 'Sửa chữa',
    [TicketType.WARRANTY]: 'Bảo hành',
    [TicketType.RE_REPAIR]: 'Bảo hành (Sửa lại)',
  };
  return map[type] || type;
};

const ticketStatusClasses: Record<string, { bgClass: string; borderClass: string; textClass: string; dotClass: string }> = {
  [TicketStatus.RECEIVED]: {
    bgClass: 'bg-stone-50',
    borderClass: 'border-stone-200',
    textClass: 'text-stone-700',
    dotClass: 'bg-stone-500',
  },
  [TicketStatus.INSPECTING]: {
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-200',
    textClass: 'text-amber-700',
    dotClass: 'bg-amber-500',
  },
  [TicketStatus.WAITING_FOR_PARTS]: {
    bgClass: 'bg-orange-50',
    borderClass: 'border-orange-200',
    textClass: 'text-orange-700',
    dotClass: 'bg-orange-500',
  },
  [TicketStatus.REPAIRING]: {
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-200',
    textClass: 'text-blue-700',
    dotClass: 'bg-blue-500',
  },
  [TicketStatus.COMPLETED]: {
    bgClass: 'bg-emerald-50',
    borderClass: 'border-emerald-200',
    textClass: 'text-emerald-700',
    dotClass: 'bg-emerald-500',
  },
  [TicketStatus.PAID]: {
    bgClass: 'bg-teal-50',
    borderClass: 'border-teal-200',
    textClass: 'text-teal-700',
    dotClass: 'bg-teal-500',
  },
  [TicketStatus.DELIVERED]: {
    bgClass: 'bg-purple-50',
    borderClass: 'border-purple-200',
    textClass: 'text-purple-700',
    dotClass: 'bg-purple-500',
  },
  [TicketStatus.CANCELLED]: {
    bgClass: 'bg-rose-50',
    borderClass: 'border-rose-200',
    textClass: 'text-rose-700',
    dotClass: 'bg-rose-500',
  },
};

export const getTicketStatusConfig = (status: TicketStatus | string) => {
  const classes = ticketStatusClasses[status] || {
    bgClass: 'bg-stone-50',
    borderClass: 'border-stone-200',
    textClass: 'text-stone-700',
    dotClass: 'bg-stone-500',
  };
  return {
    label: getTicketStatusLabel(status as TicketStatus),
    variant: getTicketStatusVariant({ status: status as TicketStatus }) as any,
    ...classes,
  };
};

export const getTicketTypeConfig = (type: TicketType | string) => {
  return {
    label: getTicketTypeLabel(type as TicketType),
    color: type === TicketType.WARRANTY ? 'text-emerald-700' : 'text-blue-700',
  };
};

export const getInvoiceStatusConfig = (_status?: string) => {
  return {
    label: 'Đã thanh toán',
    variant: 'success' as const,
  };
};

