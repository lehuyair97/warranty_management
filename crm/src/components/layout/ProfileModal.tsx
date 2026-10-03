'use client';

import React, { useState } from 'react';
import { useSnapshot } from 'valtio';
import {
  IconCheckCircle,
  IconLock,
  IconShieldCheck,
  IconUser,
} from '@/assets/icon';
import { BaseModal } from '@/components/core/BaseModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authService } from '@/services/auth.service';
import { authActions, authState } from '@/stores/auth.store';
import { uiActions } from '@/stores/ui.store';
import { getErrorMessage, UserProfile } from '@/types';

interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ProfileFormContentProps {
  user: UserProfile;
  onClose: () => void;
}

const ProfileFormContent: React.FC<ProfileFormContentProps> = ({ user, onClose }) => {
  const [fullName, setFullName] = useState(user.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber || '');
  const [email, setEmail] = useState(user.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      uiActions.addToast({
        type: 'warning',
        title: 'Thiếu thông tin',
        message: 'Họ và tên không được để trống.',
      });
      return;
    }

    if (newPassword) {
      if (!currentPassword) {
        uiActions.addToast({
          type: 'warning',
          title: 'Yêu cầu mật khẩu hiện tại',
          message: 'Vui lòng nhập mật khẩu hiện tại để xác nhận đổi mật khẩu.',
        });
        return;
      }
      if (newPassword.length < 6) {
        uiActions.addToast({
          type: 'warning',
          title: 'Mật khẩu quá ngắn',
          message: 'Mật khẩu mới phải có tối thiểu 6 ký tự.',
        });
        return;
      }
      if (newPassword !== confirmPassword) {
        uiActions.addToast({
          type: 'error',
          title: 'Mật khẩu không khớp',
          message: 'Mật khẩu xác nhận không trùng khớp với mật khẩu mới.',
        });
        return;
      }
    }

    setIsLoading(true);
    try {
      const payload: {
        fullName: string;
        phoneNumber?: string;
        email?: string;
        currentPassword?: string;
        password?: string;
      } = {
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
        email: email.trim() || undefined,
      };

      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.password = newPassword;
      }

      const updatedUser = await authService.updateProfile(payload);
      authActions.updateUser(updatedUser);

      uiActions.addToast({
        type: 'success',
        title: 'Cập nhật thành công',
        message: 'Thông tin tài khoản đã được lưu vào hệ thống.',
      });

      onClose();
    } catch (err: unknown) {
      uiActions.addToast({
        type: 'error',
        title: 'Cập nhật thất bại',
        message: getErrorMessage(err, 'Không thể cập nhật hồ sơ cá nhân.'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Account Header Banner */}
      <div className="flex items-center gap-3.5 p-3.5 bg-stone-50 rounded-2xl border border-stone-200">
        <div className="w-12 h-12 rounded-full bg-stone-900 text-white flex items-center justify-center font-bold text-lg">
          <IconUser className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-900 text-sm">{user.username}</span>
            <Badge variant="outline" size="sm" className="capitalize">
              <IconShieldCheck className="w-3 h-3 mr-1 text-amber-700" />
              {user.role}
            </Badge>
          </div>
          <p className="text-xs text-stone-500 truncate mt-0.5">
            ID Nhân viên: #{user.id} · Hệ thống UIT CARE Pro
          </p>
        </div>
      </div>

      {/* Contact Info Fields */}
      <div className="space-y-3.5">
        <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
          <IconUser className="w-3.5 h-3.5 text-stone-500" />
          Thông Tin Liên Hệ
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="sm:col-span-2">
            <Input
              label="Họ và tên (*)"
              placeholder="Nhập họ và tên đầy đủ"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <Input
            label="Số điện thoại"
            placeholder="VD: 0901234567"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
          <Input
            label="Email liên hệ"
            type="email"
            placeholder="nhanvien@uitcare.vn"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>

      {/* Password Change Section */}
      <div className="pt-3 border-t border-stone-200 space-y-3.5">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
            <IconLock className="w-3.5 h-3.5 text-stone-500" />
            Đổi Mật Khẩu (Để trống nếu không đổi)
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="Mật khẩu hiện tại"
            type="password"
            placeholder="••••••••"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <Input
            label="Mật khẩu mới"
            type="password"
            placeholder="Tối thiểu 6 ký tự"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Input
            label="Xác nhận mật khẩu"
            type="password"
            placeholder="Nhập lại mật khẩu mới"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2.5 pt-3 border-t border-stone-100">
        <Button
          type="button"
          variant="outline"
          size="md"
          onClick={onClose}
          disabled={isLoading}
        >
          Hủy bỏ
        </Button>
        <Button
          type="submit"
          size="md"
          isLoading={isLoading}
          leftIcon={<IconCheckCircle className="w-4 h-4" />}
        >
          Lưu thay đổi
        </Button>
      </div>
    </form>
  );
};

/**
 * User Profile & Password Management Modal.
 * Allows employees to update contact details and change account credentials.
 */
export const ProfileModal: React.FC<ProfileModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { user } = useSnapshot(authState);

  if (!user || !open) return null;

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Hồ Sơ Cá Nhân & Bảo Mật"
      description="Quản lý thông tin liên hệ và mật khẩu tài khoản nội bộ"
      size="lg"
      hideFooter={true}
    >
      <ProfileFormContent
        key={`${user.id}_${open}`}
        user={user}
        onClose={() => onOpenChange(false)}
      />
    </BaseModal>
  );
};
