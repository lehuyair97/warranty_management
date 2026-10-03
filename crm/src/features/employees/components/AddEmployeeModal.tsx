'use client';

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { BaseModal } from '@/components/core/BaseModal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { EmployeeFormValues } from '@/schemas/employee.schema';
import { EmployeeRole } from '@/types';

interface AddEmployeeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<EmployeeFormValues>;
  onSubmit: (values: EmployeeFormValues) => void;
  isLoading: boolean;
}

export const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({
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
      title="Cấp tài khoản nhân viên mới"
      description="Tạo tài khoản đăng nhập nội bộ và phân quyền truy cập hệ thống UIT CARE."
      primaryActionLabel="Tạo tài khoản"
      onPrimaryAction={handleSubmit(onSubmit)}
      isPrimaryActionLoading={isLoading}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Input
          label="Tên đăng nhập (Username)"
          placeholder="VD: nv_letan1"
          {...register('username')}
          error={errors.username?.message}
        />
        <Input
          label="Họ và tên nhân sự"
          placeholder="VD: Trần Văn Nam"
          {...register('fullName')}
          error={errors.fullName?.message}
        />
        <Input
          label="Mật khẩu khởi tạo"
          type="password"
          placeholder="Tối thiểu 6 ký tự"
          {...register('password')}
          error={errors.password?.message}
        />
        <Select
          label="Vai trò & phân quyền"
          {...register('role')}
          error={errors.role?.message}
          options={[
            { value: EmployeeRole.RECEPTIONIST, label: 'Lễ tân tiếp nhận & thanh toán' },
            { value: EmployeeRole.TECHNICIAN, label: 'Kỹ thuật viên sửa chữa' },
            { value: EmployeeRole.MANAGER, label: 'Quản trị viên (Manager)' },
          ]}
        />
      </form>
    </BaseModal>
  );
};
