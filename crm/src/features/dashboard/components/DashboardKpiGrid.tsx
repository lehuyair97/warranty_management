'use client';

import React from 'react';
import { motion } from 'motion/react';
import {
  IconClock,
  IconDollarSign,
  IconPackage,
  IconWrench,
} from '@/assets/icon';
import { formatVND } from '@/common/helpers/currency.helper';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { StatCard } from '@/components/ui/stat-card';
import { DashboardSummary } from '@/types';

export interface DashboardKpiGridProps {
  summary?: DashboardSummary | null;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' as const },
  },
};

/**
 * KPI Statistics Grid component for the Executive Dashboard.
 * Displays animated metric numbers, active repairs, low stock alert, and total revenue.
 */
export const DashboardKpiGrid = React.memo<DashboardKpiGridProps>(({ summary }) => {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      <motion.div variants={itemVariants}>
        <StatCard
          label="Tổng Phiếu Tiếp Nhận"
          value={<AnimatedNumber value={summary?.overview?.totalTickets || 0} />}
          icon={<IconWrench className="w-6 h-6 text-amber-700" />}
          subtext={`${summary?.overview?.completedTickets || 0} đã hoàn tất`}
        />
      </motion.div>
      <motion.div variants={itemVariants}>
        <StatCard
          label="Đang Xử Lý & Sửa Chữa"
          value={<AnimatedNumber value={summary?.overview?.activeTickets || 0} />}
          icon={<IconClock className="w-6 h-6 text-amber-600" />}
          subtext="Tiến độ hoạt động bình thường"
        />
      </motion.div>
      <motion.div variants={itemVariants}>
        <StatCard
          label="Linh Kiện Cảnh Báo Tồn"
          value={<AnimatedNumber value={summary?.overview?.lowStockPartsCount || 0} />}
          icon={<IconPackage className="w-6 h-6 text-rose-600" />}
          subtext={
            (summary?.overview?.lowStockPartsCount || 0) > 0
              ? 'Cần bổ sung nguồn cung'
              : 'Tồn kho ở mức an toàn'
          }
        />
      </motion.div>
      <motion.div variants={itemVariants}>
        <StatCard
          label="Doanh Thu Đã Quyết Toán"
          value={
            <AnimatedNumber
              value={Number(summary?.overview?.totalRevenue || 0)}
              formatter={(val) => formatVND(val)}
            />
          }
          icon={<IconDollarSign className="w-6 h-6 text-emerald-700" />}
          subtext="Từ các hóa đơn đã thanh toán"
        />
      </motion.div>
    </motion.div>
  );
});

DashboardKpiGrid.displayName = 'DashboardKpiGrid';
