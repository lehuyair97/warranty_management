'use client';

import React from 'react';
import { IconPackage, IconUserCheck } from '@/assets/icon';
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
  topTechnicians?: {
    id: number;
    name: string;
    totalHandled: number;
    completedCount: number;
  }[];
}

/**
 * Top Consumed Parts & Top Active Technicians Leaderboard Cards.
 */
export const TopPartsLeaderboardCard = React.memo<TopPartsLeaderboardCardProps>(({
  topParts = [],
  topTechnicians = [],
}) => {
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

      {/* Top Active Technicians Leaderboard */}
      <Card className="p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800">
                <IconUserCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900">
                  Top Kỹ Thuật Viên Tích Cực
                </h3>
                <p className="text-xs text-stone-500">
                  Hiệu suất hoàn tất ca sửa trên tổng số ca được bàn giao
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sand-100 text-stone-700">
              {topTechnicians.length} kỹ thuật viên
            </span>
          </div>

          <div className="space-y-3 mt-4">
            {topTechnicians.length > 0 ? (
              topTechnicians.map((tech, index) => {
                const percent =
                  tech.totalHandled > 0
                    ? Math.round((tech.completedCount / tech.totalHandled) * 100)
                    : 0;
                return (
                  <div key={tech.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-4.5 h-4.5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px]">
                          {index + 1}
                        </span>
                        <span className="font-semibold text-stone-800 truncate max-w-[180px]">
                          {tech.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-900">
                          {tech.completedCount}/{tech.totalHandled} ca xong
                        </span>
                        <span className="text-[11px] text-emerald-700 font-semibold w-10 text-right">
                          {percent}%
                        </span>
                      </div>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="w-full h-1.5 bg-sand-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-xs text-stone-400 py-6 text-center">
                Chưa có dữ liệu phân công kỹ thuật viên
              </div>
            )}
          </div>
          <p className="text-[11px] text-stone-400 italic mt-3 pt-2 border-t border-sand-100">
            * Ca xong = Số máy kỹ thuật viên đã sửa hoàn tất (gồm đang chờ trả & đã bàn giao cho khách).
          </p>
        </div>
      </Card>
    </div>
  );
});

TopPartsLeaderboardCard.displayName = 'TopPartsLeaderboardCard';

