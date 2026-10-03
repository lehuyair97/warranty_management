'use client';

import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import { useSnapshot } from 'valtio';
import { IconRefresh } from '@/assets/icon';
import { Navbar } from '@/components/layout/navbar';
import { Sidebar } from '@/components/layout/sidebar';
import { ToastContainer } from '@/components/ui/toast-container';
import { cn } from '@/lib/utils';
import { QueryProvider } from '@/lib/query-provider';
import { authActions, authState } from '@/stores/auth.store';

export const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useSnapshot(authState);

  useEffect(() => {
    authActions.init();
  }, []);

  const isPublicRoute =
    pathname === '/' || pathname === '/login' || pathname.startsWith('/tra-cuu');
  const isDashboardRoute = pathname === '/dashboard';

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isPublicRoute) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, isPublicRoute, router]);

  if (isPublicRoute) {
    return (
      <QueryProvider>
        <div className="min-h-screen bg-sand-50 flex flex-col">
          <Navbar />
          <main className="flex-1 w-full">{children}</main>
          <ToastContainer />
        </div>
      </QueryProvider>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-sand-50 flex flex-col items-center justify-center gap-3">
        <IconRefresh className="w-8 h-8 text-bronze-600 animate-spin" />
        <span className="text-xs uppercase font-bold tracking-widest text-stone-500">
          Khởi động hệ thống...
        </span>
      </div>
    );
  }

  return (
    <QueryProvider>
      <div className="h-screen overflow-hidden bg-sand-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex w-full min-h-0 overflow-hidden">
          <Sidebar />
          <main
            className={cn(
              'flex-1 min-w-0 p-4 sm:p-6 lg:p-8 flex flex-col min-h-0',
              isDashboardRoute
                ? 'overflow-y-auto'
                : 'overflow-y-auto lg:overflow-hidden',
            )}
          >
            {children}
          </main>
        </div>
        <ToastContainer />
      </div>
    </QueryProvider>
  );
};
