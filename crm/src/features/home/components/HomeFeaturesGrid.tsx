'use client';

import React from 'react';
import {
  IconCheckCircle,
  IconClipboardList,
  IconWrench,
} from '@/assets/icon';
import { Card } from '@/components/ui/card';

interface FeatureHighlight {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const FEATURE_HIGHLIGHTS: readonly FeatureHighlight[] = [
  {
    title: 'Tiếp Nhận POS 1-Chạm',
    description:
      'Tra cứu số điện thoại khách hàng, tự động nhận diện thiết bị còn hạn bảo hành chính hãng và áp dụng chiết khấu 100% tiền công.',
    icon: <IconClipboardList className="w-6 h-6 text-bronze-600" />,
  },
  {
    title: 'Bàn Kỹ Thuật Tập Trung',
    description:
      'Ghi nhận nguyên nhân lỗi, phương án sửa chữa, bóc tách linh kiện thay thế và tự động khấu trừ kho linh kiện thời gian thực bằng DB Trigger.',
    icon: <IconWrench className="w-6 h-6 text-bronze-600" />,
  },
  {
    title: 'Đối Soát & Cảnh Báo Trễ',
    description:
      'Thủ tục lưu trữ T-SQL quét phát hiện hóa đơn sai lệch số dư và tự động phát hiện các phiếu sửa trễ hạn giao hẹn với khách hàng.',
    icon: <IconCheckCircle className="w-6 h-6 text-bronze-600" />,
  },
] as const;

/**
 * Landing Page Feature Highlights Grid displaying core system capabilities.
 */
export const HomeFeaturesGrid = React.memo(() => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 text-left w-full">
      {FEATURE_HIGHLIGHTS.map((feature) => (
        <Card
          key={feature.title}
          className="p-6 bg-white hover:border-bronze-600 transition-colors"
        >
          <div className="w-12 h-12 rounded-xl bg-sand-100 text-stone-900 flex items-center justify-center mb-4">
            {feature.icon}
          </div>
          <h3 className="text-base font-bold text-stone-900 mb-1.5">
            {feature.title}
          </h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            {feature.description}
          </p>
        </Card>
      ))}
    </div>
  );
});

HomeFeaturesGrid.displayName = 'HomeFeaturesGrid';
