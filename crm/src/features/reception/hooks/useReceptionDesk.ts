'use client';

import { yupResolver } from '@hookform/resolvers/yup';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { formatTicketCode } from '@/common/helpers/ticket.helper';
import {
  useCreateCustomer,
  useCreateDevice,
  useCustomerByPhone,
} from '@/hooks/useCustomers';
import { useCreateTicket } from '@/hooks/useTickets';
import { ReceptionFormValues, receptionSchema } from '@/schemas/reception.schema';
import { uiActions } from '@/stores/ui.store';
import { getErrorMessage, Ticket } from '@/types';

export function useReceptionDesk() {
  const [createdTicket, setCreatedTicket] = useState<Ticket | null>(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  const form = useForm<ReceptionFormValues>({
    resolver: yupResolver(receptionSchema),
    defaultValues: {
      customerPhone: '',
      customerName: '',
      deviceName: '',
      isUnderWarranty: false,
      ticketType: 'repair',
    },
  });

  const { register, handleSubmit, setValue, watch, reset, formState } = form;
  const phoneValue = watch('customerPhone');
  const isUnderWarranty = watch('isUnderWarranty');

  // Customer phone live auto-lookup
  const { data: existingCustomer, isFetching: isSearchingCustomer } =
    useCustomerByPhone(phoneValue);

  useEffect(() => {
    if (existingCustomer) {
      setValue('customerName', existingCustomer.fullName);
      setValue('customerEmail', existingCustomer.email || '');
      setValue('customerAddress', existingCustomer.address || '');
    }
  }, [existingCustomer, setValue]);

  const createCustomerMutation = useCreateCustomer();
  const createDeviceMutation = useCreateDevice();
  const createTicketMutation = useCreateTicket();

  const isSubmitting =
    createCustomerMutation.isPending ||
    createDeviceMutation.isPending ||
    createTicketMutation.isPending;

  const onSubmit = async (data: ReceptionFormValues) => {
    try {
      // 1. Resolve or create customer
      let customerId = existingCustomer?.id;
      if (!customerId) {
        const newCustomer = await createCustomerMutation.mutateAsync({
          fullName: data.customerName,
          phoneNumber: data.customerPhone,
          email: data.customerEmail || null,
          address: data.customerAddress || null,
        });
        customerId = newCustomer.id;
      }

      // 2. Register device
      const newDevice = await createDeviceMutation.mutateAsync({
        customerId,
        deviceName: data.deviceName,
        deviceType: data.deviceType || null,
        brand: data.brand || null,
        serialNumber: data.serialNumber || null,
        isUnderWarranty: !!data.isUnderWarranty,
        warrantyExpiryDate: data.warrantyExpiryDate || null,
      });

      // 3. Stored procedure sp_receive_device via API
      const newTicket = await createTicketMutation.mutateAsync({
        deviceId: newDevice.id,
        issueDescription: data.issueDescription,
        initialCondition: data.initialCondition,
        accessories: data.accessories,
        ticketType: data.ticketType,
      });

      setCreatedTicket({
        ...newTicket,
        device: {
          ...newDevice,
          customer: existingCustomer || {
            id: customerId,
            fullName: data.customerName,
            phoneNumber: data.customerPhone,
          },
        },
      } as Ticket);

      setReceiptModalOpen(true);
      reset();

      uiActions.addToast({
        type: 'success',
        title: 'Tiếp nhận thành công',
        message: `Phiếu #${formatTicketCode(newTicket.id)} đã được khởi tạo trên hệ thống`,
      });
    } catch (err: unknown) {
      uiActions.addToast({
        type: 'error',
        title: 'Lỗi tiếp nhận thiết bị',
        message: getErrorMessage(err, 'Lỗi tiếp nhận thiết bị'),
      });
    }
  };

  return {
    form,
    register,
    handleSubmit,
    setValue,
    watch,
    errors: formState.errors,
    isUnderWarranty,
    existingCustomer,
    isSearchingCustomer,
    createdTicket,
    receiptModalOpen,
    setReceiptModalOpen,
    isSubmitting,
    onSubmit,
  };
}
