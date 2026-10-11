'use client';

import { yupResolver } from '@hookform/resolvers/yup';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSnapshot } from 'valtio';
import { formatTicketCode } from '@/common/helpers/ticket.helper';
import { useTechnicians } from '@/hooks/useEmployees';
import { useAddInvoicePart, useCreateInvoice, useDeleteInvoicePart } from '@/hooks/useInvoices';
import { useParts } from '@/hooks/useParts';
import {
  useAssignTechnician,
  useProcessTicket,
  useTickets,
} from '@/hooks/useTickets';
import { DiagnosisFormValues, diagnosisSchema } from '@/schemas/diagnosis.schema';
import { authState } from '@/stores/auth.store';
import { uiActions } from '@/stores/ui.store';
import { getErrorMessage, Ticket, TicketQueryParams, TicketStatus } from '@/types';

export function useTechnicianWorkbench() {
  const { user } = useSnapshot(authState);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [selectedTechId, setSelectedTechId] = useState<number | null>(null);
  const [diagnosisModalOpen, setDiagnosisModalOpen] = useState(false);
  const [filterMyTicketsOnly, setFilterMyTicketsOnly] = useState(false);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);

  const handleFilterMyTicketsOnly = (val: boolean) => {
    setFilterMyTicketsOnly(val);
    setPage(1);
  };

  const queryParams: TicketQueryParams = useMemo(() => {
    const params: TicketQueryParams = { page, limit: pageSize };
    if (filterMyTicketsOnly && user) {
      params.technicianId = user.id;
    }
    return params;
  }, [filterMyTicketsOnly, user, page, pageSize]);

  const { data: ticketsData, isLoading, refetch } = useTickets(queryParams);

  const assignTechMutation = useAssignTechnician();
  const processTicketMutation = useProcessTicket();
  const createInvoiceMutation = useCreateInvoice();
  const addPartMutation = useAddInvoicePart();
  const deletePartMutation = useDeleteInvoicePart();
  const { data: partsData } = useParts();
  const { data: technicians = [] } = useTechnicians();

  const tickets = useMemo(() => ticketsData?.items || [], [ticketsData?.items]);
  const totalPages = ticketsData?.meta?.totalPages || 1;
  const totalItems = ticketsData?.meta?.totalItems !== undefined ? ticketsData.meta.totalItems : tickets.length;
  const parts = useMemo(() => partsData?.items || [], [partsData?.items]);

  const selectedTicket = useMemo(() => {
    if (!selectedTicketId) return null;
    return tickets.find((t) => t.id === selectedTicketId) || null;
  }, [tickets, selectedTicketId]);

  const diagnosisForm = useForm<DiagnosisFormValues>({
    resolver: yupResolver(diagnosisSchema),
    defaultValues: {
      status: TicketStatus.INSPECTING,
      faultCause: '',
      repairSolution: '',
      estimatedCost: 0,
    },
  });

  const handleClaimTicket = async (ticket: Ticket) => {
    if (!user) return;
    try {
      await assignTechMutation.mutateAsync({
        ticketId: ticket.id,
        technicianId: user.id,
      });
      await refetch();
      uiActions.addToast({
        type: 'success',
        title: 'Nhận xử lý phiếu thành công',
        message: `Đã phân công phiếu #${formatTicketCode(ticket.id)} cho bạn`,
      });
    } catch (err: unknown) {
      uiActions.addToast({
        type: 'error',
        title: 'Không thể nhận phiếu',
        message: getErrorMessage(err, 'Không thể nhận phiếu'),
      });
    }
  };

  const handleOpenDiagnosis = (ticket: Ticket) => {
    setSelectedTicketId(ticket.id);
    setSelectedTechId(ticket.technician?.id || null);
    diagnosisForm.reset({
      status:
        ticket.status === TicketStatus.RECEIVED
          ? TicketStatus.INSPECTING
          : ticket.status,
      faultCause: ticket.faultCause || '',
      repairSolution: ticket.repairSolution || '',
      estimatedCost: Number(ticket.estimatedCost) || 0,
    });
    setDiagnosisModalOpen(true);
  };

  const onDiagnosisSubmit = async (values: DiagnosisFormValues) => {
    if (!selectedTicket || !user) return;
    try {
      if (selectedTechId && selectedTechId !== selectedTicket.technician?.id) {
        await assignTechMutation.mutateAsync({
          ticketId: selectedTicket.id,
          technicianId: selectedTechId,
        });
      }

      await processTicketMutation.mutateAsync({
        ticketId: selectedTicket.id,
        status: values.status,
        faultCause: values.faultCause,
        repairSolution: values.repairSolution,
        estimatedCost: values.estimatedCost,
      });

      await refetch();
      setDiagnosisModalOpen(false);
      uiActions.addToast({
        type: 'success',
        title: 'Cập nhật tiến trình thành công',
        message: `Phiếu #${formatTicketCode(selectedTicket.id)} đã cập nhật thành công`,
      });
    } catch (err: unknown) {
      uiActions.addToast({
        type: 'error',
        title: 'Cập nhật tiến trình thất bại',
        message: getErrorMessage(err, 'Cập nhật tiến trình thất bại'),
      });
    }
  };

  const handleAddPartToTicket = async (partId: number, quantity: number) => {
    if (!selectedTicket || !partId || quantity <= 0) return;

    try {
      let activeInvoiceId = selectedTicket.invoices?.[0]?.id;

      if (!activeInvoiceId) {
        const inv = await createInvoiceMutation.mutateAsync({
          ticketId: selectedTicket.id,
          laborFee: Number(selectedTicket.estimatedCost) || 0,
        });
        activeInvoiceId = inv.id;
      }

      await addPartMutation.mutateAsync({
        invoiceId: activeInvoiceId,
        partId,
        quantity,
      });

      uiActions.addToast({
        type: 'success',
        title: 'Đã xuất linh kiện thành công',
        message: 'Linh kiện đã được thêm vào phiếu sửa chữa',
      });
    } catch (err: unknown) {
      uiActions.addToast({
        type: 'error',
        title: 'Xuất linh kiện thất bại',
        message: getErrorMessage(err, 'Xuất linh kiện thất bại'),
      });
      throw err;
    }
  };

  const handleRemovePartFromTicket = async (partId: number) => {
    if (!selectedTicket || !partId) return;
    const activeInvoiceId = selectedTicket.invoices?.[0]?.id;
    if (!activeInvoiceId) return;

    try {
      await deletePartMutation.mutateAsync({
        invoiceId: activeInvoiceId,
        partId,
      });

      uiActions.addToast({
        type: 'success',
        title: 'Đã xóa linh kiện',
        message: 'Linh kiện đã được hoàn kho thành công',
      });
    } catch (err: unknown) {
      uiActions.addToast({
        type: 'error',
        title: 'Xóa linh kiện thất bại',
        message: getErrorMessage(err, 'Không thể xóa linh kiện'),
      });
      throw err;
    }
  };

  return {
    tickets,
    parts,
    technicians,
    user,
    isLoading,
    refetch,
    filterMyTicketsOnly,
    setFilterMyTicketsOnly: handleFilterMyTicketsOnly,
    page,
    setPage,
    pageSize,
    totalPages,
    totalItems,
    selectedTicket,
    selectedTechId,
    setSelectedTechId,
    diagnosisModalOpen,
    setDiagnosisModalOpen,
    diagnosisForm,
    handleClaimTicket,
    handleOpenDiagnosis,
    onDiagnosisSubmit,
    handleAddPartToTicket,
    handleRemovePartFromTicket,
    isAssigning: assignTechMutation.isPending,
    isProcessing: processTicketMutation.isPending,
    isAddingPart: addPartMutation.isPending || createInvoiceMutation.isPending,
    isRemovingPart: deletePartMutation.isPending,
  };
}
