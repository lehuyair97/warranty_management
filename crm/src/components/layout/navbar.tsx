'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import { useSnapshot } from 'valtio';
import {
  IconLogOut,
  IconMenu,
  IconSearch,
  IconShieldCheck,
  IconUser,
} from '@/assets/icon';
import { ProfileModal } from '@/components/layout/ProfileModal';
import { authActions, authState } from '@/stores/auth.store';
import { uiActions } from '@/stores/ui.store';
import { EmployeeRole } from '@/types';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated } = useSnapshot(authState);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const getRoleLabel = (role?: EmployeeRole) => {
    switch (role) {
      case EmployeeRole.MANAGER:
        return 'Quản lý';
      case EmployeeRole.RECEPTIONIST:
        return 'Lễ tân';
      case EmployeeRole.TECHNICIAN:
        return 'Kỹ thuật viên';
      default:
        return '';
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-sand-200">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Mobile hamburger & Brand */}
        <div className="flex items-center gap-3">
          {isAuthenticated && (
            <button
              onClick={() => uiActions.toggleSidebar()}
              className="lg:hidden p-2 rounded-xl text-stone-600 hover:bg-sand-100 cursor-pointer transition-colors"
            >
              <IconMenu className="w-5 h-5" />
            </button>
          )}

          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-stone-900 text-white flex items-center justify-center font-bold text-sm tracking-wider shadow-xs group-hover:bg-bronze-600 transition-colors">
              <IconShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-stone-900 leading-tight tracking-tight flex items-center gap-1.5">
                <span className="text-base">UIT CARE</span>
                <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded-md border border-amber-300">
                  Pro
                </span>
              </div>
              <p className="text-[11px] text-stone-500 hidden sm:block">
                Hệ thống Quản lý Bảo hành & Sửa chữa
              </p>
            </div>
          </Link>
        </div>

        {/* Right: Public Tracking link & User Session */}
        <div className="flex items-center gap-3">
          <Link
            href="/tra-cuu"
            className="hidden sm:inline-flex items-center gap-2 text-xs font-semibold px-3.5 py-1.5 rounded-xl bg-sand-50 border border-sand-200 text-stone-700 hover:bg-sand-100 hover:text-stone-900 hover:border-stone-300 transition-all shadow-2xs"
          >
            <IconSearch className="w-3.5 h-3.5 text-bronze-600" />
            <span>Tra cứu khách hàng</span>
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono text-stone-400 bg-white border border-stone-200 rounded">
              /
            </kbd>
          </Link>

          {isAuthenticated && user ? (
            <div className="flex items-center gap-3 pl-3 border-l border-sand-200">
              <button
                type="button"
                onClick={() => setProfileModalOpen(true)}
                title="Hồ sơ cá nhân & Đổi mật khẩu"
                className="flex items-center gap-3 p-1.5 -m-1.5 rounded-xl hover:bg-sand-100 transition-colors cursor-pointer text-left group"
              >
                <div className="text-right hidden md:block">
                  <div className="text-xs font-bold text-stone-900 group-hover:text-bronze-600 transition-colors">
                    {user.fullName}
                  </div>
                  <div className="text-[11px] text-stone-500 font-medium">
                    {getRoleLabel(user.role)}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-stone-100 border border-stone-300 flex items-center justify-center text-stone-700 group-hover:border-bronze-600 group-hover:text-bronze-600 transition-colors">
                  <IconUser className="w-4 h-4" />
                </div>
              </button>
              <button
                onClick={() => authActions.logout()}
                title="Đăng xuất"
                className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <IconLogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-xs font-bold px-4 py-2 rounded-xl bg-stone-900 text-white hover:bg-stone-800 transition-colors"
            >
              Đăng nhập nhân viên
            </Link>
          )}
        </div>
      </div>

      <ProfileModal
        open={profileModalOpen}
        onOpenChange={setProfileModalOpen}
      />
    </header>
  );
};
