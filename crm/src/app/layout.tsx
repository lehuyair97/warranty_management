import type { Metadata } from 'next';
import './globals.css';
import { Shell } from '@/components/layout/shell';

export const metadata: Metadata = {
  title: 'UIT CARE - Hệ Thống Quản Lý Bảo Hành & Sửa Chữa Thiết Bị',
  description:
    'Hệ thống quản lý tiếp nhận thiết bị, phân công kỹ thuật viên, chẩn đoán báo giá, kiểm soát kho linh kiện và thanh toán hóa đơn.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="h-full">
      <body className="min-h-full flex flex-col font-sans">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
