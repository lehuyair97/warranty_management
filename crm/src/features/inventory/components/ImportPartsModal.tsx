'use client';

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { IconCheckCircle, IconDownload, IconUpload } from '@/assets/icon';
import { BaseModal } from '@/components/core/BaseModal';
import { Button } from '@/components/ui/button';
import { databaseAdminService } from '@/services/database-admin.service';
import { uiActions } from '@/stores/ui.store';

interface ImportPartsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface CsvRowPreview {
  part_name: string;
  unit: string;
  price: string;
  stock_quantity: string;
}

export const ImportPartsModal: React.FC<ImportPartsModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [csvContent, setCsvContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [previewRows, setPreviewRows] = useState<CsvRowPreview[]>([]);
  const [totalRows, setTotalRows] = useState<number>(0);
  const [isImporting, setIsImporting] = useState<boolean>(false);

  const handleDownloadTemplate = () => {
    const data = [
      { part_name: 'RAM Kingston Fury 8GB DDR4 3200MHz', unit: 'piece', price: 650000, stock_quantity: 15 },
      { part_name: 'SSD Samsung 980 500GB NVMe M.2', unit: 'piece', price: 1250000, stock_quantity: 10 },
      { part_name: 'Laptop Keyboard Dell Latitude 5420', unit: 'piece', price: 450000, stock_quantity: 8 },
      { part_name: 'PIN Laptop Asus ZenBook 4-Cell', unit: 'piece', price: 850000, stock_quantity: 5 },
      { part_name: 'Quat Tan Nhiet Laptop HP Envy 13', unit: 'piece', price: 320000, stock_quantity: 12 },
    ];
    const worksheet = XLSX.utils.json_to_sheet(data);
    worksheet['!cols'] = [{ wch: 40 }, { wch: 10 }, { wch: 15 }, { wch: 15 }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
    XLSX.writeFile(workbook, 'parts_import_template.xlsx');
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
        const sample: CsvRowPreview[] = [];
        for (let i = 1; i < Math.min(lines.length, 6); i++) {
          const parts = lines[i].split(',');
          if (parts.length >= 4) {
            sample.push({
              part_name: parts[0]?.trim() || '',
              unit: parts[1]?.trim() || '',
              price: parts[2]?.trim() || '',
              stock_quantity: parts[3]?.trim() || '',
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
        message: 'Vui lòng chọn file chứa dữ liệu linh kiện cần nạp!',
      });
      return;
    }

    setIsImporting(true);
    try {
      const res = await databaseAdminService.importPartsBulk(csvContent);
      uiActions.addToast({
        type: 'success',
        title: 'Nạp CSDL thành công',
        message: `Đã nạp thành công ${res.rowsAffected} linh kiện vào CSDL qua T-SQL BULK INSERT!`,
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
        message: (error as Error).message || 'Nạp dữ liệu qua BULK INSERT thất bại!',
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Nạp dữ liệu kho bằng BULK INSERT"
      description="Hệ thống hỗ trợ file Excel (.xlsx) giúp bạn nhập liệu dễ dàng. Dữ liệu sẽ tự động chuyển đổi sang CSV chuẩn để SQL Server xử lý."
      primaryActionLabel={isImporting ? 'Đang nạp dữ liệu...' : 'Nạp dữ liệu vào CSDL'}
      onPrimaryAction={handleImport}
      isPrimaryActionLoading={isImporting}
      size="lg"
    >
      <div className="space-y-4 text-sm text-stone-700">
        {/* Step 1: Download Template */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-sand-50 border border-sand-200">
          <div>
            <p className="font-medium text-stone-900">Mẫu file nạp chuẩn (Excel Template)</p>
            <p className="text-xs text-stone-500">Bao gồm 4 cột: part_name, unit, price, stock_quantity</p>
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
            id="csv-file-input"
            className="hidden"
            onChange={handleFileChange}
          />
          <label htmlFor="csv-file-input" className="cursor-pointer flex flex-col items-center">
            <IconUpload className="w-8 h-8 text-stone-400 mb-2" />
            <span className="font-semibold text-stone-800">
              {fileName ? fileName : 'Bấm để chọn file Excel/CSV từ máy tính'}
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
                    <th className="p-2">Tên linh kiện</th>
                    <th className="p-2">Đơn vị</th>
                    <th className="p-2 text-right">Đơn giá (VND)</th>
                    <th className="p-2 text-right">Tồn kho</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-200">
                  {previewRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-sand-50">
                      <td className="p-2 font-medium text-stone-900">{row.part_name}</td>
                      <td className="p-2 text-stone-600">{row.unit}</td>
                      <td className="p-2 text-right font-mono">{Number(row.price).toLocaleString('vi-VN')}</td>
                      <td className="p-2 text-right font-semibold text-emerald-700">{row.stock_quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-stone-500 italic">
              * Ghi chú: Nếu tên linh kiện đã tồn tại sẵn trong kho, hệ thống sẽ tự động cộng dồn số lượng tồn và cập nhật giá mới.
            </p>
          </div>
        )}
      </div>
    </BaseModal>
  );
};
