'use client';

import { yupResolver } from '@hookform/resolvers/yup';
import React from 'react';
import { useForm } from 'react-hook-form';
import { IconCheck } from '@/assets/icon';
import { BaseModal } from '@/components/core/BaseModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUpdatePart } from '@/hooks/useParts';
import { UpdatePartFormValues, updatePartSchema } from '@/schemas/part.schema';
import { uiActions } from '@/stores/ui.store';
import { getErrorMessage, Part } from '@/types';

interface EditPartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  part: Part | null;
}

interface EditPartFormContentProps {
  part: Part;
  onClose: () => void;
}

const EditPartFormContent: React.FC<EditPartFormContentProps> = ({ part, onClose }) => {
  const updateMutation = useUpdatePart();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdatePartFormValues>({
    resolver: yupResolver(updatePartSchema),
    defaultValues: {
      partName: part.partName || '',
      unit: part.unit || 'Cái',
      price: Number(part.price) || 0,
      stockQuantity: part.stockQuantity || 0,
    },
  });

  const onSubmit = async (values: UpdatePartFormValues) => {
    try {
      await updateMutation.mutateAsync({
        id: part.id,
        partName: values.partName.trim(),
        unit: values.unit.trim(),
        price: Number(values.price),
        stockQuantity: Number(values.stockQuantity),
      });

      uiActions.addToast({
        type: 'success',
        title: 'Cập nhật thành công',
        message: `Đã cập nhật linh kiện: ${values.partName}`,
      });
      onClose();
    } catch (err: unknown) {
      uiActions.addToast({
        type: 'error',
        title: 'Cập nhật thất bại',
        message: getErrorMessage(err, 'Không thể cập nhật linh kiện.'),
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {/* Readonly SKU info */}
      <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs flex justify-between items-center">
        <div>
          <span className="text-stone-500 block">Mã linh kiện SKU</span>
          <span className="font-mono font-bold text-stone-900 text-sm">
            {part.partCode || `#${part.id}`}
          </span>
        </div>
        <div className="text-right">
          <span className="text-stone-500 block">Tồn kho hiện tại</span>
          <span className="font-bold text-stone-800 text-sm">
            {part.stockQuantity} {part.unit}
          </span>
        </div>
      </div>

      <Input
        label="Tên linh kiện & vật tư (*)"
        placeholder="VD: Màn hình iPhone 13 Pro Max"
        {...register('partName')}
        error={errors.partName?.message}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Đơn vị tính (*)"
          placeholder="Cái, Bộ, Thanh, Viên..."
          {...register('unit')}
          error={errors.unit?.message}
        />

        <Input
          label="Đơn giá niêm yết (VND) (*)"
          type="number"
          min={0}
          step={1000}
          {...register('price', { valueAsNumber: true })}
          error={errors.price?.message}
        />
      </div>

      <Input
        label="Số lượng tồn kho thực tế (*)"
        type="number"
        min={0}
        {...register('stockQuantity', { valueAsNumber: true })}
        error={errors.stockQuantity?.message}
      />

      {/* Action Footer */}
      <div className="pt-3 border-t border-stone-200 flex justify-end gap-2.5">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={updateMutation.isPending}
        >
          Hủy
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={updateMutation.isPending}
          leftIcon={<IconCheck className="w-4 h-4" />}
        >
          Lưu thay đổi
        </Button>
      </div>
    </form>
  );
};

export const EditPartModal: React.FC<EditPartModalProps> = ({
  open,
  onOpenChange,
  part,
}) => {
  if (!part) return null;

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Chỉnh sửa linh kiện kho"
      description={`Cập nhật thông tin chi tiết, đơn giá hoặc số lượng cho SKU #${part.id}`}
      size="md"
      hideFooter={true}
    >
      <EditPartFormContent
        key={`${part.id}_${open}`}
        part={part}
        onClose={() => onOpenChange(false)}
      />
    </BaseModal>
  );
};
