'use client';

import React from 'react';
import { IconAlertCircle, IconShieldCheck } from '@/assets/icon';
import { Card } from '@/components/ui/card';
import { TrackingResultCard } from '@/features/tracking/components/TrackingResultCard';
import { TrackingSearchForm } from '@/features/tracking/components/TrackingSearchForm';
import { usePublicTracking } from '@/features/tracking/hooks/usePublicTracking';

/**
 * Public Guest Tracking Screen (~65 lines)
 * Pure View Orchestrator delegating search and results display to feature components.
 */
export default function GuestTrackingPage() {
  const {
    ticketCode,
    setTicketCode,
    phoneNumber,
    setPhoneNumber,
    isLoading,
    ticket,
    error,
    handleSearch,
    handleQuickLookup,
  } = usePublicTracking();

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-8">
      {/* Hero Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold">
          <IconShieldCheck className="w-4 h-4 text-amber-700" />
          Hệ thống tra cứu bảo hành minh bạch UIT CARE
        </div>
        <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">
          Tra Cứu Tiến Độ Sửa Chữa Trực Tuyến
        </h1>
        <p className="text-stone-500 text-sm max-w-lg mx-auto">
          Nhập mã phiếu dịch vụ và số điện thoại đã đăng ký để kiểm tra trạng thái linh kiện, chi phí và lịch sử tiếp nhận.
        </p>
      </div>

      {/* Feature Search Form Component */}
      <TrackingSearchForm
        ticketCode={ticketCode}
        setTicketCode={setTicketCode}
        phoneNumber={phoneNumber}
        setPhoneNumber={setPhoneNumber}
        isLoading={isLoading}
        handleSearch={handleSearch}
        handleQuickLookup={handleQuickLookup}
      />

      {/* Error View */}
      {error && (
        <Card className="p-6 bg-rose-50 border-rose-200 text-center space-y-2">
          <div className="w-10 h-10 mx-auto rounded-full bg-rose-100 flex items-center justify-center text-rose-700">
            <IconAlertCircle className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-rose-900 text-sm">Không tìm thấy thông tin</h3>
          <p className="text-xs text-rose-700 max-w-md mx-auto">{error}</p>
        </Card>
      )}

      {/* Feature Result Card Component */}
      {ticket && <TrackingResultCard ticket={ticket} />}
    </div>
  );
}
