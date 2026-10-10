'use client';

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { IconCheckCircle, IconDownload, IconUpload } from '@/assets/icon';
import { BaseModal } from '@/components/core/BaseModal';
import { Button } from '@/components/ui/button';
import { databaseAdminService } from '@/services/database-admin.service';
import { uiActions } from '@/stores/ui.store';

interface ImportTicketsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface TicketRowPreview {
  device_id: string;
  ticket_type: string;
  issue_description: string;
  initial_condition: string;
  accessories: string;
  estimated_cost: string;
}

export const ImportTicketsModal: React.FC<ImportTicketsModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [csvContent, setCsvContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [previewRows, setPreviewRows] = useState<TicketRowPreview[]>([]);
  const [totalRows, setTotalRows] = useState<number>(0);
  const [isImporting, setIsImporting] = useState<boolean>(false);

  const handleDownloadTemplate = () => {
    const data = [
      { device_id: 1, ticket_type: 'repair', issue_description: 'Man hinh chop tat lien tuc va xuat hien soc ngang', initial_condition: 'May tray xuoc nhe o mat A', accessories: 'Sac cap zin theo may', estimated_cost: 350000 },
      { device_id: 2, ticket_type: 'warranty', issue_description: 'Pin khong nhan sac bao loi nguon sau 2 tuan mua', initial_condition: 'May con nguyen tem bao hanh UIT Care', accessories: 'Hop may va phieu mua hang', estimated_cost: 0 },
      { device_id: 3, ticket_type: 'repair', issue_description: 'Ban phim bi liet phim Space va Enter do roi nuoc', initial_condition: 'Nut bam bi rit may co mui am', accessories: 'Than may khong phu kien', estimated_cost: 450000 },
      { device_id: 4, ticket_type: 'repair', issue_description: 'Nang cap them o cung SSD NVMe va ve sinh tra keo tan nhiet', initial_condition: 'May chay nong quat keu to', accessories: 'Adapter nguon', estimated_cost: 250000 },
    ];
    const worksheet = XLSX.utils.json_to_sheet(data);
    worksheet['!cols'] = [{ wch: 10 }, { wch: 12 }, { wch: 45 }, { wch: 35 }, { wch: 25 }, { wch: 15 }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
    XLSX.writeFile(workbook, 'tickets_import_template.xlsx');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    try {
      let text = '';
      if (file.name.toLowerCase().endsWith('.csv')) {
        text = await file.text();
      } else {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        text = XLSX.utils.sheet_to_csv(worksheet);
      }
      
      setCsvContent(text);

      const lines = text.trim().split('\n');
      if (lines.length > 1) {
        setTotalRows(lines.length - 1);
        const sample: TicketRowPreview[] = [];
        for (let i = 1; i < Math.min(lines.length, 6); i++) {
          const parts = lines[i].split(',');
          if (parts.length >= 3) {
            sample.push({
              device_id: parts[0]?.trim() || '',
              ticket_type: parts[1]?.trim() || 'repair',
              issue_description: parts[2]?.trim() || '',
              initial_condition: parts[3]?.trim() || '',
              accessories: parts[4]?.trim() || '',
              estimated_cost: parts[5]?.trim() || '0',
            });
          }
        }
        setPreviewRows(sample);
      }
    } catch {
      uiActions.addToast({
        type: 'error',
        title: 'Lỗi đọc file',
        message: 'Không thể đọc file. Vui lòng kiểm tra lại định dạng file!',
      });
    }
  };

  const handleImport = async () => {
    if (!csvContent.trim()) {
      uiActions.addToast({
        type: 'warning',
        title: 'Chưa chọn file',
        message: 'Vui lòng chọn file chứa dữ liệu phiếu sửa chữa cần nạp!',
      });
      return;
    }

    setIsImporting(true);
    try {
      const res = await databaseAdminService.importTicketsBulk(csvContent);
      uiActions.addToast({
        type: 'success',
        title: 'Nạp phiếu sửa thành công',
        message: `Đã nạp thành công ${res.rowsAffected} phiếu sửa chữa vào CSDL qua T-SQL BULK INSERT!`,
      });
      onSuccess();
      onOpenChange(false);
      setCsvContent('');
      setFileName('');
      setPreviewRows([]);
      setTotalRows(0);
    } catch (error) {
      uiActions.addToast({
        type: 'error',
        title: 'Lỗi BULK INSERT',
        message: (error as Error).message || 'Nạp dữ liệu phiếu sửa thất bại!',
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Nạp phiếu sửa chữa bằng BULK INSERT"
      description="Hệ thống hỗ trợ file Excel (.xlsx) giúp bạn nhập liệu dễ dàng. Dữ liệu sẽ tự động chuyển đổi sang CSV chuẩn để SQL Server xử lý và tạo phiếu với trạng thái 'Tiếp nhận'."
      primaryActionLabel={isImporting ? 'Đang nạp dữ liệu...' : 'Nạp phiếu sửa vào CSDL'}
      onPrimaryAction={handleImport}
      isPrimaryActionLoading={isImporting}
      size="lg"
    >
      <div className="space-y-4 text-sm text-stone-700">
        {/* Step 1: Download Template */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-sand-50 border border-sand-200">
          <div>
            <p className="font-medium text-stone-900">Mẫu file nạp chuẩn (Excel Template)</p>
            <p className="text-xs text-stone-500">
              Cột: device_id, ticket_type, issue_description, initial_condition, accessories, estimated_cost
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<IconDownload className="w-4 h-4" />}
            onClick={handleDownloadTemplate}
          >
            Tải mẫu Excel
          </Button>
        </div>

        {/* Step 2: Upload File */}
        <div className="border-2 border-dashed border-sand-300 rounded-lg p-6 text-center hover:border-sand-400 transition-colors bg-white">
          <input
            type="file"
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            id="ticket-csv-file-input"
            className="hidden"
            onChange={handleFileChange}
          />
          <label htmlFor="ticket-csv-file-input" className="cursor-pointer flex flex-col items-center">
            <IconUpload className="w-8 h-8 text-stone-400 mb-2" />
            <span className="font-semibold text-stone-800">
              {fileName ? fileName : 'Bấm để chọn file Excel/CSV phiếu sửa từ máy tính'}
            </span>
            <span className="text-xs text-stone-500 mt-1">Định dạng hỗ trợ: .xlsx, .csv</span>
          </label>
        </div>

        {/* Step 3: Preview Data */}
        {previewRows.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-stone-900 flex items-center gap-1.5">
                <IconCheckCircle className="w-4 h-4 text-emerald-600" />
                Xem trước dữ liệu ({totalRows} dòng tìm thấy)
              </span>
              <span className="text-xs text-stone-500">Hiển thị tối đa 5 dòng đầu</span>
            </div>

            <div className="border border-sand-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-sand-100 text-stone-700 font-semibold border-b border-sand-200">
                  <tr>
                    <th className="p-2">ID Thiết bị</th>
                    <th className="p-2">Phân loại</th>
                    <th className="p-2">Mô tả lỗi tiếp nhận</th>
                    <th className="p-2">Tình trạng máy</th>
                    <th className="p-2 text-right">Chi phí ước tính</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-200">
                  {previewRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-sand-50">
                      <td className="p-2 font-mono font-semibold text-stone-900">#{row.device_id}</td>
                      <td className="p-2">
                        <span className="px-1.5 py-0.5 rounded bg-sand-200 font-mono text-[11px]">
                          {row.ticket_type}
                        </span>
                      </td>
                      <td className="p-2 text-stone-800 font-medium max-w-xs truncate">
                        {row.issue_description}
                      </td>
                      <td className="p-2 text-stone-600">{row.initial_condition || '—'}</td>
                      <td className="p-2 text-right font-mono">
                        {Number(row.estimated_cost).toLocaleString('vi-VN')} đ
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-stone-500 italic">
              * Ghi chú: Toàn bộ phiếu sửa mới nạp sẽ ở trạng thái <strong>Mới tiếp nhận (received)</strong>, chưa gán KTV phụ trách để kỹ thuật viên tự nhận việc và cập nhật tiến độ theo log chuẩn.
            </p>
          </div>
        )}
      </div>
    </BaseModal>
  );
};
