'use client';

import React from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CHART_PALETTE } from '@/common/constants';
import { formatVND } from '@/common/helpers/currency.helper';
import { Card } from '@/components/ui/card';

export interface RevenueTrendAreaChartProps {
  monthlyTrends?: {
    month: string;
    tickets: number;
    revenue: number;
  }[];
}

/**
 * Modern Dual-Axis Area chart visualizing monthly revenue and ticket intake trends.
 */
export const RevenueTrendAreaChart = React.memo<RevenueTrendAreaChartProps>(({
  monthlyTrends = [],
}) => {
  // Format month labels from "YYYY-MM" to "T.M" (e.g. "T.10")
  const data = monthlyTrends.map((item) => {
    const parts = item.month.split('-');
    const label = parts.length === 2 ? `T.${parseInt(parts[1], 10)}` : item.month;
    return {
      ...item,
      label,
      revenueMillions: Math.round(item.revenue / 1000000 * 10) / 10,
    };
  });

  return (
    <Card className="p-5 flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-bold text-stone-900">
            Xu Hướng Tiếp Nhận & Doanh Thu (6 Tháng)
          </h3>
          <p className="text-xs text-stone-500">
            Tương quan giữa số lượng ca sửa chữa và doanh thu quyết toán
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <span className="text-stone-600 font-medium">Doanh thu (VNĐ)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-stone-600 font-medium">Số phiếu</span>
          </div>
        </div>
      </div>

      <div className="w-full h-[240px]">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_PALETTE.revenue} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={CHART_PALETTE.revenue} stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_PALETTE.tickets} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={CHART_PALETTE.tickets} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_PALETTE.grid} vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: CHART_PALETTE.axisTick }}
              />
              <YAxis
                yAxisId="left"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: CHART_PALETTE.axisTick }}
                tickFormatter={(val) => `${val}Tr`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: CHART_PALETTE.axisTick }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const row = payload[0].payload;
                    return (
                      <div className="bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-sand-200 text-xs space-y-1.5 min-w-[150px]">
                        <div className="font-bold text-stone-900 border-b border-sand-100 pb-1">
                          Tháng {label} ({row.month})
                        </div>
                        <div className="flex items-center justify-between text-blue-700 font-semibold">
                          <span>Doanh thu:</span>
                          <span>{formatVND(row.revenue)}</span>
                        </div>
                        <div className="flex items-center justify-between text-amber-700 font-semibold">
                          <span>Số lượng phiếu:</span>
                          <span>{row.tickets} phiếu</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="revenueMillions"
                name="Doanh thu"
                stroke={CHART_PALETTE.revenue}
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorRevenue)"
                animationDuration={1200}
              />
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="tickets"
                name="Số phiếu"
                stroke={CHART_PALETTE.tickets}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorTickets)"
                animationDuration={1200}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-stone-400">
            Chưa có đủ dữ liệu chu kỳ 6 tháng
          </div>
        )}
      </div>
    </Card>
  );
});

RevenueTrendAreaChart.displayName = 'RevenueTrendAreaChart';
