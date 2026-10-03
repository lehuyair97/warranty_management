'use client';

import React from 'react';
import { IconAlertTriangle } from '@/assets/icon';
import { formatVND } from '@/common/helpers/currency.helper';
import { formatPartCode } from '@/common/helpers/part.helper';
import {
  Column,
  createManagerDeleteAction,
  createManagerEditAction,
  TableActions,
} from '@/components/core';
import { Badge } from '@/components/ui/badge';
import { Part } from '@/types';

interface PartColumnsOptions {
  onEdit: (part: Part) => void;
  onDelete: (part: Part) => void;
  isManager: boolean;
}

/**
 * Standardized column configurations for Inventory Parts DataTable.
 */
export function getPartColumns({
  onEdit,
  onDelete,
  isManager,
}: PartColumnsOptions): Column<Part>[] {
  return [
    {
      key: 'partCode',
      header: 'Mã LK',
      width: '120px',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-stone-900 bg-stone-100 px-2.5 py-1 rounded-md border border-stone-200 shadow-2xs">
          {formatPartCode(row.id, row.partCode)}
        </span>
      ),
    },
    {
      key: 'partName',
      header: 'Tên linh kiện & vật tư',
      render: (row) => (
        <div>
          <span className="font-medium text-stone-900 block">{row.partName}</span>
          <span className="text-xs text-stone-500">Đơn vị: {row.unit}</span>
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Đơn giá niêm yết',
      align: 'right',
      render: (row) => (
        <span className="font-semibold text-stone-900">
          {formatVND(Number(row.price))}
        </span>
      ),
    },
    {
      key: 'stockQuantity',
      header: 'Tồn kho khả dụng',
      align: 'center',
      render: (row) => {
        const isLowStock = row.stockQuantity <= 5;
        return (
          <div className="flex items-center justify-center gap-1.5">
            <span
              className={`font-bold text-sm ${
                isLowStock ? 'text-amber-700 font-extrabold' : 'text-stone-800'
              }`}
            >
              {row.stockQuantity}
            </span>
            {isLowStock && (
              <Badge variant="warning" size="sm">
                <IconAlertTriangle className="w-3 h-3 mr-1 inline" />
                Sắp hết
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Thao tác',
      align: 'right',
      width: '80px',
      render: (row) => (
        <TableActions
          actions={[
            createManagerEditAction(() => onEdit(row), isManager, {
              tooltip: 'Chỉnh sửa linh kiện',
            }),
            createManagerDeleteAction(() => onDelete(row), isManager, {
              tooltip: 'Xóa linh kiện khỏi kho',
            }),
          ]}
        />
      ),
    },
  ];
}
