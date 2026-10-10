'use client';

import React, { useMemo, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
  IconCheckCircle,
  IconChevronDown,
  IconPackageCheck,
  IconPlus,
  IconTag,
  IconUserCheck,
  IconWrench,
  IconX,
} from '@/assets/icon';
import { formatVND } from '@/common/helpers/currency.helper';
import { formatTicketCode } from '@/common/helpers/ticket.helper';
import { BaseModal } from '@/components/core/BaseModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { DiagnosisFormValues } from '@/schemas/diagnosis.schema';
import { Part, Ticket, TicketStatus, UserProfile } from '@/types';

interface LocalAttachedPart {
  partId: number;
  partName: string;
  partCode: string;
  quantity: number;
  unitPrice: number;
  unit: string;
}

interface DiagnosisModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: Ticket | null;
  form: UseFormReturn<DiagnosisFormValues>;
  onSubmit: (values: DiagnosisFormValues) => void;
  isLoading: boolean;
  technicians: UserProfile[];
  selectedTechId: number | null;
  onSelectTechnician: (techId: number) => void;
  parts: Part[];
  onAddPart: (partId: number, quantity: number) => Promise<void>;
  onRemovePart?: (partId: number) => Promise<void>;
  isAddingPart?: boolean;
}

export const DiagnosisModal: React.FC<DiagnosisModalProps> = ({
  open,
  onOpenChange,
  ticket,
  form,
  onSubmit,
  isLoading,
  technicians,
  selectedTechId,
  onSelectTechnician,
  parts,
  onAddPart,
  onRemovePart,
  isAddingPart = false,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  const [inlinePartId, setInlinePartId] = useState<number>(0);
  const [inlineQuantity, setInlineQuantity] = useState<number>(1);
  const [addedParts, setAddedParts] = useState<LocalAttachedPart[]>([]);
  const [removedPartIds, setRemovedPartIds] = useState<number[]>([]);

  // Base server attached parts from ticket
  const serverParts = useMemo<LocalAttachedPart[]>(() => {
    const items = ticket?.items && ticket.items.length > 0
      ? ticket.items
      : (ticket?.invoices?.[0]?.items || []);
    return items.map((item: any) => ({
      partId: item.partId,
      partName: item.part?.partName || 'Linh kiện',
      partCode: item.part?.partCode || '',
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice) || 0,
      unit: item.part?.unit || 'cái',
    }));
  }, [ticket]);

  // Derived active parts list incorporating local-first additions and removals
  const localParts = useMemo<LocalAttachedPart[]>(() => {
    const filteredServer = serverParts.filter((p) => !removedPartIds.includes(p.partId));
    return [...filteredServer, ...addedParts];
  }, [serverParts, removedPartIds, addedParts]);

  // Calculate total attached spare parts cost from local first parts
  const totalPartsCost = useMemo(() => {
    return localParts.reduce((sum, item) => {
      const price = item.unitPrice * item.quantity;
      return sum + (Number.isNaN(price) ? 0 : price);
    }, 0);
  }, [localParts]);

  // Filter out already added parts from dropdown options
  const availableParts = useMemo(() => {
    const selectedPartIds = new Set(localParts.map((item) => item.partId));
    return parts.filter((p) => !selectedPartIds.has(p.id));
  }, [parts, localParts]);

  const selectedPart = parts.find((p) => p.id === inlinePartId);

  const handleInlineAddPart = async () => {
    if (!inlinePartId || inlineQuantity <= 0) return;
    const partObj = parts.find((p) => p.id === inlinePartId);
    if (!partObj) return;

    const newItem: LocalAttachedPart = {
      partId: partObj.id,
      partName: partObj.partName,
      partCode: partObj.partCode,
      quantity: inlineQuantity,
      unitPrice: Number(partObj.price) || 0,
      unit: partObj.unit,
    };

    // 1. Local-first immediate UI update
    setRemovedPartIds((prev) => prev.filter((id) => id !== partObj.id));
    setAddedParts((prev) => [...prev.filter((p) => p.partId !== partObj.id), newItem]);
    const addedPartId = inlinePartId;
    const addedQuantity = inlineQuantity;
    setInlinePartId(0);
    setInlineQuantity(1);

    // 2. Concurrently persist with backend
    try {
      await onAddPart(addedPartId, addedQuantity);
    } catch {
      // Rollback on failure
      setAddedParts((prev) => prev.filter((p) => p.partId !== addedPartId));
    }
  };

  const handleRemovePart = async (partId: number) => {
    // 1. Local-first immediate removal
    setAddedParts((prev) => prev.filter((p) => p.partId !== partId));
    setRemovedPartIds((prev) => [...prev, partId]);

    // 2. Concurrently persist with backend
    if (onRemovePart) {
      try {
        await onRemovePart(partId);
      } catch {
        // Rollback on failure
        setRemovedPartIds((prev) => prev.filter((id) => id !== partId));
      }
    }
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title={`Cập nhật chẩn đoán & tiến trình: ${
        ticket ? formatTicketCode(ticket.id) : ''
      }`}
      description="Chẩn đoán lỗi, phân công kỹ thuật viên, xuất linh kiện thay thế và cập nhật trạng thái phiếu."
      primaryActionLabel="Lưu thay đổi & Cập nhật"
      onPrimaryAction={handleSubmit(onSubmit)}
      isPrimaryActionLoading={isLoading}
      size="xl"
    >
      <div className="space-y-5">
        {/* Device & Customer Summary Banner */}
        <div className="p-4 bg-stone-50/80 rounded-2xl border border-stone-200 text-xs grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <span className="text-stone-500 block mb-0.5 font-medium">Thiết bị nhận sửa:</span>
            <div className="font-bold text-stone-900 text-sm">
              {ticket?.device?.deviceName}
            </div>
            <div className="text-stone-600 font-mono text-[11px] mt-0.5">
              S/N: {ticket?.device?.serialNumber || 'Không có'} | {ticket?.device?.brand || 'N/A'}
            </div>
          </div>

          <div>
            <span className="text-stone-500 block mb-0.5 font-medium">Khách hàng:</span>
            <div className="font-semibold text-stone-900">
              {ticket?.device?.customer?.fullName}
            </div>
            <div className="text-stone-600 font-mono text-[11px] mt-0.5">
              SĐT: {ticket?.device?.customer?.phoneNumber}
            </div>
          </div>

          <div>
            <span className="text-stone-500 block mb-0.5 font-medium">Hiện trạng lỗi lúc nhận:</span>
            <div className="text-stone-700 font-medium line-clamp-2">
              {ticket?.issueDescription || 'Không có mô tả'}
            </div>
          </div>
        </div>

        {/* Section 1: Technician Assignment */}
        <div className="p-4 rounded-2xl bg-white border border-stone-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconUserCheck className="w-4 h-4 text-amber-700 shrink-0" />
              <span className="text-xs font-bold text-stone-900 uppercase tracking-wider leading-none">
                Kỹ thuật viên phụ trách sửa chữa
              </span>
            </div>
            {selectedTechId ? (
              <Badge variant="outline" size="sm" className="bg-emerald-50 text-emerald-800 border-emerald-200">
                <IconCheckCircle className="w-3 h-3 text-emerald-600 mr-1 shrink-0" />
                Đã phân công
              </Badge>
            ) : (
              <Badge variant="outline" size="sm" className="bg-amber-50 text-amber-800 border-amber-200">
                Chưa phân công
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <div className="relative flex items-center w-full">
              <select
                value={selectedTechId || ''}
                onChange={(e) => onSelectTechnician(Number(e.target.value) || 0)}
                className="h-10 px-3.5 pr-10 text-xs font-medium rounded-xl border border-sand-200 bg-white text-stone-900 focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 appearance-none cursor-pointer w-full"
              >
                <option value="">-- Chưa chỉ định (Chọn KTV) --</option>
                {technicians.map((tech) => (
                  <option key={tech.id} value={tech.id}>
                    {tech.fullName} ({tech.username}) - {tech.phoneNumber || 'KTV'}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-3.5 flex items-center justify-center pointer-events-none text-stone-400">
                <IconChevronDown size={15} className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-[11px] text-stone-500">
              Quản lý có thể điều phối lại hoặc KTV tiếp nhận sửa chữa cho phiếu này.
            </p>
          </div>
        </div>

        {/* Section 2: Diagnosis & Status Workflow */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="p-4 rounded-2xl bg-white border border-stone-200 space-y-4">
            <div className="flex items-center gap-2">
              <IconWrench className="w-4 h-4 text-amber-700 shrink-0" />
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider leading-none">
                Chẩn đoán kỹ thuật & Chuyển trạng thái
              </h4>
            </div>

            <Select
              label="Chuyển trạng thái xử lý (*)"
              {...register('status')}
              error={errors.status?.message}
              options={[
                { value: TicketStatus.INSPECTING, label: 'Đang kiểm tra & chẩn đoán (Inspecting)' },
                { value: TicketStatus.WAITING_FOR_PARTS, label: 'Chờ linh kiện thay thế (Waiting for Parts)' },
                { value: TicketStatus.REPAIRING, label: 'Đang tiến hành sửa chữa (Repairing)' },
                { value: TicketStatus.COMPLETED, label: 'Đã hoàn thành sửa chữa (Completed - Chờ giao khách)' },
              ]}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <Input
                label="Nguyên nhân hư hỏng xác định"
                placeholder="VD: Chập IC nguồn, chết tụ cao áp, pin bị chai..."
                {...register('faultCause')}
                error={errors.faultCause?.message}
              />

              <Input
                label="Giải pháp kỹ thuật & phương án khắc phục"
                placeholder="VD: Thay thế cụm màn hình, hàn lại chân tiếp xúc..."
                {...register('repairSolution')}
                error={errors.repairSolution?.message}
              />
            </div>

            <Input
              label="Chi phí nhân công / dịch vụ dự tính (VND)"
              type="number"
              placeholder="VD: 150000"
              {...register('estimatedCost', { valueAsNumber: true })}
              error={errors.estimatedCost?.message}
            />
          </div>
        </form>

        {/* Section 3: Spare Parts (Tags / Chips Container & Quick Add) */}
        <div className="p-4 rounded-2xl bg-white border border-stone-200 space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <IconPackageCheck className="w-4 h-4 text-amber-700 shrink-0" />
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider leading-none">
                Linh kiện thay thế sử dụng ({localParts.length})
              </h4>
            </div>
            {localParts.length > 0 && (
              <span className="text-xs text-stone-600">
                Tổng tiền linh kiện:{' '}
                <strong className="text-amber-900 font-mono font-bold">
                  {formatVND(totalPartsCost)}
                </strong>
              </span>
            )}
          </div>

          {/* Render Active Part Tags / Chips */}
          <div className="min-h-[50px] flex items-center">
            {localParts.length > 0 ? (
              <div className="flex flex-wrap gap-2 w-full">
                {localParts.map((item) => {
                  const itemPrice = item.unitPrice * item.quantity;
                  return (
                    <span
                      key={item.partId}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50/90 border border-amber-200 text-xs font-medium text-amber-950 shadow-2xs hover:bg-amber-100/70 transition-all duration-150"
                    >
                      <IconTag className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span className="font-semibold">{item.partName}</span>
                      <span className="px-1.5 py-0.5 rounded-md bg-amber-200/60 text-[10px] font-bold text-amber-900">
                        x{item.quantity}
                      </span>
                      <span className="font-bold text-amber-900 font-mono text-[11px]">
                        {formatVND(itemPrice)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemovePart(item.partId)}
                        disabled={isAddingPart}
                        className="ml-1 p-0.5 rounded-md hover:bg-amber-200 text-amber-800 hover:text-amber-950 transition-colors cursor-pointer"
                        title="Bỏ linh kiện này"
                      >
                        <IconX className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  );
                })}
              </div>
            ) : (
              <div className="w-full text-xs text-stone-500 italic p-3 bg-stone-50 rounded-xl border border-dashed border-stone-200 text-center">
                Chưa có linh kiện nào được gắn cho phiếu này. Chọn linh kiện bên dưới để thêm vào phiếu.
              </div>
            )}
          </div>

          {/* Quick Add Spare Part Sub-bar */}
          <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row items-stretch sm:items-end gap-2.5">
            <div className="flex-1">
              <label className="text-[11px] font-semibold text-stone-700 block mb-1">
                Chọn linh kiện từ kho:
              </label>
              <div className="relative flex items-center w-full">
                <select
                  value={inlinePartId}
                  onChange={(e) => setInlinePartId(Number(e.target.value) || 0)}
                  className="h-9 px-3.5 pr-10 text-xs font-medium rounded-xl border border-sand-200 bg-white text-stone-900 focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 appearance-none cursor-pointer w-full"
                >
                  <option value={0}>-- Chọn linh kiện trong kho --</option>
                  {availableParts.map((p) => (
                    <option key={p.id} value={p.id} disabled={p.stockQuantity <= 0}>
                      {p.partName} ({p.partCode}) - Tồn: {p.stockQuantity} {p.unit} - {formatVND(Number(p.price))}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-3.5 flex items-center justify-center pointer-events-none text-stone-400">
                  <IconChevronDown size={14} className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            <div className="w-full sm:w-24">
              <label className="text-[11px] font-semibold text-stone-700 block mb-1">
                Số lượng:
              </label>
              <input
                type="number"
                min={1}
                max={selectedPart?.stockQuantity || 99}
                value={inlineQuantity}
                onChange={(e) => setInlineQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="h-9 px-2.5 text-xs font-medium text-center rounded-xl border border-sand-200 bg-white text-stone-900 focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 w-full"
              />
            </div>

            <Button
              type="button"
              size="sm"
              variant="outline"
              leftIcon={<IconPlus className="w-3.5 h-3.5 text-amber-700" />}
              onClick={handleInlineAddPart}
              isLoading={isAddingPart}
              disabled={!inlinePartId || inlinePartId === 0 || isAddingPart}
              className="h-9 px-4 text-xs font-semibold shrink-0 border-amber-300 bg-amber-50/50 text-amber-900 hover:bg-amber-100 hover:border-amber-400"
            >
              Thêm linh kiện
            </Button>
          </div>
        </div>
      </div>
    </BaseModal>
  );
};
