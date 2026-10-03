'use client';

import React from 'react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import {
  IconArrowDown,
  IconArrowRight,
  IconCheckCircle,
  IconChevronDown,
  IconClipboardList,
  IconLaptop,
  IconUser,
} from '@/assets/icon';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ReceptionFormValues } from '@/schemas/reception.schema';
import { Customer } from '@/types';

export interface ReceptionPosFormProps {
  register: UseFormRegister<ReceptionFormValues>;
  handleSubmit: (callback: (data: ReceptionFormValues) => void) => (e?: React.BaseSyntheticEvent) => Promise<void>;
  onSubmit: (data: ReceptionFormValues) => void;
  errors: FieldErrors<ReceptionFormValues>;
  isUnderWarranty: boolean;
  existingCustomer: Customer | null;
  isSearchingCustomer: boolean;
  isSubmitting: boolean;
}

/**
 * Multi-step unified POS reception form card.
 * Sequentially guides receptionists through customer, device, and service intake.
 * Adheres to Thin Screen architecture by separating complex form layouts from page orchestrators.
 */
export const ReceptionPosForm = React.memo<ReceptionPosFormProps>(
  ({
    register,
    handleSubmit,
    onSubmit,
    errors,
    isUnderWarranty,
    existingCustomer,
    isSearchingCustomer,
    isSubmitting,
  }) => {
    return (
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* Unified Master Card */}
        <Card className="p-0 overflow-hidden border border-stone-200/90 shadow-sm bg-white rounded-2xl">
          {/* Top Workflow Stepper Progress Bar */}
          <div className="bg-stone-50/80 border-b border-stone-200 px-5 py-3 hidden md:flex items-center justify-between text-xs text-stone-600">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-700 text-white font-bold flex items-center justify-center text-[11px]">
                1
              </span>
              <span className="font-semibold text-stone-800">Thông tin khách hàng</span>
            </div>

            <div className="flex items-center gap-1.5 text-stone-400">
              <span className="w-8 border-t border-dashed border-stone-300" />
              <IconArrowRight className="w-3.5 h-3.5 text-amber-700" />
              <span className="w-8 border-t border-dashed border-stone-300" />
            </div>

            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-700 text-white font-bold flex items-center justify-center text-[11px]">
                2
              </span>
              <span className="font-semibold text-stone-800">Thông tin thiết bị</span>
            </div>

            <div className="flex items-center gap-1.5 text-stone-400">
              <span className="w-8 border-t border-dashed border-stone-300" />
              <IconArrowRight className="w-3.5 h-3.5 text-amber-700" />
              <span className="w-8 border-t border-dashed border-stone-300" />
            </div>

            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-700 text-white font-bold flex items-center justify-center text-[11px]">
                3
              </span>
              <span className="font-semibold text-stone-800">Lỗi, dịch vụ & Tạo phiếu</span>
            </div>
          </div>

          {/* Unified Form Body: 12-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
            {/* Left Column (7 cols): Step 1 & Step 2 with Down-Arrow Flow */}
            <div className="lg:col-span-7 p-5 sm:p-6 space-y-5">
              {/* SECTION 1: Customer Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 border-b border-stone-200/80 pb-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800 shrink-0 font-bold text-xs">
                    <IconUser className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 uppercase tracking-wider">
                        Bước 1
                      </span>
                      <h3 className="font-bold text-stone-900 text-sm">
                        Thông Tin Khách Hàng
                      </h3>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Nhập số điện thoại để tự động điền hồ sơ khách hàng cũ
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="relative">
                    <Input
                      label="Số điện thoại (*)"
                      placeholder="VD: 0901234567"
                      {...register('customerPhone')}
                      error={errors.customerPhone?.message}
                    />
                    {isSearchingCustomer && (
                      <span className="absolute right-3 top-9 text-[11px] text-amber-700 animate-pulse font-medium">
                        Đang tìm...
                      </span>
                    )}
                    {existingCustomer && (
                      <span className="text-[11px] text-emerald-700 font-medium mt-1 block">
                        ✓ Khách thân thiết: {existingCustomer.fullName}
                      </span>
                    )}
                  </div>

                  <Input
                    label="Họ và tên (*)"
                    placeholder="VD: Nguyễn Văn A"
                    {...register('customerName')}
                    error={errors.customerName?.message}
                  />

                  <Input
                    label="Địa chỉ Email"
                    type="email"
                    placeholder="khachhang@email.com"
                    {...register('customerEmail')}
                    error={errors.customerEmail?.message}
                  />

                  <Input
                    label="Địa chỉ liên hệ"
                    placeholder="Số nhà, đường, phường/xã..."
                    {...register('customerAddress')}
                    error={errors.customerAddress?.message}
                  />
                </div>
              </div>

              {/* MODERN STEP 1 -> STEP 2 GAP CONNECTOR WITH DOWN ARROW */}
              <div className="relative py-1 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-dashed border-stone-200" />
                </div>
                <div className="relative flex items-center gap-1.5 px-3 py-1 bg-stone-50 border border-stone-200/90 text-stone-600 rounded-full text-xs font-semibold shadow-2xs">
                  <span className="text-[11px] text-stone-500">Chuyển tiếp</span>
                  <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center text-amber-800">
                    <IconArrowDown className="w-3 h-3 animate-bounce" />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Device Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 border-b border-stone-200/80 pb-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800 shrink-0 font-bold text-xs">
                    <IconLaptop className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 uppercase tracking-wider">
                        Bước 2
                      </span>
                      <h3 className="font-bold text-stone-900 text-sm">
                        Thông Tin Thiết Bị Tiếp Nhận
                      </h3>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Ghi nhận số serial/IMEI để tự động kích hoạt chính sách bảo hành
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <Input
                    label="Tên thiết bị / Model (*)"
                    placeholder="VD: Dell Inspiron 15"
                    {...register('deviceName')}
                    error={errors.deviceName?.message}
                  />

                  <Input
                    label="Số Serial / IMEI"
                    placeholder="VD: DL15-8942-X"
                    {...register('serialNumber')}
                    error={errors.serialNumber?.message}
                  />

                  <Input
                    label="Thương hiệu (Brand)"
                    placeholder="VD: Dell, Apple, Asus..."
                    {...register('brand')}
                    error={errors.brand?.message}
                  />
                </div>

                <div className="pt-2 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-xs font-semibold text-stone-800 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('isUnderWarranty')}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                    />
                    <span>Thiết bị còn trong hạn bảo hành chính hãng</span>
                  </label>

                  {isUnderWarranty && (
                    <div className="w-full sm:w-52">
                      <Input
                        label="Ngày hết hạn bảo hành"
                        type="date"
                        {...register('warrantyExpiryDate')}
                        error={errors.warrantyExpiryDate?.message}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column (5 cols): Step 3 + Submit Action with Right Arrow Flow */}
            <div className="lg:col-span-5 p-5 sm:p-6 bg-stone-50/60 border-t lg:border-t-0 lg:border-l border-stone-200 flex flex-col justify-between relative">
              {/* Desktop Floating Right-Arrow Flow Connector Badge on Border */}
              <div className="hidden lg:flex absolute -left-3.5 top-24 z-10 w-7 h-7 rounded-full bg-white border border-stone-300 shadow-2xs items-center justify-center text-amber-700">
                <IconArrowRight className="w-3.5 h-3.5" />
              </div>

              {/* Mobile Down-Arrow Flow Connector Badge on Border */}
              <div className="lg:hidden flex justify-center -mt-9 mb-4">
                <div className="w-7 h-7 rounded-full bg-white border border-stone-300 shadow-2xs flex items-center justify-center text-amber-700">
                  <IconArrowDown className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* SECTION 3: Service & Diagnosis */}
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 border-b border-stone-200/80 pb-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800 shrink-0 font-bold text-xs">
                    <IconClipboardList className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 uppercase tracking-wider">
                        Bước 3
                      </span>
                      <h3 className="font-bold text-stone-900 text-sm">
                        Tình Trạng Lỗi & Dịch Vụ
                      </h3>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Ghi nhận hiện trạng và phân loại dịch vụ xử lý
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Loại hình tiếp nhận dịch vụ (*)
                  </label>
                  <div className="relative flex items-center">
                    <select
                      {...register('ticketType')}
                      className="w-full h-11 min-h-[44px] px-3.5 pr-10 rounded-xl border border-sand-200 bg-white text-xs font-semibold text-stone-800 focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 appearance-none cursor-pointer"
                    >
                      <option value="repair">Sửa chữa tính phí (Repair)</option>
                      <option value="warranty">Bảo hành miễn phí (Warranty)</option>
                      <option value="re_repair">Sửa lại / Bảo hành sửa chữa (Re-repair)</option>
                    </select>
                    <div className="absolute inset-y-0 right-3.5 flex items-center justify-center pointer-events-none text-stone-400">
                      <IconChevronDown size={15} className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>

                <Textarea
                  label="Mô tả lỗi từ khách hàng (*)"
                  rows={3}
                  placeholder="VD: Máy bị sập nguồn khi chạy ứng dụng nặng, màn hình chớp nháy khi mở bản lề..."
                  {...register('issueDescription')}
                  error={errors.issueDescription?.message}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Ngoại quan lúc nhận"
                    placeholder="VD: Trầy nắp A, đủ ốc..."
                    {...register('initialCondition')}
                    error={errors.initialCondition?.message}
                  />

                  <Input
                    label="Phụ kiện gửi kèm"
                    placeholder="VD: Củ sạc 65W, túi..."
                    {...register('accessories')}
                    error={errors.accessories?.message}
                  />
                </div>
              </div>

              {/* Submit CTA Section */}
              <div className="pt-4 border-t border-stone-200 space-y-2 mt-4">
                <Button
                  type="submit"
                  size="lg"
                  isLoading={isSubmitting}
                  leftIcon={<IconCheckCircle className="w-5 h-5" />}
                  className="w-full h-12 text-sm font-bold bg-bronze-600 hover:bg-bronze-700 text-white shadow-md active:scale-[0.98] transition-all cursor-pointer"
                >
                  Tạo Phiếu Tiếp Nhận & In Biên Nhận
                </Button>
                <p className="text-[11px] text-center text-stone-500">
                  Biên nhận tiếp nhận sẽ tự động hiển thị để in khổ nhiệt 80mm ngay sau khi lưu.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </form>
    );
  },
);

ReceptionPosForm.displayName = 'ReceptionPosForm';
