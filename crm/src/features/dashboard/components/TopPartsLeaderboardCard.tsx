'use client';

import React from 'react';
import { IconPackage, IconShieldCheck } from '@/assets/icon';
import { formatVND } from '@/common/helpers/currency.helper';
import { Card } from '@/components/ui/card';

export interface TopPartsLeaderboardCardProps {
  topParts?: {
    id: number;
    partName: string;
    unit: string;
    totalQuantity: number;
    totalAmount: number;
  }[];
  typeDistribution?: Record<string, number>;
}

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  repair: { label: 'Sửa chữa dịch vụ', color: 'text-blue-700', bg: 'bg-blue-500' },
  warranty: { label: 'Bảo hành chính hãng', color: 'text-emerald-700', bg: 'bg-emerald-500' },
  re_repair: { label: 'Sửa lại / Tái bảo hành', color: 'text-amber-700', bg: 'bg-amber-500' },
};

/**
 * Top Parts Leaderboard & Service Type Distribution breakdown.
 */
export const TopPartsLeaderboardCard = React.memo<TopPartsLeaderboardCardProps>(({
  topParts = [],
  typeDistribution = {},
}) => {
  const totalTypeCount = Object.values(typeDistribution).reduce((a, b) => a + b, 0);

  const maxPartQty = topParts.length > 0 ? Math.max(...topParts.map((p) => p.totalQuantity), 1) : 1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Top Consumed Parts */}
      <Card className="p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800">
                <IconPackage className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900">
                  Top Linh Kiện Tiêu Hao Nhiều Nhất
                </h3>
                <p className="text-xs text-stone-500">
                  Dựa trên số lượng đã xuất kho và thanh toán hóa đơn
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 mt-4">
            {topParts.length > 0 ? (
              topParts.map((part, index) => {
                const widthPercent = Math.round((part.totalQuantity / maxPartQty) * 100);
                return (
                  <div key={part.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-4.5 h-4.5 rounded-full bg-sand-200 text-stone-700 font-bold flex items-center justify-center text-[10px]">
                          {index + 1}
                        </span>
                        <span className="font-semibold text-stone-800 truncate max-w-[180px]">
                          {part.partName}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-stone-900">
                          {part.totalQuantity} {part.unit}
                        </span>
                        <span className="text-[11px] text-stone-500 w-20 text-right">
                          {formatVND(part.totalAmount)}
                        </span>
                      </div>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="w-full h-1.5 bg-sand-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-700"
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-xs text-stone-400 py-6 text-center">
                Chưa có dữ liệu xuất linh kiện
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Ticket Classification Ratio */}
      <Card className="p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-800">
                <IconShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900">
                  Phân Loại Tiếp Nhận (Dịch Vụ vs Bảo Hành)
                </h3>
                <p className="text-xs text-stone-500">
                  Cơ cấu giữa bảo hành hãng và sửa chữa tính phí
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sand-100 text-stone-700">
              Tổng {totalTypeCount} ca
            </span>
          </div>

          <div className="space-y-4 mt-5">
            {Object.entries(typeDistribution).map(([typeKey, count]) => {
              const config = TYPE_CONFIG[typeKey] || {
                label: typeKey,
                color: 'text-stone-700',
                bg: 'bg-stone-500',
              };
              const percent = totalTypeCount > 0 ? Math.round((count / totalTypeCount) * 100) : 0;
              return (
                <div key={typeKey} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-stone-800">{config.label}</span>
                    <span className="font-bold text-stone-900">
                      {count} ca ({percent}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-sand-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${config.bg} rounded-full transition-all duration-700`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
});

TopPartsLeaderboardCard.displayName = 'TopPartsLeaderboardCard';
