'use client';

import React from 'react';
import { BaseModal } from '@/components/core/BaseModal';
import { Input } from '@/components/ui/input';
import { Part } from '@/types';

interface EditStockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  part: Part | null;
  stock: number;
  onStockChange: (newStock: number) => void;
  onSave: () => void;
  isLoading: boolean;
}

export const EditStockModal: React.FC<EditStockModalProps> = ({
  open,
  onOpenChange,
  part,
  stock,
  onStockChange,
  onSave,
  isLoading,
}) => {
  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Điều chỉnh tồn kho"
      description={`Cập nhật số lượng kiểm kê thực tế cho: ${part?.partName || ''}`}
      primaryActionLabel="Cập nhật số lượng"
      onPrimaryAction={onSave}
      isPrimaryActionLoading={isLoading}
      size="sm"
    >
      <div className="space-y-4">
        <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-stone-500">Mã linh kiện:</span>
            <span className="font-mono font-bold text-stone-800">
              {part?.partCode}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Tồn kho hiện tại:</span>
            <span className="font-bold text-stone-800">
              {part?.stockQuantity} {part?.unit}
            </span>
          </div>
        </div>

        <Input
          label="Số lượng tồn kho mới"
          type="number"
          value={stock}
          onChange={(e) => onStockChange(parseInt(e.target.value, 10) || 0)}
          min={0}
        />
      </div>
    </BaseModal>
  );
};
