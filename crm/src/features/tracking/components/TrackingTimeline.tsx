'use client';

import React from 'react';
import { IconCheck } from '@/assets/icon';
import { TicketStatus } from '@/types';

interface TrackingTimelineProps {
  status: TicketStatus;
}

const STEPS = [
  { key: TicketStatus.RECEIVED, label: 'Tiếp nhận', desc: 'Đã nhận máy vào hệ thống' },
  { key: TicketStatus.INSPECTING, label: 'Kiểm tra', desc: 'KTV chẩn đoán lỗi' },
  { key: TicketStatus.WAITING_FOR_PARTS, label: 'Chờ linh kiện', desc: 'Điều chuyển vật tư' },
  { key: TicketStatus.REPAIRING, label: 'Sửa chữa', desc: 'Đang tiến hành khắc phục' },
  { key: TicketStatus.COMPLETED, label: 'Hoàn tất', desc: 'Đã sửa xong, chờ khách' },
  { key: TicketStatus.DELIVERED, label: 'Đã trả máy', desc: 'Khách đã nhận lại thiết bị' },
];

export const TrackingTimeline: React.FC<TrackingTimelineProps> = ({ status }) => {
  const getStepStatus = (stepKey: string) => {
    const order = [
      TicketStatus.RECEIVED,
      TicketStatus.INSPECTING,
      TicketStatus.WAITING_FOR_PARTS,
      TicketStatus.REPAIRING,
      TicketStatus.COMPLETED,
      TicketStatus.DELIVERED,
    ];
    const currentIndex = order.indexOf(status);
    const stepIndex = order.indexOf(stepKey as TicketStatus);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="py-6 px-4">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {STEPS.map((step, idx) => {
          const stepStatus = getStepStatus(step.key);
          const isDone = stepStatus === 'completed';
          const isActive = stepStatus === 'active';

          return (
            <div
              key={step.key}
              className={`p-3 rounded-2xl border text-center transition-all ${
                isActive
                  ? 'bg-amber-100/60 border-amber-500 shadow-sm ring-2 ring-amber-400/30'
                  : isDone
                    ? 'bg-emerald-50 border-emerald-300'
                    : 'bg-stone-50 border-stone-200 opacity-60'
              }`}
            >
              <div
                className={`w-7 h-7 mx-auto mb-2 rounded-full flex items-center justify-center text-xs font-bold ${
                  isActive
                    ? 'bg-amber-700 text-white'
                    : isDone
                      ? 'bg-emerald-600 text-white'
                      : 'bg-stone-200 text-stone-600'
                }`}
              >
                {isDone ? <IconCheck className="w-3.5 h-3.5" /> : idx + 1}
              </div>
              <div className="font-bold text-xs text-stone-900">{step.label}</div>
              <div className="text-[10px] text-stone-500 mt-0.5">{step.desc}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
