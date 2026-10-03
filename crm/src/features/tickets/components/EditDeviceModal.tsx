'use client';

import React, { useEffect, useState } from 'react';
import { BaseModal } from '@/components/core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { IconCheckCircle } from '@/assets/icon';
import { useUpdateDevice } from '@/hooks/useDevices';
import { uiActions } from '@/stores/ui.store';
import { Device, getErrorMessage } from '@/types';

interface EditDeviceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  device?: Device | null;
  onSuccess?: () => Promise<unknown> | void;
}

export const EditDeviceModal: React.FC<EditDeviceModalProps> = ({
  open,
  onOpenChange,
  device,
  onSuccess,
}) => {
  const [deviceName, setDeviceName] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [brand, setBrand] = useState('');
  const [deviceType, setDeviceType] = useState('');
  const [isUnderWarranty, setIsUnderWarranty] = useState(false);
  const [warrantyExpiryDate, setWarrantyExpiryDate] = useState('');

  const updateMutation = useUpdateDevice();

  useEffect(() => {
    if (device && open) {
      setDeviceName(device.deviceName || '');
      setSerialNumber(device.serialNumber || '');
      setBrand(device.brand || '');
      setDeviceType(device.deviceType || '');
      setIsUnderWarranty(Boolean(device.isUnderWarranty));
      setWarrantyExpiryDate(
        device.warrantyExpiryDate
          ? new Date(device.warrantyExpiryDate).toISOString().split('T')[0]
          : ''
      );
    }
  }, [device, open]);

  if (!device) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceName.trim()) {
      uiActions.addToast({
        type: 'warning',
        title: 'Thiếu thông tin',
        message: 'Tên thiết bị không được để trống.',
      });
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: device.id,
        deviceName: deviceName.trim(),
        serialNumber: serialNumber.trim() || undefined,
        brand: brand.trim() || undefined,
        deviceType: deviceType.trim() || undefined,
        isUnderWarranty,
        warrantyExpiryDate: warrantyExpiryDate || undefined,
      });

      uiActions.addToast({
        type: 'success',
        title: 'Cập nhật thiết bị thành công',
        message: `Đã cập nhật thông tin thiết bị: ${deviceName}`,
      });

      if (onSuccess) {
        await onSuccess();
      }

      onOpenChange(false);
    } catch (err: unknown) {
      uiActions.addToast({
        type: 'error',
        title: 'Lỗi cập nhật thiết bị',
        message: getErrorMessage(err, 'Không thể cập nhật thiết bị.'),
      });
    }
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Cập nhật thông tin thiết bị"
      description={`Thiết bị ID #${device.id} • ${device.deviceName}`}
      size="lg"
      footerContent={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={updateMutation.isPending}
            className="min-h-[36px] px-4 font-semibold text-xs text-stone-700"
          >
            Hủy
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            isLoading={updateMutation.isPending}
            disabled={updateMutation.isPending}
            leftIcon={<IconCheckCircle className="w-3.5 h-3.5" />}
            className="min-h-[36px] px-5 font-semibold text-xs"
          >
            Lưu thay đổi
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-stone-700 block mb-1">
            Tên thiết bị <span className="text-red-500">*</span>
          </label>
          <Input
            value={deviceName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDeviceName(e.target.value)}
            placeholder="VD: Dell XPS 15 9520, iPhone 14 Pro..."
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1">
              Số Serial / IMEI
            </label>
            <Input
              value={serialNumber}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSerialNumber(e.target.value)}
              placeholder="VD: SN-2026-XPS-9921"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1">
              Thương hiệu / Hãng sản xuất
            </label>
            <Input
              value={brand}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBrand(e.target.value)}
              placeholder="VD: Dell, Apple, Asus, HP..."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1">
              Loại thiết bị
            </label>
            <Input
              value={deviceType}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDeviceType(e.target.value)}
              placeholder="VD: Laptop, Smartphone, Tablet..."
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1">
              Hạn bảo hành chính hãng
            </label>
            <Input
              type="date"
              value={warrantyExpiryDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWarrantyExpiryDate(e.target.value)}
            />
          </div>
        </div>

        <div className="pt-2">
          <label className="inline-flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-stone-700">
            <input
              type="checkbox"
              checked={isUnderWarranty}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIsUnderWarranty(e.target.checked)}
              className="w-4 h-4 rounded text-amber-600 border-sand-300 focus:ring-amber-500"
            />
            <span>Đang trong thời hạn bảo hành chính hãng</span>
          </label>
        </div>
      </form>
    </BaseModal>
  );
};
