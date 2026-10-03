import React from 'react';

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  subtext?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  highlight?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  subtext,
  trend,
  highlight = false,
}) => {
  return (
    <div
      className={`p-5 rounded-2xl border transition-all ${
        highlight
          ? 'bg-amber-50/60 border-amber-200 shadow-xs'
          : 'bg-white border-sand-200 shadow-xs'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
          {label}
        </span>
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            highlight ? 'bg-amber-100 text-amber-800' : 'bg-sand-100 text-stone-700'
          }`}
        >
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-stone-900 tracking-tight">{value}</div>
      {(subtext || trend) && (
        <div className="flex items-center gap-2 mt-2">
          {trend && (
            <span
              className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                trend.isPositive
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {trend.value}
            </span>
          )}
          {subtext && <span className="text-xs text-stone-500">{subtext}</span>}
        </div>
      )}
    </div>
  );
};
