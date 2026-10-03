'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { authService } from '@/services/auth.service';
import { authActions } from '@/stores/auth.store';
import { uiActions } from '@/stores/ui.store';
import { getErrorMessage } from '@/types';

/**
 * Controller hook managing authentication state, credential inputs,
 * 1-click demo selection, and role-based redirect routing.
 */
export function useAuthLogin() {
  const router = useRouter();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await authService.login({ username, password });
      authActions.login(res.user, res.accessToken);

      uiActions.addToast({
        type: 'success',
        title: 'Đăng nhập thành công',
        message: `Chào mừng ${res.user.fullName} (${res.user.role}) trở lại hệ thống!`,
      });

      // Role-based initial navigation
      if (res.user.role === 'technician') {
        router.push('/technician');
      } else if (res.user.role === 'receptionist') {
        router.push('/reception');
      } else {
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, 'Tên đăng nhập hoặc mật khẩu không chính xác');
      setError(errorMsg);
      uiActions.addToast({
        type: 'error',
        title: 'Đăng nhập thất bại',
        message: errorMsg,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectDemoAccount = useCallback((u: string, p: string = '123456') => {
    setUsername(u);
    setPassword(p);
    setError(null);
  }, []);

  return {
    username,
    setUsername,
    password,
    setPassword,
    isLoading,
    error,
    handleLogin,
    handleSelectDemoAccount,
  };
}
