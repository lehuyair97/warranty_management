'use client';

import React from 'react';
import { IconCheckCircle, IconShieldAlert } from '@/assets/icon';
import { BaseModal } from '@/components/core/BaseModal';

interface InvoiceAuditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  autoFixChecked: boolean;
  onAutoFixChange: (checked: boolean) => void;
  onRunAudit: () => void;
  isLoading: boolean;
  auditResult: {
    discrepanciesFound: number;
    wasAutoFixed: boolean;
  } | null;
}

export const InvoiceAuditModal: React.FC<InvoiceAuditModalProps> = ({
  open,
  onOpenChange,
  autoFixChecked,
  onAutoFixChange,
  onRunAudit,
  isLoading,
  auditResult,
}) => {
  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Đối Soát Doanh Thu & Số Dư Hóa Đơn"
      description="Chạy thủ tục kiểm toán sp_audit_invoices với T-SQL Cursor đối soát toàn bộ tiền công & phụ tùng."
      primaryActionLabel="Chạy quy trình kiểm toán"
      onPrimaryAction={onRunAudit}
      isPrimaryActionLoading={isLoading}
      size="md"
    >
      <div className="space-y-4">
        <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600 space-y-2">
          <p>
            Hệ thống sẽ quét từng dòng hóa đơn và bảng kê phụ tùng bằng T-SQL
            Cursor, tính toán lại tổng tiền theo công thức:
          </p>
          <p className="font-mono bg-stone-200/60 p-2 rounded text-stone-900 text-[11px]">
            total_amount = labor_fee + SUM(parts.price * quantity) - discount_amount
          </p>
        </div>

        <label className="flex items-center gap-3 p-3 rounded-xl border border-stone-200 hover:bg-stone-50 cursor-pointer">
          <input
            type="checkbox"
            checked={autoFixChecked}
            onChange={(e) => onAutoFixChange(e.target.checked)}
            className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
          />
          <div className="text-xs">
            <span className="font-bold text-stone-900 block">
              Tự động hiệu chỉnh sai lệch (@auto_fix = 1)
            </span>
            <span className="text-stone-500">
              Nếu phát hiện số dư không khớp, hệ thống sẽ ghi đè giá trị chính xác
              ngay lập tức.
            </span>
          </div>
        </label>

        {auditResult && (
          <div
            className={`p-4 rounded-xl border text-xs space-y-1.5 ${
              auditResult.discrepanciesFound > 0
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-sm">
              {auditResult.discrepanciesFound > 0 ? (
                <IconShieldAlert className="w-5 h-5 text-amber-700" />
              ) : (
                <IconCheckCircle className="w-5 h-5 text-emerald-700" />
              )}
              {auditResult.discrepanciesFound > 0
                ? `Tìm thấy ${auditResult.discrepanciesFound} hóa đơn bị sai lệch số dư!`
                : 'Tất cả hóa đơn hợp lệ và chính xác 100%!'}
            </div>
            {auditResult.wasAutoFixed && (
              <p className="font-semibold text-emerald-700">
                ✓ Toàn bộ sai lệch đã được cập nhật lại theo số liệu thực tế.
              </p>
            )}
          </div>
        )}
      </div>
    </BaseModal>
  );
};
