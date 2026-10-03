'use client';

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { BaseModal } from '@/components/core/BaseModal';
import { Input } from '@/components/ui/input';
import { PartFormValues } from '@/schemas/part.schema';

interface AddPartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<PartFormValues>;
  onSubmit: (values: PartFormValues) => void;
  isLoading: boolean;
}

export const AddPartModal: React.FC<AddPartModalProps> = ({
  open,
  onOpenChange,
  form,
  onSubmit,
  isLoading,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Thêm linh kiện mới"
      description="Nhập thông tin linh kiện thay thế mới vào danh mục kho phụ tùng."
      primaryActionLabel="Lưu linh kiện"
      onPrimaryAction={handleSubmit(onSubmit)}
      isPrimaryActionLoading={isLoading}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Input
          label="Mã linh kiện"
          placeholder="VD: RAM-DDR4-8G"
          {...register('partCode')}
          error={errors.partCode?.message}
        />
        <Input
          label="Tên linh kiện & thông số"
          placeholder="VD: RAM Laptop Kingston 8GB DDR4 3200MHz"
          {...register('partName')}
          error={errors.partName?.message}
        />
        <div className="grid grid-cols-3 gap-3">
          <Input
            label="Đơn vị tính"
            placeholder="Cái, Thanh, Bộ..."
            {...register('unit')}
            error={errors.unit?.message}
          />
          <Input
            label="Số lượng nhập kho"
            type="number"
            {...register('stockQuantity', { valueAsNumber: true })}
            error={errors.stockQuantity?.message}
          />
          <Input
            label="Đơn giá niêm yết (VND)"
            type="number"
            {...register('price', { valueAsNumber: true })}
            error={errors.price?.message}
          />
        </div>
      </form>
    </BaseModal>
  );
};
