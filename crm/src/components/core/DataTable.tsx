'use client';

import React from 'react';
import {
  IconArrowLeft,
  IconArrowRight,
  IconClipboardList,
} from '@/assets/icon';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
  render?: (row: T, index: number) => React.ReactNode;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey?: (row: T) => string | number;
  isLoading?: boolean;
  emptyMessage?: React.ReactNode;
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onRowClick?: (row: T) => void;
  className?: string;
  hidePagination?: boolean;
}

/**
 * Universal DataTable component based on fastcampus design with skeleton loaders,
 * responsive scroll, and clean pagination.
 */
export function DataTable<T>({
  columns,
  data,
  rowKey = (row: T) => {
    if (typeof row === 'object' && row !== null && 'id' in row) {
      return (row as { id: string | number }).id;
    }
    return String(row);
  },
  isLoading = false,
  emptyMessage = 'Không tìm thấy dữ liệu',
  currentPage = 1,
  totalPages = 1,
  totalItems,
  pageSize = 10,
  onPageChange,
  onRowClick,
  className = '',
  hidePagination = false,
}: DataTableProps<T>) {
  const effectiveTotalItems =
    totalItems !== undefined ? totalItems : data.length;
  const startItem =
    effectiveTotalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, effectiveTotalItems);
  return (
    <div
      className={cn(
        'w-full bg-white border border-sand-200 rounded-2xl shadow-xs overflow-hidden flex flex-col min-h-0 flex-1',
        className,
      )}
    >
      <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10 bg-sand-50">
            <tr className="border-b border-sand-200 bg-sand-50 shadow-2xs">
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={col.width ? { width: col.width } : undefined}
                  className={cn(
                    'py-3 px-4 text-xs font-bold uppercase tracking-wider text-stone-600 whitespace-nowrap bg-sand-50',
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center',
                    col.className,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-100">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, rIdx) => (
                <tr key={`skeleton-${rIdx}`} className="animate-pulse">
                  {columns.map((col) => (
                    <td key={col.key} className="py-3 px-4">
                      <div className="h-4 bg-sand-100 rounded-md w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-12 text-center text-stone-500"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-sand-100 text-stone-400 flex items-center justify-center">
                      <IconClipboardList className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-medium">{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, index) => {
                const isClickable = !!onRowClick;
                return (
                  <tr
                    key={rowKey(row)}
                    onClick={() => isClickable && onRowClick(row)}
                    className={cn(
                      'transition-colors hover:bg-sand-50',
                      isClickable && 'cursor-pointer',
                    )}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          'py-2.5 px-4 text-xs text-stone-800 align-middle',
                          col.align === 'right' && 'text-right',
                          col.align === 'center' && 'text-center',
                          col.className,
                        )}
                      >
                        {col.render
                          ? col.render(row, index)
                          : ((row as Record<string, unknown>)[col.key] as React.ReactNode)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!hidePagination && (
        <div className="px-5 py-2.5 border-t border-sand-200 bg-sand-50 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-600">
          <div className="flex items-center gap-3">
            <span>
              {effectiveTotalItems > 0 ? (
                <>
                  Hiển thị <strong className="text-stone-900 font-bold">{startItem}-{endItem}</strong> trong tổng số <strong className="text-stone-900 font-bold">{effectiveTotalItems}</strong> bản ghi
                </>
              ) : (
                <span>0 bản ghi</span>
              )}
            </span>
            <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-stone-300" />
            <span className="hidden sm:inline-block text-stone-500 font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-sand-200">
              {pageSize} mục / trang
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage <= 1 || isLoading || !onPageChange}
              onClick={() => onPageChange && onPageChange(currentPage - 1)}
              leftIcon={<IconArrowLeft className="w-3.5 h-3.5" />}
              className="min-h-[32px] px-2.5 py-1 text-xs"
            >
              Trước
            </Button>

            <div className="flex items-center gap-1 mx-1">
              {Array.from({ length: Math.min(Math.max(totalPages, 1), 5) }).map((_, idx) => {
                const pageNum = idx + 1;
                const isActive = pageNum === currentPage;
                return (
                  <button
                    key={`page-${pageNum}`}
                    onClick={() => onPageChange && onPageChange(pageNum)}
                    disabled={isLoading || isActive || !onPageChange}
                    className={cn(
                      'w-7 h-7 rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer',
                      isActive
                        ? 'bg-stone-900 text-white shadow-2xs font-bold'
                        : 'text-stone-600 hover:bg-sand-200 bg-white border border-sand-200',
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}
              {totalPages > 5 && (
                <span className="px-1 text-stone-400 font-bold">...</span>
              )}
            </div>

            <Button
              size="sm"
              variant="outline"
              disabled={currentPage >= totalPages || isLoading || !onPageChange}
              onClick={() => onPageChange && onPageChange(currentPage + 1)}
              rightIcon={<IconArrowRight className="w-3.5 h-3.5" />}
              className="min-h-[32px] px-2.5 py-1 text-xs"
            >
              Sau
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
