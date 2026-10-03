'use client';

import React from 'react';
import { useSnapshot } from 'valtio';
import {
  IconAlertCircle,
  IconAlertTriangle,
  IconCheckCircle,
  IconX,
} from '@/assets/icon';
import { uiActions, uiState } from '@/stores/ui.store';

export const ToastContainer: React.FC = () => {
  const { toasts } = useSnapshot(uiState);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-5 right-5 z-[99999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const typeClasses = {
          success: 'bg-emerald-900 text-white border-emerald-700',
          error: 'bg-rose-900 text-white border-rose-700',
          warning: 'bg-amber-900 text-white border-amber-700',
          info: 'bg-stone-900 text-white border-stone-700',
        }[toast.type];

        const icon = {
          success: <IconCheckCircle className="w-5 h-5 text-emerald-300 shrink-0" />,
          error: <IconAlertCircle className="w-5 h-5 text-rose-300 shrink-0" />,
          warning: <IconAlertTriangle className="w-5 h-5 text-amber-300 shrink-0" />,
          info: <IconAlertCircle className="w-5 h-5 text-stone-300 shrink-0" />,
        }[toast.type];

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl shadow-lg border flex items-start gap-3 animate-in slide-in-from-bottom-5 duration-200 ${typeClasses}`}
          >
            {icon}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold">{toast.title}</h4>
              {toast.message && (
                <p className="text-xs text-white/80 mt-0.5 line-clamp-2">{toast.message}</p>
              )}
            </div>
            <button
              onClick={() => uiActions.removeToast(toast.id)}
              className="text-white/60 hover:text-white shrink-0 p-0.5"
            >
              <IconX className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
