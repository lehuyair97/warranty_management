import { InvoiceStatus, TicketStatus, TicketType } from '@/types';

export interface StatusConfig {
  label: string;
  labelEn: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  dotClass: string;
}

/**
 * Pure helper function returning semantic styling and labels for ticket lifecycle statuses.
 */
export function getTicketStatusConfig(status: TicketStatus): StatusConfig {
  switch (status) {
    case TicketStatus.RECEIVED:
      return {
        label: 'Mới tiếp nhận',
        labelEn: 'Received',
        bgClass: 'bg-stone-100',
        textClass: 'text-stone-800',
        borderClass: 'border-stone-300',
        dotClass: 'bg-stone-500',
      };
    case TicketStatus.INSPECTING:
      return {
        label: 'Đang kiểm tra',
        labelEn: 'Inspecting',
        bgClass: 'bg-amber-50',
        textClass: 'text-amber-800',
        borderClass: 'border-amber-300',
        dotClass: 'bg-amber-500',
      };
    case TicketStatus.WAITING_FOR_PARTS:
      return {
        label: 'Chờ linh kiện',
        labelEn: 'Waiting Parts',
        bgClass: 'bg-orange-50',
        textClass: 'text-orange-800',
        borderClass: 'border-orange-300',
        dotClass: 'bg-orange-500',
      };
    case TicketStatus.REPAIRING:
      return {
        label: 'Đang sửa chữa',
        labelEn: 'Repairing',
        bgClass: 'bg-blue-50',
        textClass: 'text-blue-800',
        borderClass: 'border-blue-300',
        dotClass: 'bg-blue-600',
      };
    case TicketStatus.COMPLETED:
      return {
        label: 'Đã sửa xong',
        labelEn: 'Completed',
        bgClass: 'bg-emerald-50',
        textClass: 'text-emerald-800',
        borderClass: 'border-emerald-300',
        dotClass: 'bg-emerald-600',
      };
    case TicketStatus.DELIVERED:
      return {
        label: 'Đã trả khách',
        labelEn: 'Delivered',
        bgClass: 'bg-stone-900',
        textClass: 'text-stone-100',
        borderClass: 'border-stone-800',
        dotClass: 'bg-stone-400',
      };
    case TicketStatus.CANCELLED:
      return {
        label: 'Đã hủy',
        labelEn: 'Cancelled',
        bgClass: 'bg-rose-50',
        textClass: 'text-rose-800',
        borderClass: 'border-rose-300',
        dotClass: 'bg-rose-500',
      };
    default:
      return {
        label: status,
        labelEn: status,
        bgClass: 'bg-stone-100',
        textClass: 'text-stone-700',
        borderClass: 'border-stone-200',
        dotClass: 'bg-stone-400',
      };
  }
}

/**
 * Pure helper function for ticket category classification.
 */
export function getTicketTypeConfig(type: TicketType) {
  switch (type) {
    case TicketType.WARRANTY:
      return {
        label: 'Bảo hành chính hãng (0đ)',
        labelEn: 'Manufacturer Warranty',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      };
    case TicketType.RE_REPAIR:
      return {
        label: 'Bảo hành lại sau sửa',
        labelEn: 'Post-repair Warranty',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
      };
    case TicketType.REPAIR:
    default:
      return {
        label: 'Sửa chữa dịch vụ',
        labelEn: 'Paid Repair',
        badgeClass: 'bg-stone-100 text-stone-800 border-stone-300',
      };
  }
}

/**
 * Pure helper function for invoice payment status.
 */
export function getInvoiceStatusConfig(status: InvoiceStatus) {
  if (status === InvoiceStatus.PAID) {
    return {
      label: 'Đã thanh toán',
      labelEn: 'Paid',
      bgClass: 'bg-emerald-50',
      textClass: 'text-emerald-800',
      borderClass: 'border-emerald-300',
      dotClass: 'bg-emerald-600',
    };
  }
  return {
    label: 'Chưa thanh toán',
    labelEn: 'Unpaid',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-800',
    borderClass: 'border-amber-300',
    dotClass: 'bg-amber-500',
  };
}
