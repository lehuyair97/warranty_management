'use client';

import React from 'react';
import { IconShieldCheck } from '@/assets/icon';
import { Card } from '@/components/ui/card';
import { DemoAccountsSelector, LoginForm } from '@/features/auth/components';
import { useAuthLogin } from '@/features/auth/hooks/useAuthLogin';

/**
 * Authentication Login Page Screen (~55 lines)
 * Pure View Orchestrator delegating state and logic to useAuthLogin.
 */
export default function LoginPage() {
  const {
    username,
    setUsername,
    password,
    setPassword,
    isLoading,
    error,
    handleLogin,
    handleSelectDemoAccount,
  } = useAuthLogin();

  return (
    <div className="py-12 px-4 sm:px-6 flex items-center justify-center min-h-[calc(100vh-5rem)]">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-stone-900 text-white flex items-center justify-center mx-auto mb-3 shadow-md">
            <IconShieldCheck className="w-6 h-6 text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold text-stone-900 tracking-tight">
            Đăng Nhập Hệ Thống
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Cổng quản trị dành riêng cho nhân viên UIT CARE
          </p>
        </div>

        {/* Auth Card Container */}
        <Card className="p-6 sm:p-8 bg-white border-sand-200 shadow-sm">
          <LoginForm
            username={username}
            password={password}
            onUsernameChange={setUsername}
            onPasswordChange={setPassword}
            onSubmit={handleLogin}
            isLoading={isLoading}
            error={error}
          />

          <DemoAccountsSelector
            currentUsername={username}
            onSelectAccount={handleSelectDemoAccount}
          />
        </Card>
      </div>
    </div>
  );
}
