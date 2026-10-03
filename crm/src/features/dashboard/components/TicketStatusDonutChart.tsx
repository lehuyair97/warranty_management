'use client';

import React, { useMemo } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Card } from '@/components/ui/card';
import { TICKET_STATUS_CHART_COLORS } from '@/common/constants';
import { getTicketStatusConfig } from '@/common/helpers/status.helper';
import { TicketStatus } from '@/types';

export interface TicketStatusDonutChartProps {
  distribution?: Record<string, number>;
  activeCount?: number;
}

interface StatusSlice {
  key: string;
  name: string;
  value: number;
  color: string;
}

const STATUS_COLOR_PALETTE: Record<string, string> = {
  [TicketStatus.RECEIVED]: TICKET_STATUS_CHART_COLORS.received,
  [TicketStatus.INSPECTING]: TICKET_STATUS_CHART_COLORS.inspecting,
  [TicketStatus.WAITING_FOR_PARTS]: TICKET_STATUS_CHART_COLORS.waitingForParts,
  [TicketStatus.REPAIRING]: TICKET_STATUS_CHART_COLORS.repairing,
  [TicketStatus.COMPLETED]: TICKET_STATUS_CHART_COLORS.completed,
  [TicketStatus.DELIVERED]: TICKET_STATUS_CHART_COLORS.delivered,
  [TicketStatus.CANCELLED]: TICKET_STATUS_CHART_COLORS.cancelled,
};

/**
 * Modern Donut chart visualizing the repair ticket status distribution.
 */
export const TicketStatusDonutChart = React.memo<TicketStatusDonutChartProps>(({
  distribution = {},
  activeCount = 0,
}) => {
  const chartData: StatusSlice[] = useMemo(() => {
    return Object.entries(distribution)
      .map(([statusKey, count]) => {
        const config = getTicketStatusConfig(statusKey as TicketStatus);
        const color = STATUS_COLOR_PALETTE[statusKey] || TICKET_STATUS_CHART_COLORS.default;
        return {
          key: statusKey,
          name: config.label,
          value: count,
          color,
        };
      })
      .filter((slice) => slice.value > 0);
  }, [distribution]);

  const total = useMemo(
    () => chartData.reduce((acc, curr) => acc + curr.value, 0),
    [chartData],
  );

  return (
    <Card className="p-5 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-bold text-stone-900">
            Phân Bổ Vòng Đời Phiếu Sửa Chữa
          </h3>
          <p className="text-xs text-stone-500">
            Tỷ lệ phân chia theo các trạng thái thực tế
          </p>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sand-100 text-stone-700">
          Tổng {total} phiếu
        </span>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4 my-auto">
        {/* Donut Chart with Centered Metric */}
        <div className="relative w-full md:w-1/2 h-[220px] flex items-center justify-center">
          {chartData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as StatusSlice;
                        const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : '0';
                        return (
                          <div className="bg-white/95 backdrop-blur-sm px-3 py-2 rounded-xl shadow-md border border-sand-200 text-xs">
                            <div className="flex items-center gap-2 font-semibold text-stone-900">
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: data.color }}
                              />
                              {data.name}
                            </div>
                            <div className="text-stone-600 mt-1">
                              {data.value} phiếu ({percentage}%)
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    animationDuration={1000}
                    animationEasing="ease-out"
                  >
                    {chartData.map((slice) => (
                      <Cell key={slice.key} fill={slice.color} stroke="none" />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-stone-900 tracking-tight">
                  {activeCount}
                </span>
                <span className="text-[11px] text-stone-500 font-medium">
                  Đang xử lý
                </span>
              </div>
            </>
          ) : (
            <div className="text-xs text-stone-400">Chưa có dữ liệu phiếu</div>
          )}
        </div>

        {/* Legend List */}
        <div className="w-full md:w-1/2 flex flex-col gap-1.5 text-xs">
          {chartData.map((item) => {
            const percent = total > 0 ? Math.round((item.value / total) * 100) : 0;
            return (
              <div
                key={item.key}
                className="flex items-center justify-between p-1.5 rounded-lg hover:bg-sand-50 transition-colors"
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-stone-700 font-medium truncate">
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-bold text-stone-900">{item.value}</span>
                  <span className="text-[10px] text-stone-400 w-8 text-right">
                    {percent}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
});

TicketStatusDonutChart.displayName = 'TicketStatusDonutChart';
