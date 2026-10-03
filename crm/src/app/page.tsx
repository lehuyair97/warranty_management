'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import { useSnapshot } from 'valtio';
import {
  IconArrowRight,
  IconSearch,
  IconShieldCheck,
} from '@/assets/icon';
import { Button } from '@/components/ui/button';
import { HomeFeaturesGrid } from '@/features/home/components';
import { authState } from '@/stores/auth.store';

/**
 * Public Landing Screen (~60 lines)
 * View Orchestrator delegating feature showcases to HomeFeaturesGrid.
 */
export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated } = useSnapshot(authState);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto flex flex-col items-center text-center">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-semibold mb-6">
        <IconShieldCheck className="w-4 h-4 text-bronze-600" />
        <span>Dịch Vụ Tiếp Nhận & Sửa Chữa Thiết Bị Tiêu Chuẩn Cao Cấp</span>
      </div>

      {/* Hero Headline */}
      <h1 className="text-4xl sm:text-5xl font-extrabold text-stone-900 tracking-tight leading-tight max-w-3xl">
        Minh Bạch Tiến Độ,{' '}
        <span className="text-bronze-600">Tối Ưu Vận Hành</span> Dịch Vụ Bảo Hành
      </h1>

      <p className="mt-4 text-base sm:text-lg text-stone-600 max-w-2xl leading-relaxed">
        Hệ thống tích hợp toàn diện từ tiếp nhận POS, chẩn đoán báo giá, kiểm soát tồn kho
        linh kiện đến đối soát hóa đơn tự động bằng cơ sở dữ liệu MS SQL Server.
      </p>

      {/* Main Actions */}
      <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        <Link href="/tra-cuu">
          <Button
            size="lg"
            variant="bronze"
            leftIcon={<IconSearch className="w-5 h-5" />}
            rightIcon={<IconArrowRight className="w-4 h-4" />}
            className="w-full sm:w-auto font-bold shadow-md"
          >
            Tra cứu tiến độ sửa chữa (Dành cho khách hàng)
          </Button>
        </Link>
        <Link href="/login">
          <Button
            size="lg"
            variant="outline"
            className="w-full sm:w-auto font-bold bg-white"
          >
            Đăng nhập nhân viên nội bộ
          </Button>
        </Link>
      </div>

      {/* Feature Highlights Grid */}
      <HomeFeaturesGrid />
    </div>
  );
}
