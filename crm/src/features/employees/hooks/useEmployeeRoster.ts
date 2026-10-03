'use client';

import { yupResolver } from '@hookform/resolvers/yup';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSnapshot } from 'valtio';
import {
  useCreateEmployee,
  useDeactivateEmployee,
  useEmployees,
  useUpdateEmployee,
} from '@/hooks/useEmployees';
import { EmployeeFormValues, employeeSchema } from '@/schemas/employee.schema';
import { authState } from '@/stores/auth.store';
import { uiActions } from '@/stores/ui.store';
import { EmployeeQueryParams, EmployeeRole, getErrorMessage, UserProfile } from '@/types';

export function useEmployeeRoster() {
  const { user } = useSnapshot(authState);
  const isManager = user?.role === EmployeeRole.MANAGER;

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<UserProfile | null>(null);

  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);

  const queryParams: EmployeeQueryParams = useMemo(() => ({ page, limit: pageSize }), [page, pageSize]);
  const { data: employeesData, isLoading, refetch } = useEmployees(queryParams);
  const createEmployeeMutation = useCreateEmployee();
  const updateEmployeeMutation = useUpdateEmployee();
  const deactivateEmployeeMutation = useDeactivateEmployee();

  const form = useForm<EmployeeFormValues>({
    resolver: yupResolver(employeeSchema),
    defaultValues: {
      username: '',
      password: '',
      fullName: '',
      role: EmployeeRole.TECHNICIAN,
    },
  });

  const onAddSubmit = async (values: EmployeeFormValues) => {
    try {
      await createEmployeeMutation.mutateAsync(values);
      setAddModalOpen(false);
      form.reset();
      uiActions.addToast({
        type: 'success',
        title: 'Tạo tài khoản thành công',
        message: `Đã cấp tài khoản ${values.username} với vai trò ${values.role}`,
      });
    } catch (err: unknown) {
      uiActions.addToast({
        type: 'error',
        title: 'Tạo tài khoản thất bại',
        message: getErrorMessage(err, 'Tạo tài khoản thất bại'),
      });
    }
  };

  const handleOpenEdit = (emp: UserProfile) => {
    setSelectedEmployee(emp);
    setEditModalOpen(true);
  };

  const handleToggleActive = async (emp: UserProfile) => {
    if (emp.id === user?.id) {
      uiActions.addToast({
        type: 'warning',
        title: 'Thao tác không hợp lệ',
        message: 'Bạn không thể tự khóa tài khoản của chính mình',
      });
      return;
    }

    const isActive = emp.isActive !== false;

    if (isActive) {
      if (
        !confirm(
          `Bạn có chắc chắn muốn khóa tài khoản nhân viên ${emp.fullName} (${emp.username})?`,
        )
      ) {
        return;
      }

      try {
        await deactivateEmployeeMutation.mutateAsync(emp.id);
        uiActions.addToast({
          type: 'success',
          title: 'Đã khóa tài khoản',
          message: `Tài khoản ${emp.username} đã bị vô hiệu hóa`,
        });
      } catch (err: unknown) {
        uiActions.addToast({
          type: 'error',
          title: 'Khóa tài khoản thất bại',
          message: getErrorMessage(err, 'Khóa tài khoản thất bại'),
        });
      }
    } else {
      try {
        await updateEmployeeMutation.mutateAsync({
          id: emp.id,
          dto: { isActive: true },
        });
        uiActions.addToast({
          type: 'success',
          title: 'Đã mở khóa tài khoản',
          message: `Tài khoản ${emp.username} đã được kích hoạt lại thành công`,
        });
      } catch (err: unknown) {
        uiActions.addToast({
          type: 'error',
          title: 'Mở khóa thất bại',
          message: getErrorMessage(err, 'Mở khóa tài khoản thất bại'),
        });
      }
    }
  };

  const employees = employeesData?.items || [];
  const totalPages = employeesData?.meta?.totalPages || 1;
  const totalItems = employeesData?.meta?.totalItems !== undefined ? employeesData.meta.totalItems : employees.length;

  return {
    employees,
    isLoading,
    refetch,
    page,
    setPage,
    pageSize,
    totalPages,
    totalItems,
    isManager,
    currentUserId: user?.id,
    form,
    addModalOpen,
    setAddModalOpen,
    editModalOpen,
    setEditModalOpen,
    selectedEmployee,
    onAddSubmit,
    handleOpenEdit,
    handleToggleActive,
    isCreating: createEmployeeMutation.isPending,
  };
}
