'use client';

import React from 'react';
import { IconPhone, IconUser } from '@/assets/icon';
import {
  Column,
  createManagerEditAction,
  createManagerLockToggleAction,
  TableActions,
} from '@/components/core';
import { Badge } from '@/components/ui/badge';
import { EmployeeRole, UserProfile } from '@/types';

interface EmployeeColumnsOptions {
  onEdit: (emp: UserProfile) => void;
  onToggleActive: (emp: UserProfile) => void;
  currentUserId?: number;
  isManager: boolean;
}

export function getEmployeeColumns({
  onEdit,
  onToggleActive,
  currentUserId,
  isManager,
}: EmployeeColumnsOptions): Column<UserProfile>[] {
  const getRoleBadgeVariant = (role: EmployeeRole) => {
    switch (role) {
      case EmployeeRole.MANAGER:
        return 'primary' as const;
      case EmployeeRole.RECEPTIONIST:
        return 'info' as const;
      case EmployeeRole.TECHNICIAN:
        return 'warning' as const;
      default:
        return 'stone' as const;
    }
  };

  const getRoleLabel = (role: EmployeeRole) => {
    switch (role) {
      case EmployeeRole.MANAGER:
        return 'Quản trị (Manager)';
      case EmployeeRole.RECEPTIONIST:
        return 'Lễ tân tiếp nhận';
      case EmployeeRole.TECHNICIAN:
        return 'Kỹ thuật viên';
      default:
        return role;
    }
  };

  return [
    {
      key: 'username',
      header: 'Tài khoản',
      width: '130px',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-stone-900 bg-stone-100 px-2 py-1 rounded">
          {row.username}
        </span>
      ),
    },
    {
      key: 'fullName',
      header: 'Họ và tên nhân sự',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-stone-200 flex items-center justify-center text-xs font-bold text-stone-700">
            <IconUser className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-medium text-stone-900 block">{row.fullName}</span>
            {row.id === currentUserId && (
              <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">
                (Tài khoản của bạn)
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'phoneNumber',
      header: 'Liên hệ',
      width: '160px',
      render: (row) => (
        <div className="text-xs text-stone-600 space-y-0.5">
          {row.phoneNumber ? (
            <div className="flex items-center gap-1 font-mono">
              <IconPhone className="w-3 h-3 text-stone-400" />
              <span>{row.phoneNumber}</span>
            </div>
          ) : (
            <span className="text-stone-400 italic">Chưa cập nhật SĐT</span>
          )}
          {row.email && (
            <div className="text-[11px] text-stone-500 truncate max-w-[150px]">
              {row.email}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Chức vụ',
      width: '160px',
      render: (row) => (
        <Badge variant={getRoleBadgeVariant(row.role)} size="sm">
          {getRoleLabel(row.role)}
        </Badge>
      ),
    },
    {
      key: 'isActive',
      header: 'Trạng thái',
      width: '120px',
      render: (row) => {
        const active = row.isActive !== false;
        return (
          <Badge variant={active ? 'success' : 'danger'} size="sm">
            {active ? 'Hoạt động' : 'Đã khóa'}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      header: 'Thao tác',
      align: 'right',
      width: '80px',
      render: (row) => {
        const isSelf = row.id === currentUserId;
        const active = row.isActive !== false;
        return (
          <TableActions
            actions={[
              createManagerEditAction(() => onEdit(row), isManager, {
                tooltip: 'Chỉnh sửa nhân sự',
              }),
              createManagerLockToggleAction(active, () => onToggleActive(row), isSelf, isManager),
            ]}
          />
        );
      },
    },
  ];
}
