'use client';

import React, { useEffect, useState } from 'react';
import { useSnapshot } from 'valtio';
import {
  IconAlertTriangle,
  IconCheckCircle,
  IconDatabase,
  IconDownload,
  IconFileSpreadsheet,
  IconHardDrive,
  IconRefresh,
  IconShield,
  IconTrash,
  IconUpload,
} from '@/assets/icon';
import { BaseModal, PageContainer, PageHeader } from '@/components/core';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ImportPartsModal } from '@/features/inventory/components/ImportPartsModal';
import { ImportTicketsModal } from '@/features/tickets/components/ImportTicketsModal';
import { databaseAdminService } from '@/services/database-admin.service';
import { authState } from '@/stores/auth.store';
import { uiActions } from '@/stores/ui.store';
import { BackupItem, EmployeeRole } from '@/types';

interface ConfirmActionState {
  open: boolean;
  type: 'restore' | 'delete';
  fileName: string;
}

/**
 * Database Administration & Disaster Recovery Management Screen
 * Provides direct management for SQL Server Backup, Restore, and Bulk Data Exchange.
 */
export default function DatabaseAdminPage() {
  const { user } = useSnapshot(authState);
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [importPartsModalOpen, setImportPartsModalOpen] = useState(false);
  const [importTicketsModalOpen, setImportTicketsModalOpen] = useState(false);
  const [exportingType, setExportingType] = useState<string | null>(null);

  // Elegant Radix UI Danger Confirmation Modal state
  const [confirmAction, setConfirmAction] = useState<ConfirmActionState | null>(null);
  const [isExecutingAction, setIsExecutingAction] = useState(false);

  const isManager = user?.role === EmployeeRole.MANAGER;

  const fetchBackups = async () => {
    setIsLoadingBackups(true);
    try {
      const data = await databaseAdminService.listBackups();
      setBackups(data);
    } catch (error) {
      uiActions.addToast({
        type: 'error',
        title: 'Tải danh sách thất bại',
        message: (error as Error).message || 'Không thể tải danh sách bản sao lưu!',
      });
    } finally {
      setIsLoadingBackups(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleBackupNow = async () => {
    setIsBackingUp(true);
    try {
      const res = await databaseAdminService.backupDatabase();
      uiActions.addToast({
        type: 'success',
        title: 'Sao lưu CSDL thành công',
        message: `Đã tạo thành công bản sao lưu CSDL vật lý: ${res.fileName}!`,
      });
      fetchBackups();
    } catch (error) {
      uiActions.addToast({
        type: 'error',
        title: 'Sao lưu CSDL thất bại',
        message: (error as Error).message || 'Sao lưu CSDL thất bại!',
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleExecuteConfirmAction = async () => {
    if (!confirmAction) return;
    const { type, fileName } = confirmAction;

    setIsExecutingAction(true);
    try {
      if (type === 'restore') {
        const res = await databaseAdminService.restoreDatabase(fileName);
        uiActions.addToast({
          type: 'success',
          title: 'Khôi phục CSDL thành công',
          message: `${res.message}! Đã khôi phục thành công toàn vẹn CSDL.`,
        });
      } else {
        const res = await databaseAdminService.deleteBackup(fileName);
        uiActions.addToast({
          type: 'success',
          title: 'Xóa bản sao lưu thành công',
          message: `Đã xóa vĩnh viễn file sao lưu ${res.fileName} khỏi máy chủ!`,
        });
      }
      setConfirmAction(null);
      fetchBackups();
    } catch (error) {
      uiActions.addToast({
        type: 'error',
        title: type === 'restore' ? 'Khôi phục CSDL thất bại' : 'Xóa bản sao lưu thất bại',
        message: (error as Error).message || 'Thao tác không thành công!',
      });
    } finally {
      setIsExecutingAction(false);
    }
  };

  const handleExport = async (table: 'parts' | 'invoices' | 'tickets') => {
    setExportingType(table);
    try {
      await databaseAdminService.exportTable(table, 'csv');
      uiActions.addToast({
        type: 'success',
        title: 'Xuất dữ liệu thành công',
        message: `Xuất dữ liệu bảng [${table}] thành công! File CSV đang được tải về.`,
      });
    } catch (error) {
      uiActions.addToast({
        type: 'error',
        title: 'Xuất dữ liệu thất bại',
        message: (error as Error).message || `Xuất dữ liệu bảng [${table}] thất bại!`,
      });
    } finally {
      setExportingType(null);
    }
  };

  if (!isManager) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl border border-sand-200">
          <IconAlertTriangle className="w-12 h-12 text-amber-500 mb-3" />
          <h2 className="text-lg font-bold text-stone-900">Quyền Truy Cập Bị Giới Hạn</h2>
          <p className="text-sm text-stone-600 mt-1 max-w-md">
            Phân hệ Quản trị Cơ sở Dữ liệu & Sao lưu vật lý chỉ dành riêng cho Quản lý hệ thống (Role: Manager).
          </p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Quản Trị Cơ Sở Dữ Liệu & Sao Lưu"
        description="Thực thi trực tiếp các tác vụ Backup / Restore vật lý và Bulk Import / Export trên Microsoft SQL Server Engine."
        badge={
          <Badge variant="primary" size="sm">
            <IconDatabase className="w-3.5 h-3.5" />
            Zero-Trust Data Integrity
          </Badge>
        }
        onRefresh={fetchBackups}
        isRefreshing={isLoadingBackups}
        actions={
          <Button
            size="sm"
            leftIcon={<IconHardDrive className="w-4 h-4" />}
            onClick={handleBackupNow}
            isLoading={isBackingUp}
          >
            Tạo bản sao lưu ngay (.BAK)
          </Button>
        }
      />

      <div className="space-y-6">
        {/* Section 1: Backup & Restore */}
        <div className="bg-white rounded-xl border border-sand-200 p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-sand-200 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                <IconShield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-base">
                  Sao Lưu & Khôi Phục CSDL Vật Lý (Disaster Recovery)
                </h3>
                <p className="text-xs text-stone-500">
                  SQL Server Engine tự đóng băng trang đĩa, nén nhị phân và xuất file .BAK độc lập vào thư mục chia sẻ máy chủ.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<IconRefresh className="w-3.5 h-3.5" />}
              onClick={fetchBackups}
              isLoading={isLoadingBackups}
            >
              Làm mới danh sách
            </Button>
          </div>

          {/* Backup list table */}
          {backups.length === 0 ? (
            <div className="text-center py-8 text-stone-500 text-sm border-2 border-dashed border-sand-200 rounded-lg">
              Chưa có bản sao lưu (.BAK) nào trên máy chủ. Bấm nút &quot;Tạo bản sao lưu ngay&quot; để khởi tạo bản đầu tiên.
            </div>
          ) : (
            <div className="border border-sand-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-sand-100 text-stone-700 font-semibold border-b border-sand-200">
                  <tr>
                    <th className="p-3">Tên file sao lưu (.BAK)</th>
                    <th className="p-3">Dung lượng</th>
                    <th className="p-3">Thời gian tạo</th>
                    <th className="p-3 text-right">Thao tác quản trị</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-200">
                  {backups.map((b) => (
                    <tr key={b.fileName} className="hover:bg-sand-50 transition-colors">
                      <td className="p-3 font-mono font-medium text-stone-900 flex items-center gap-2">
                        <IconDatabase className="w-4 h-4 text-emerald-600 shrink-0" />
                        {b.fileName}
                      </td>
                      <td className="p-3 text-stone-600 font-mono text-xs">{b.sizeMb} MB</td>
                      <td className="p-3 text-stone-600 text-xs">
                        {new Date(b.createdAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<IconDownload className="w-3.5 h-3.5" />}
                          onClick={() => databaseAdminService.downloadBackup(b.fileName)}
                        >
                          Tải file (.BAK)
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          leftIcon={<IconRefresh className="w-3.5 h-3.5" />}
                          onClick={() =>
                            setConfirmAction({
                              open: true,
                              type: 'restore',
                              fileName: b.fileName,
                            })
                          }
                        >
                          Khôi phục CSDL
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-rose-600 hover:bg-rose-50 hover:border-rose-300"
                          leftIcon={<IconTrash className="w-3.5 h-3.5" />}
                          onClick={() =>
                            setConfirmAction({
                              open: true,
                              type: 'delete',
                              fileName: b.fileName,
                            })
                          }
                        >
                          Xóa
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section 2: Bulk Import & Export */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card: Bulk Export */}
          <div className="bg-white rounded-xl border border-sand-200 p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-sand-200 pb-3">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
                <IconFileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-base">
                  Xuất Dữ Liệu Nguyên Khối (Native Export)
                </h3>
                <p className="text-xs text-stone-500">
                  Database Stored Procedures trích xuất dữ liệu có cấu trúc ra file CSV chuẩn.
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between p-3 rounded-lg bg-sand-50 border border-sand-200">
                <div>
                  <p className="font-semibold text-stone-900 text-sm">Kho Linh Kiện (Parts Catalog)</p>
                  <p className="text-xs text-stone-500">Đơn giá, mã linh kiện, số lượng tồn kho</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<IconDownload className="w-4 h-4" />}
                  onClick={() => handleExport('parts')}
                  isLoading={exportingType === 'parts'}
                >
                  Xuất CSV
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-sand-50 border border-sand-200">
                <div>
                  <p className="font-semibold text-stone-900 text-sm">Hóa Đơn & Doanh Thu (Invoices)</p>
                  <p className="text-xs text-stone-500">Tiền công, chiết khấu, hình thức thanh toán</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<IconDownload className="w-4 h-4" />}
                  onClick={() => handleExport('invoices')}
                  isLoading={exportingType === 'invoices'}
                >
                  Xuất CSV
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-sand-50 border border-sand-200">
                <div>
                  <p className="font-semibold text-stone-900 text-sm">Phiếu Tiếp Nhận & Sửa Chữa (Tickets)</p>
                  <p className="text-xs text-stone-500">Mô tả lỗi, KTV phụ trách, trạng thái</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<IconDownload className="w-4 h-4" />}
                  onClick={() => handleExport('tickets')}
                  isLoading={exportingType === 'tickets'}
                >
                  Xuất CSV
                </Button>
              </div>
            </div>
          </div>

          {/* Card: Bulk Import via BULK INSERT */}
          <div className="bg-white rounded-xl border border-sand-200 p-6 space-y-4 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 border-b border-sand-200 pb-3">
                <div className="p-2 rounded-lg bg-purple-50 text-purple-700">
                  <IconUpload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-base">
                    Nạp Dữ Liệu Hàng Loạt (T-SQL BULK INSERT)
                  </h3>
                  <p className="text-xs text-stone-500">
                    Sử dụng các thủ tục chuyên dụng đọc file trực tiếp từ đĩa máy chủ vào CSDL.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-sand-50 border border-sand-200 mt-4 space-y-2 text-xs text-stone-600">
                <p className="font-semibold text-stone-900 flex items-center gap-1.5">
                  <IconCheckCircle className="w-4 h-4 text-emerald-600" />
                  Cơ chế nạp nguyên tử & toàn vẹn dữ liệu:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-1">
                  <li><strong>Linh kiện kho (Upsert)</strong>: Tự động cộng dồn tồn kho hoặc chèn mới.</li>
                  <li><strong>Phiếu sửa chữa (Received)</strong>: Tự động tạo phiếu ở trạng thái mới tiếp nhận, chưa gán KTV và tự động ghi log lịch sử trạng thái qua Trigger.</li>
                  <li>Toàn bộ quá trình chạy nguyên tử trong 1 giao dịch SQL Server.</li>
                </ul>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <Button
                variant="outline"
                className="w-full"
                leftIcon={<IconUpload className="w-4 h-4" />}
                onClick={() => setImportPartsModalOpen(true)}
              >
                Nhập kho Linh Kiện
              </Button>
              <Button
                className="w-full"
                leftIcon={<IconUpload className="w-4 h-4" />}
                onClick={() => setImportTicketsModalOpen(true)}
              >
                Nhập Phiếu Sửa Chữa
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Confirm Modal (Radix UI BaseModal replacing window.confirm) */}
      <BaseModal
        open={!!confirmAction?.open}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title={
          <div className="flex items-center gap-2 text-rose-600">
            <IconAlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="font-bold">
              {confirmAction?.type === 'restore'
                ? 'Xác nhận khôi phục CSDL'
                : 'Xác nhận xóa bản sao lưu'}
            </span>
          </div>
        }
        description={
          confirmAction?.type === 'restore'
            ? 'CẢNH BÁO NGUY HIỂM: Toàn bộ dữ liệu hiện tại của hệ thống sẽ bị ghi đè bằng snapshot trong file sao lưu này!'
            : 'CẢNH BÁO: File bản sao lưu vật lý này sẽ bị xóa hoàn toàn khỏi đĩa máy chủ và không thể hoàn tác!'
        }
        primaryActionLabel={
          isExecutingAction
            ? 'Đang thực thi...'
            : confirmAction?.type === 'restore'
            ? 'Tiến hành Khôi phục'
            : 'Xác nhận Xóa vĩnh viễn'
        }
        primaryActionVariant="danger"
        isPrimaryActionLoading={isExecutingAction}
        onPrimaryAction={handleExecuteConfirmAction}
        secondaryActionLabel="Hủy bỏ"
        onSecondaryAction={() => setConfirmAction(null)}
        size="sm"
      >
        <div className="py-2 text-sm text-stone-700 space-y-3">
          <div className="p-3 rounded-lg bg-sand-100 border border-sand-200 font-mono text-xs break-all flex items-center gap-2">
            <IconDatabase className="w-4 h-4 text-stone-600 shrink-0" />
            <span>{confirmAction?.fileName}</span>
          </div>
          <p className="text-xs text-stone-500">
            {confirmAction?.type === 'restore'
              ? 'Quá trình khôi phục sẽ tạm thời ngắt kết nối các phiên làm việc và nạp lại toàn bộ cấu trúc dữ liệu theo đúng file .BAK.'
              : 'Hành động này sẽ giải phóng dung lượng đĩa của máy chủ lưu trữ.'}
          </p>
        </div>
      </BaseModal>

      {/* Modal Import Linh kiện */}
      <ImportPartsModal
        open={importPartsModalOpen}
        onOpenChange={setImportPartsModalOpen}
        onSuccess={() => {
          uiActions.addToast({
            type: 'success',
            title: 'Nạp linh kiện thành công',
            message: 'Đã hoàn tất nạp dữ liệu linh kiện vào CSDL qua BULK INSERT!',
          });
        }}
      />

      {/* Modal Import Phiếu sửa chữa */}
      <ImportTicketsModal
        open={importTicketsModalOpen}
        onOpenChange={setImportTicketsModalOpen}
        onSuccess={() => {
          uiActions.addToast({
            type: 'success',
            title: 'Nạp phiếu sửa thành công',
            message: 'Đã hoàn tất nạp phiếu sửa chữa vào CSDL qua BULK INSERT!',
          });
        }}
      />
    </PageContainer>
  );
}
