'use client';

import { yupResolver } from '@hookform/resolvers/yup';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSnapshot } from 'valtio';
import { useCreatePart, useDeletePart, useParts, useUpdatePart } from '@/hooks/useParts';
import { PartFormValues, partSchema } from '@/schemas/part.schema';
import { authState } from '@/stores/auth.store';
import { uiActions } from '@/stores/ui.store';
import { EmployeeRole, getErrorMessage, Part } from '@/types';

/**
 * Controller Hook managing inventory catalog business logic, form validation, and stock mutations.
 */
export function useInventoryCatalog() {
  const { user } = useSnapshot(authState);
  const isManager = user?.role === EmployeeRole.MANAGER;

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedEditPart, setSelectedEditPart] = useState<Part | null>(null);

  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);

  const queryParams = useMemo(() => ({ page, limit: pageSize }), [page, pageSize]);
  const { data: partsData, isLoading, refetch } = useParts(queryParams);
  const createPartMutation = useCreatePart();
  const updatePartMutation = useUpdatePart();
  const deletePartMutation = useDeletePart();

  const form = useForm<PartFormValues>({
    resolver: yupResolver(partSchema),
    defaultValues: {
      partName: '',
      partCode: '',
      stockQuantity: 10,
      price: 200000,
      unit: 'Cái',
    },
  });

  const onAddSubmit = async (values: PartFormValues) => {
    try {
      await createPartMutation.mutateAsync(values);
      setAddModalOpen(false);
      form.reset();
      uiActions.addToast({
        type: 'success',
        title: 'Thêm linh kiện thành công',
        message: `Đã thêm ${values.partName} (${values.partCode}) vào kho`,
      });
    } catch (err: unknown) {
      uiActions.addToast({
        type: 'error',
        title: 'Thêm linh kiện thất bại',
        message: getErrorMessage(err, 'Thêm linh kiện thất bại'),
      });
    }
  };

  const handleOpenEdit = (part: Part) => {
    setSelectedEditPart(part);
    setEditModalOpen(true);
  };

  const handleDeletePart = async (part: Part) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa linh kiện "${part.partName}" khỏi kho?`)) {
      return;
    }

    try {
      await deletePartMutation.mutateAsync(part.id);
      uiActions.addToast({
        type: 'success',
        title: 'Xóa thành công',
        message: `Đã xóa linh kiện "${part.partName}" khỏi danh mục kho`,
      });
    } catch (err: unknown) {
      uiActions.addToast({
        type: 'error',
        title: 'Xóa thất bại',
        message: getErrorMessage(
          err,
          'Không thể xóa linh kiện (có thể đã phát sinh trong hóa đơn thanh toán).',
        ),
      });
    }
  };

  const parts = partsData?.items || [];
  const totalPages = partsData?.meta?.totalPages || 1;
  const totalItems = partsData?.meta?.totalItems !== undefined ? partsData.meta.totalItems : parts.length;
  const lowStockCount = parts.filter((p) => p.stockQuantity <= 5).length;

  return {
    parts,
    lowStockCount,
    isLoading,
    refetch,
    page,
    setPage,
    pageSize,
    totalPages,
    totalItems,
    isManager,
    form,
    addModalOpen,
    setAddModalOpen,
    editModalOpen,
    setEditModalOpen,
    selectedEditPart,
    handleOpenEdit,
    handleDeletePart,
    onAddSubmit,
    isCreating: createPartMutation.isPending,
    isUpdating: updatePartMutation.isPending,
  };
}
