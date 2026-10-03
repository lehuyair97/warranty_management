'use client';

import { yupResolver } from '@hookform/resolvers/yup';
import React from 'react';
import { useForm } from 'react-hook-form';
import { IconCheck, IconUser } from '@/assets/icon';
import { BaseModal } from '@/components/core/BaseModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useUpdateEmployee } from '@/hooks/useEmployees';
import {
  UpdateEmployeeFormValues,
  updateEmployeeSchema,
} from '@/schemas/employee.schema';
import { uiActions } from '@/stores/ui.store';
import { EmployeeRole, getErrorMessage, UpdateEmployeeDto, UserProfile } from '@/types';

interface EditEmployeeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: UserProfile | null;
}

interface EditEmployeeFormContentProps {
  employee: UserProfile;
  onClose: () => void;
}

const EditEmployeeFormContent: React.FC<EditEmployeeFormContentProps> = ({
  employee,
  onClose,
}) => {
  const updateMutation = useUpdateEmployee();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateEmployeeFormValues>({
    resolver: yupResolver(updateEmployeeSchema),
    defaultValues: {
      fullName: employee.fullName || '',
      role: employee.role,
      phoneNumber: employee.phoneNumber || '',
      email: employee.email || '',
      password: '',
      isActive: employee.isActive !== undefined ? employee.isActive : true,
    },
  });

  const onSubmit = async (values: UpdateEmployeeFormValues) => {
    const payload: UpdateEmployeeDto = {
      fullName: values.fullName.trim(),
      role: values.role,
      phoneNumber: values.phoneNumber?.trim() || null,
      email: values.email?.trim() || null,
      isActive: values.isActive,
    };

    if (values.password && values.password.trim()) {
      payload.password = values.password.trim();
    }

    try {
      await updateMutation.mutateAsync({
        id: employee.id,
        dto: payload,
      });

      uiActions.addToast({
        type: 'success',
        title: 'Cập nhật thành công',
        message: `Đã lưu thay đổi thông tin nhân sự: ${values.fullName}`,
      });
      onClose();
    } catch (err: unknown) {
      uiActions.addToast({
        type: 'error',
        title: 'Cập nhật thất bại',
        message: getErrorMessage(err, 'Không thể cập nhật thông tin nhân sự.'),
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {/* Account Info Banner */}
      <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
        <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center text-stone-700">
          <IconUser className="w-5 h-5" />
        </div>
        <div>
          <span className="text-xs text-stone-500 font-medium block">Tài khoản đăng nhập</span>
          <span className="text-sm font-mono font-bold text-stone-900">{employee.username}</span>
        </div>
      </div>

      <Input
        label="Họ và tên nhân sự (*)"
        placeholder="VD: Nguyễn Văn A"
        {...register('fullName')}
        error={errors.fullName?.message}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select
          label="Vai trò & phân quyền (*)"
          {...register('role')}
          error={errors.role?.message}
          options={[
            { value: EmployeeRole.RECEPTIONIST, label: 'Lễ tân tiếp nhận' },
            { value: EmployeeRole.TECHNICIAN, label: 'Kỹ thuật viên' },
            { value: EmployeeRole.MANAGER, label: 'Quản trị viên (Manager)' },
          ]}
        />

        <Select
          label="Trạng thái tài khoản"
          {...register('isActive', {
            setValueAs: (v) => v === 'true' || v === true,
          })}
          error={errors.isActive?.message}
          options={[
            { value: 'true', label: 'Đang hoạt động' },
            { value: 'false', label: 'Tạm khóa (Vô hiệu)' },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Số điện thoại"
          placeholder="VD: 0987654321"
          {...register('phoneNumber')}
          error={errors.phoneNumber?.message}
        />

        <Input
          label="Email liên hệ"
          type="email"
          placeholder="VD: nhanvien@uitcare.vn"
          {...register('email')}
          error={errors.email?.message}
        />
      </div>

      <Input
        label="Đổi mật khẩu mới (Bỏ trống nếu không thay đổi)"
        type="password"
        placeholder="Tối thiểu 6 ký tự"
        {...register('password')}
        error={errors.password?.message}
      />

      {/* Action Footer Buttons */}
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

export const EditEmployeeModal: React.FC<EditEmployeeModalProps> = ({
  open,
  onOpenChange,
  employee,
}) => {
  if (!employee) return null;

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Chỉnh sửa thông tin nhân sự"
      description={`Cập nhật vai trò, hồ sơ hoặc cấp lại mật khẩu cho nhân sự #${employee.id}`}
      size="md"
      hideFooter={true}
    >
      <EditEmployeeFormContent
        key={`${employee.id}_${open}`}
        employee={employee}
        onClose={() => onOpenChange(false)}
      />
    </BaseModal>
  );
};
