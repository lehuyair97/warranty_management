'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useState } from 'react';
import { useSnapshot } from 'valtio';
import {
  IconClipboardList,
  IconCreditCard,
  IconDatabase,
  IconFileText,
  IconHome,
  IconPackage,
  IconUsers,
  IconWrench,
  IconX,
} from '@/assets/icon';
import { ProfileModal } from '@/components/layout/ProfileModal';
import { authState } from '@/stores/auth.store';
import { uiActions, uiState } from '@/stores/ui.store';
import { EmployeeRole } from '@/types';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  roles?: EmployeeRole[];
}

const NAV_ITEMS: NavItem[] = [
  {
    name: 'Tổng quan Dashboard',
    href: '/dashboard',
    icon: <IconHome className="w-5 h-5" />,
  },
  {
    name: 'Bàn tiếp nhận (POS)',
    href: '/reception',
    icon: <IconClipboardList className="w-5 h-5" />,
    roles: [EmployeeRole.RECEPTIONIST, EmployeeRole.MANAGER],
  },
  {
    name: 'Bàn kỹ thuật (Sửa chữa)',
    href: '/technician',
    icon: <IconWrench className="w-5 h-5" />,
    roles: [EmployeeRole.TECHNICIAN, EmployeeRole.MANAGER],
  },
  {
    name: 'Thu ngân & Hóa đơn',
    href: '/cashier',
    icon: <IconCreditCard className="w-5 h-5" />,
    roles: [EmployeeRole.RECEPTIONIST, EmployeeRole.MANAGER],
  },
  {
    name: 'Danh sách phiếu sửa',
    href: '/tickets',
    icon: <IconFileText className="w-5 h-5" />,
  },
  {
    name: 'Kho linh kiện',
    href: '/inventory',
    icon: <IconPackage className="w-5 h-5" />,
  },
  {
    name: 'Quản lý nhân sự',
    href: '/employees',
    icon: <IconUsers className="w-5 h-5" />,
    roles: [EmployeeRole.MANAGER],
  },
  {
    name: 'Quản trị CSDL (Data & Backup)',
    href: '/database',
    icon: <IconDatabase className="w-5 h-5" />,
    roles: [EmployeeRole.MANAGER],
  },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user } = useSnapshot(authState);
  const { sidebarOpen } = useSnapshot(uiState);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const filteredItems = NAV_ITEMS.filter((item) => {
    if (!item.roles || !item.roles.length) return true;
    if (!user) return false;
    return item.roles.includes(user.role);
  });

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-sand-200 w-64 p-4">
      <div className="flex items-center justify-between pb-4 mb-2 border-b border-sand-200 lg:hidden">
        <span className="font-bold text-stone-900 text-sm">Menu Điều Hướng</span>
        <button
          onClick={() => uiActions.closeSidebar()}
          className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
        >
          <IconX className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1.5 overflow-y-auto">
        {filteredItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => uiActions.closeSidebar()}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-700 hover:bg-sand-100 hover:text-stone-900'
              }`}
            >
              <span className={isActive ? 'text-amber-400' : 'text-stone-500'}>
                {item.icon}
              </span>
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Role Indicator Footer */}
      {user && (
        <div className="pt-4 border-t border-sand-200">
          <button
            type="button"
            onClick={() => setProfileModalOpen(true)}
            title="Nhấp để xem & cập nhật hồ sơ cá nhân"
            className="w-full text-left p-3 bg-sand-50 hover:bg-sand-100 rounded-xl border border-sand-200 transition-colors cursor-pointer group"
          >
            <div className="text-[11px] uppercase font-bold text-stone-500 tracking-wider flex items-center justify-between">
              <span>Phiên làm việc</span>
              <span className="text-[10px] text-amber-700 font-semibold group-hover:underline">
                Sửa hồ sơ
              </span>
            </div>
            <div className="text-xs font-bold text-stone-900 truncate mt-0.5 group-hover:text-bronze-600">
              {user.fullName}
            </div>
            <div className="text-[10px] text-stone-500 font-mono mt-0.5">
              Vai trò: {user.role}
            </div>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block shrink-0 h-full overflow-y-auto">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs"
            onClick={() => uiActions.closeSidebar()}
          />
          <div className="fixed inset-y-0 left-0 z-50 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}

      <ProfileModal
        open={profileModalOpen}
        onOpenChange={setProfileModalOpen}
      />
    </>
  );
};
