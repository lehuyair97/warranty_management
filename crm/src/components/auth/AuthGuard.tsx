'use client';

import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import { useSnapshot } from 'valtio';
import { IconShieldAlert } from '@/assets/icon';
import { Button } from '@/components/ui/button';
import { authActions, authState } from '@/stores/auth.store';
import { EmployeeRole } from '@/types';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: EmployeeRole[];
}

/**
 * Valtio-powered Authentication & Authorization Guard.
 * Enforces authenticated session and role-based access control (RBAC).
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  allowedRoles,
}) => {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useSnapshot(authState);

  useEffect(() => {
    authActions.init();
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Loading skeleton screen while Valtio initializes token
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-600 border-t-transparent" />
          <p className="text-sm font-medium text-stone-500">
            Đang xác thực thông tin đăng nhập...
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated redirecting
  if (!isAuthenticated || !user) {
    return null;
  }

  // Role authorization check
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex h-[70vh] w-full flex-col items-center justify-center px-4 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
          <IconShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-stone-900">
          Không có quyền truy cập
        </h2>
        <p className="mt-2 max-w-md text-sm text-stone-600">
          Tài khoản của bạn ({user.fullName} - {user.role}) không được phân quyền truy cập vào phân hệ này.
        </p>
        <div className="mt-6 flex gap-3">
          <Button variant="outline" onClick={() => router.back()}>
            Quay lại
          </Button>
          <Button onClick={() => router.push('/dashboard')}>
            Về Trang chủ
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
