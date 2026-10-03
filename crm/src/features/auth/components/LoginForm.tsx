'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface LoginFormProps {
  username: string;
  password: string;
  onUsernameChange: (val: string) => void;
  onPasswordChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  error: string | null;
}

/**
 * Standard Auth Login Form with touch target ergonomics and validation alerts.
 */
export const LoginForm = React.memo<LoginFormProps>(({
  username,
  password,
  onUsernameChange,
  onPasswordChange,
  onSubmit,
  isLoading,
  error,
}) => {
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <Input
        label="Tên tài khoản"
        placeholder="Nhập username"
        value={username}
        onChange={(e) => onUsernameChange(e.target.value)}
        required
        autoFocus
      />

      <Input
        label="Mật khẩu"
        type="password"
        placeholder="Nhập mật khẩu"
        value={password}
        onChange={(e) => onPasswordChange(e.target.value)}
        required
      />

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
          {error}
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full font-bold shadow-md"
        isLoading={isLoading}
      >
        Đăng nhập phiên làm việc
      </Button>
    </form>
  );
});

LoginForm.displayName = 'LoginForm';
