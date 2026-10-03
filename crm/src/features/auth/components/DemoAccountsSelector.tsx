'use client';

import React from 'react';
import { IconCheckCircle } from '@/assets/icon';

interface DemoAccount {
  username: string;
  label: string;
  roleDescription: string;
}

const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  {
    username: 'admin',
    label: 'admin (Quản lý)',
    roleDescription: 'Toàn quyền: Dashboard, Kho, Nhân sự, Báo cáo',
  },
  {
    username: 'reception1',
    label: 'reception1 (Lễ tân Hà)',
    roleDescription: 'Quyền hạn: Tiếp nhận POS, Thu ngân & Trả máy',
  },
  {
    username: 'tech1',
    label: 'tech1 (Kỹ thuật viên Quân)',
    roleDescription: 'Quyền hạn: Bàn kỹ thuật, Chẩn đoán, Gắn linh kiện',
  },
] as const;

interface DemoAccountsSelectorProps {
  currentUsername: string;
  onSelectAccount: (username: string, password?: string) => void;
}

/**
 * 1-Click Demo Accounts Selector for rapid role testing.
 */
export const DemoAccountsSelector = React.memo<DemoAccountsSelectorProps>(({
  currentUsername,
  onSelectAccount,
}) => {
  return (
    <div className="mt-8 pt-6 border-t border-sand-200">
      <div className="text-[11px] uppercase tracking-wider font-bold text-stone-500 mb-3 text-center">
        Chọn nhanh tài khoản thử nghiệm (1-Click Demo)
      </div>
      <div className="flex flex-col gap-2">
        {DEMO_ACCOUNTS.map((acc) => {
          const isSelected = currentUsername === acc.username;
          return (
            <button
              key={acc.username}
              type="button"
              onClick={() => onSelectAccount(acc.username, '123456')}
              className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between cursor-pointer ${
                isSelected
                  ? 'border-stone-900 bg-stone-900 text-white font-bold'
                  : 'border-sand-200 bg-sand-50 text-stone-700 hover:bg-sand-100'
              }`}
            >
              <div>
                <div className="font-semibold">{acc.label}</div>
                <div
                  className={`text-[10px] ${
                    isSelected ? 'text-stone-300' : 'text-stone-400'
                  }`}
                >
                  {acc.roleDescription}
                </div>
              </div>
              {isSelected && <IconCheckCircle className="w-4 h-4 text-amber-400" />}
            </button>
          );
        })}
      </div>
    </div>
  );
});

DemoAccountsSelector.displayName = 'DemoAccountsSelector';
