'use client';

import React, { useState } from 'react';
import {
  IconCheckCircle,
  IconCreditCard,
  IconHistory,
  IconLaptop,
  IconRefresh,
  IconUser,
  IconWrench,
} from '@/assets/icon';
import { formatVND } from '@/common/helpers/currency.helper';
import { formatDateTime } from '@/common/helpers/date.helper';
import {
  getInvoiceStatusConfig,
  getTicketStatusConfig,
  getTicketTypeConfig,
} from '@/common/helpers/status.helper';
import { formatTicketCode } from '@/common/helpers/ticket.helper';
import { BaseModal } from '@/components/core/BaseModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useProcessTicket, useTicketDetail } from '@/hooks/useTickets';
import { uiActions } from '@/stores/ui.store';
import { getErrorMessage, Ticket, TicketStatus } from '@/types';

interface TicketDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: Ticket | null;
}

interface TicketStatusControlProps {
  ticket: Ticket;
}

const TicketStatusControl: React.FC<TicketStatusControlProps> = ({ ticket }) => {
  const [targetStatus, setTargetStatus] = useState<TicketStatus>(ticket.status);
  const processMutation = useProcessTicket();
  const statusCfg = getTicketStatusConfig(ticket.status);
  const typeCfg = getTicketTypeConfig(ticket.ticketType);

  const handleUpdateStatus = async () => {
    if (targetStatus === ticket.status) return;

    try {
      await processMutation.mutateAsync({
        ticketId: ticket.id,
        status: targetStatus,
      });

      uiActions.addToast({
        type: 'success',
        title: 'Cập nhật trạng thái thành công',
        message: `Phiếu #${formatTicketCode(ticket.id)} đã chuyển sang trạng thái: ${getTicketStatusConfig(targetStatus).label}`,
      });
    } catch (err: unknown) {
      uiActions.addToast({
        type: 'error',
        title: 'Cập nhật trạng thái thất bại',
        message: getErrorMessage(err, 'Không thể cập nhật trạng thái phiếu này.'),
      });
    }
  };

  return (
    <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={`w-3 h-3 rounded-full ${statusCfg.dotClass} animate-pulse`}
          />
          <div>
            <span className="text-xs text-stone-500 block uppercase tracking-wider font-bold">
              Trạng thái hiện tại
            </span>
            <span className="text-base font-bold text-stone-900">
              {statusCfg.label}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" size="md">
            {typeCfg.label}
          </Badge>
        </div>
      </div>

      {/* Quick Status Update Selector */}
      <div className="pt-3 border-t border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-stone-700">
          <IconRefresh className="w-3.5 h-3.5 text-stone-500" />
          <span>Chuyển trạng thái phiếu:</span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={targetStatus}
            onChange={(e) => setTargetStatus(e.target.value as TicketStatus)}
            className="h-9 px-3 pr-8 text-xs font-semibold rounded-xl border border-sand-200 bg-white text-stone-900 focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 cursor-pointer"
          >
            <option value={TicketStatus.RECEIVED}>Mới tiếp nhận (Received)</option>
            <option value={TicketStatus.INSPECTING}>Đang kiểm tra (Inspecting)</option>
            <option value={TicketStatus.WAITING_FOR_PARTS}>Chờ linh kiện (Waiting Parts)</option>
            <option value={TicketStatus.REPAIRING}>Đang sửa chữa (Repairing)</option>
            <option value={TicketStatus.COMPLETED}>Đã sửa xong (Completed)</option>
            <option value={TicketStatus.DELIVERED}>Đã trả khách (Delivered)</option>
            <option value={TicketStatus.CANCELLED}>Đã hủy tiếp nhận (Cancelled)</option>
          </select>
          <Button
            size="sm"
            variant="primary"
            onClick={handleUpdateStatus}
            disabled={targetStatus === ticket.status || processMutation.isPending}
            isLoading={processMutation.isPending}
            leftIcon={<IconCheckCircle className="w-3.5 h-3.5" />}
            className="min-h-[36px] text-xs font-semibold"
          >
            Lưu trạng thái
          </Button>
        </div>
      </div>
    </div>
  );
};

interface TicketDiagnosisFormProps {
  ticket: Ticket;
  onCancel: () => void;
}

const TicketDiagnosisForm: React.FC<TicketDiagnosisFormProps> = ({
  ticket,
  onCancel,
}) => {
  const [faultCause, setFaultCause] = useState(ticket.faultCause || '');
  const [repairSolution, setRepairSolution] = useState(ticket.repairSolution || '');
  const [estimatedCost, setEstimatedCost] = useState<number | ''>(
    ticket.estimatedCost ?? ''
  );
  const processMutation = useProcessTicket();

  const handleSave = async () => {
    try {
      await processMutation.mutateAsync({
        ticketId: ticket.id,
        status: ticket.status,
        faultCause: faultCause.trim() || undefined,
        repairSolution: repairSolution.trim() || undefined,
        estimatedCost: estimatedCost !== '' ? Number(estimatedCost) : undefined,
      });

      onCancel();
      uiActions.addToast({
        type: 'success',
        title: 'Đã lưu nhật ký kỹ thuật',
        message: `Đã cập nhật chẩn đoán lỗi và phương án cho phiếu #${formatTicketCode(ticket.id)}`,
      });
    } catch (err: unknown) {
      uiActions.addToast({
        type: 'error',
        title: 'Lỗi cập nhật nhật ký',
        message: getErrorMessage(err, 'Không thể lưu thông tin kỹ thuật.'),
      });
    }
  };

  return (
    <div className="space-y-3 pt-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-stone-700 block mb-1 font-semibold text-xs">
            Nguyên nhân hư hỏng xác định:
          </label>
          <Input
            value={faultCause}
            onChange={(e) => setFaultCause(e.target.value)}
            placeholder="VD: Hỏng tụ nguồn, IC âm thanh chập..."
            className="h-10 text-xs"
          />
        </div>
        <div>
          <label className="text-stone-700 block mb-1 font-semibold text-xs">
            Phương án khắc phục / Thay thế:
          </label>
          <Input
            value={repairSolution}
            onChange={(e) => setRepairSolution(e.target.value)}
            placeholder="VD: Đóng lại chân IC nguồn, thay cụm cáp..."
            className="h-10 text-xs"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-stone-700 block mb-1 font-semibold text-xs">
            Chi phí nhân công / xử lý dự tính (VND):
          </label>
          <Input
            type="number"
            value={estimatedCost}
            onChange={(e) =>
              setEstimatedCost(e.target.value === '' ? '' : Number(e.target.value))
            }
            placeholder="VD: 500000"
            className="h-10 text-xs"
          />
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
          disabled={processMutation.isPending}
          className="h-8 text-xs font-semibold px-3"
        >
          Hủy
        </Button>
        <Button
          size="sm"
          variant="primary"
          onClick={handleSave}
          isLoading={processMutation.isPending}
          leftIcon={<IconCheckCircle className="w-3.5 h-3.5" />}
          className="h-8 text-xs font-semibold px-3"
        >
          Lưu thay đổi
        </Button>
      </div>
    </div>
  );
};

const TechnicalDiagnosisSection: React.FC<{ ticket: Ticket }> = ({ ticket }) => {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="p-4 rounded-2xl bg-white border border-stone-200 space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IconWrench className="w-4 h-4 text-amber-700 shrink-0" />
          <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider leading-none">
            Nhật ký kiểm tra & Phương án kỹ thuật
          </h4>
        </div>
        {!isEditing && (
          <Button
            size="sm"
            variant="outline"
            leftIcon={<IconRefresh className="w-3.5 h-3.5" />}
            onClick={() => setIsEditing(true)}
            className="h-8 text-xs font-semibold px-2.5"
          >
            Cập nhật nhật ký
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div>
          <span className="text-stone-500 block mb-1 font-medium">
            Mô tả lỗi từ khách hàng:
          </span>
          <p className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 text-stone-800">
            {ticket.issueDescription || 'Không có mô tả'}
          </p>
        </div>
        <div>
          <span className="text-stone-500 block mb-1 font-medium">
            Tình trạng lúc tiếp nhận:
          </span>
          <p className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 text-stone-800">
            {ticket.initialCondition || 'Bình thường'} (Phụ kiện kèm:{' '}
            {ticket.accessories || 'Không'})
          </p>
        </div>
      </div>

      {isEditing ? (
        <TicketDiagnosisForm
          ticket={ticket}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
          <div>
            <span className="text-stone-500 block mb-1 font-medium">
              Nguyên nhân hư hỏng xác định:
            </span>
            <p className="p-2.5 bg-amber-50/50 rounded-xl border border-amber-200 text-amber-900 font-medium">
              {ticket.faultCause || 'Đang chờ kỹ thuật viên kiểm tra & cập nhật'}
            </p>
          </div>
          <div>
            <span className="text-stone-500 block mb-1 font-medium">
              Phương án khắc phục / Thay thế:
            </span>
            <p className="p-2.5 bg-amber-50/50 rounded-xl border border-amber-200 text-amber-900 font-medium">
              {ticket.repairSolution || 'Đang lên phương án kỹ thuật'}
            </p>
          </div>
          {ticket.estimatedCost > 0 && (
            <div className="md:col-span-2">
              <span className="text-stone-500 block mb-1 font-medium">
                Chi phí dự tính:
              </span>
              <p className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 text-stone-900 font-bold font-mono">
                {formatVND(ticket.estimatedCost)}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface TicketAuditTimelineProps {
  history?: Ticket['statusHistory'];
}

const TicketAuditTimeline: React.FC<TicketAuditTimelineProps> = ({ history = [] }) => {
  return (
    <div className="p-4 rounded-2xl bg-white border border-stone-200 space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IconHistory className="w-4 h-4 text-amber-700 shrink-0" />
          <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider leading-none">
            Nhật ký chuyển trạng thái & Kiểm toán (Audit Trail)
          </h4>
        </div>
        <span className="text-[11px] text-stone-500 font-medium bg-sand-100 px-2.5 py-0.5 rounded-full border border-sand-200">
          Trigger trg_tickets_audit_history
        </span>
      </div>

      {!history || history.length === 0 ? (
        <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-stone-500 text-xs italic text-center">
          Chưa có sự kiện chuyển đổi trạng thái nào khác kể từ lúc tiếp nhận.
        </div>
      ) : (
        <div className="relative pl-6 space-y-3 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-sand-300">
          {history.map((entry, idx) => {
            const isLatest = idx === 0;
            const newCfg = getTicketStatusConfig(entry.newStatus);
            const oldCfg = entry.oldStatus ? getTicketStatusConfig(entry.oldStatus) : null;

            return (
              <div key={entry.id || idx} className="relative">
                {/* Node indicator */}
                <div
                  className={`absolute -left-6 top-1.5 w-3 h-3 rounded-full border-2 border-white shadow-xs ${
                    isLatest ? `${newCfg.dotClass} ring-2 ring-amber-500/40` : 'bg-stone-300'
                  }`}
                />

                <div className="p-3 bg-stone-50/70 hover:bg-stone-50 rounded-xl border border-stone-200/80 transition-colors space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                      {oldCfg ? (
                        <>
                          <Badge variant="outline" size="sm">
                            {oldCfg.label}
                          </Badge>
                          <span className="text-stone-400 font-bold text-xs">➔</span>
                          <Badge variant="primary" size="sm">
                            {newCfg.label}
                          </Badge>
                        </>
                      ) : (
                        <>
                          <span className="text-stone-500 text-[11px]">Tiếp nhận ban đầu:</span>
                          <Badge variant="primary" size="sm">
                            {newCfg.label}
                          </Badge>
                        </>
                      )}
                    </div>
                    <span className="text-[11px] text-stone-500 font-mono">
                      {formatDateTime(entry.createdAt)}
                    </span>
                  </div>

                  <div className="text-xs text-stone-600 flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-stone-200/60">
                    <span className="text-[11px]">
                      Thao tác bởi:{' '}
                      <strong className="text-stone-800">
                        {entry.technician?.fullName ||
                          (entry.technicianId ? `Nhân viên #${entry.technicianId}` : 'Hệ thống')}
                      </strong>
                    </span>
                    {entry.note && (
                      <span className="text-stone-500 text-[11px] italic bg-white px-2 py-0.5 rounded border border-stone-200">
                        {entry.note}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  open,
  onOpenChange,
  ticket,
}) => {
  const { data: freshTicket } = useTicketDetail(open ? ticket?.id : undefined);
  const activeTicket = freshTicket || ticket;

  if (!activeTicket) return null;

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title={`Hồ sơ chi tiết: ${formatTicketCode(activeTicket.id)}`}
      description={`Mã tiếp nhận bảo hành & sửa chữa hệ thống UIT CARE`}
      size="2xl"
      footerContent={
        <div className="w-full flex items-center justify-between">
          <span className="text-xs text-stone-500 font-mono">
            Mã phiếu: <strong className="text-stone-800">{formatTicketCode(activeTicket.id)}</strong>
            {activeTicket.device?.serialNumber && ` • S/N: ${activeTicket.device.serialNumber}`}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="min-h-[36px] px-5 font-semibold text-xs text-stone-700 hover:text-stone-900 border-sand-200"
          >
            Đóng
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Status Banner & Transition Control */}
        <TicketStatusControl
          key={`${activeTicket.id}_${activeTicket.status}`}
          ticket={activeTicket}
        />

        {/* 3 Grid Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Customer */}
          <Card className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
              <IconUser className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Khách hàng</span>
            </div>
            <div className="text-xs space-y-1 text-stone-600">
              <div className="font-semibold text-stone-900">
                {activeTicket.device?.customer?.fullName}
              </div>
              <div className="font-mono text-stone-700">
                {activeTicket.device?.customer?.phoneNumber}
              </div>
              <div>{activeTicket.device?.customer?.address || 'Chưa cập nhật địa chỉ'}</div>
            </div>
          </Card>

          {/* Device */}
          <Card className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
              <IconLaptop className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Thiết bị</span>
            </div>
            <div className="text-xs space-y-1 text-stone-600">
              <div className="font-semibold text-stone-900">
                {activeTicket.device?.deviceName}
              </div>
              <div className="font-mono text-stone-700">
                S/N: {activeTicket.device?.serialNumber}
              </div>
              <div className="text-[11px] text-stone-500">
                Thương hiệu: {activeTicket.device?.brand} | Loại: {activeTicket.device?.deviceType}
              </div>
            </div>
          </Card>

          {/* Personnel */}
          <Card className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
              <IconWrench className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Nhân sự phụ trách</span>
            </div>
            <div className="text-xs space-y-1 text-stone-600">
              <div>
                <span className="text-stone-400">Tiếp nhận: </span>
                <span className="font-medium text-stone-800">
                  {activeTicket.receptionist?.fullName || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-stone-400">Kỹ thuật: </span>
                <span className="font-semibold text-amber-800">
                  {activeTicket.technician?.fullName || 'Chưa phân công'}
                </span>
              </div>
              <div>
                <span className="text-stone-400">Ngày nhận: </span>
                <span>{formatDateTime(activeTicket.receivedAt)}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Diagnosis & Technical Findings */}
        <TechnicalDiagnosisSection ticket={activeTicket} />

        {/* Audit Trail & Status History */}
        <TicketAuditTimeline history={activeTicket.statusHistory} />

        {/* Billing / Invoices */}
        {activeTicket.invoices && activeTicket.invoices.length > 0 && (
          <div className="p-4 rounded-2xl bg-white border border-stone-200 space-y-3">
            <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
              <IconCreditCard className="w-4 h-4 text-stone-500" />
              Lịch sử thanh toán & Hóa đơn liên quan
            </h4>

            {activeTicket.invoices.map((inv) => (
              <div
                key={inv.id}
                className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-mono font-bold text-stone-900">
                    Hóa đơn #{inv.id}
                  </span>
                  <span className="text-stone-500 ml-2">
                    Công kỹ thuật: {formatVND(Number(inv.laborFee))}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-sm text-stone-900">
                    {formatVND(Number(inv.totalAmount))}
                  </span>
                  <Badge
                    variant={inv.status === 'paid' ? 'success' : 'warning'}
                    size="sm"
                  >
                    {getInvoiceStatusConfig(inv.status).label}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </BaseModal>
  );
};
