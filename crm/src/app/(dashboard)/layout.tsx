'use client';

import React from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex-1 flex flex-col min-w-0 min-h-0 h-full">
        {children}
      </div>
    </AuthGuard>
  );
}
