'use client';

import React from 'react';
import type { LucideProps } from 'lucide-react';
import {
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Calendar,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  FileCheck,
  HardDrive,
  History,
  Laptop,
  Layers,
  Menu,
  MoreHorizontal,
  MoreVertical,
  PackageCheck,
  Pencil,
  Plus,
  Printer,
  QrCode,
  Shield,
  ShieldAlert,
  Smartphone,
  Tag,
  Tv,
  UserCheck,
  X,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import * as ItsHover from './itshover';

// Re-export ItsHover animated icons and types
export * as ItsHover from './itshover';
export * from './itshover';

/**
 * Normalizes supplementary Lucide icons with consistent shrink-0 behavior.
 */
function createLucideIcon(Component: React.ComponentType<LucideProps>) {
  const Icon: React.FC<LucideProps> = ({ className, ...props }) => (
    <Component className={cn('shrink-0', className)} {...props} />
  );
  return Icon;
}

/**
 * Normalizes LucideProps to ItsHover AnimatedIconProps format.
 * Ensures consistent shrink-0 so icons never distort or collapse in flex layouts.
 */
function toHoverProps(props: LucideProps) {
  const {
    size = 24,
    color = 'currentColor',
    strokeWidth = 2,
    className = '',
  } = props;
  return {
    size,
    color,
    strokeWidth: Number(strokeWidth) || 2,
    className: cn('shrink-0', className),
  };
}

/**
 * ============================================================================
 * ANIMATED ICONS POWERED BY ITSHOVER (https://www.itshover.com/)
 * Motion-first animated icons that move with intent upon hover & interaction.
 * ============================================================================
 */
export const IconHome: React.FC<LucideProps> = (props) => (
  <ItsHover.HomeIcon {...toHoverProps(props)} />
);

export const IconDashboard: React.FC<LucideProps> = (props) => (
  <ItsHover.LayoutDashboardIcon {...toHoverProps(props)} />
);

export const IconSearch: React.FC<LucideProps> = (props) => (
  <ItsHover.MagnifierIcon {...toHoverProps(props)} />
);

export const IconShieldCheck: React.FC<LucideProps> = (props) => (
  <ItsHover.ShieldCheckIcon {...toHoverProps(props)} />
);

export const IconCreditCard = createLucideIcon(CreditCard);

export const IconClock: React.FC<LucideProps> = (props) => (
  <ItsHover.ClockIcon {...toHoverProps(props)} />
);

export const IconRefresh: React.FC<LucideProps> = (props) => (
  <ItsHover.RefreshIcon {...toHoverProps(props)} />
);

export const IconUser: React.FC<LucideProps> = (props) => (
  <ItsHover.UserIcon {...toHoverProps(props)} />
);

export const IconUsers: React.FC<LucideProps> = (props) => (
  <ItsHover.UsersIcon {...toHoverProps(props)} />
);

export const IconTrash: React.FC<LucideProps> = (props) => (
  <ItsHover.TrashIcon {...toHoverProps(props)} />
);

export const IconLock: React.FC<LucideProps> = (props) => (
  <ItsHover.LockIcon {...toHoverProps(props)} />
);

export const IconLogOut: React.FC<LucideProps> = (props) => (
  <ItsHover.LogoutIcon {...toHoverProps(props)} />
);

export const IconAlertTriangle: React.FC<LucideProps> = (props) => (
  <ItsHover.TriangleAlertIcon {...toHoverProps(props)} />
);

export const IconCheckCircle: React.FC<LucideProps> = (props) => (
  <ItsHover.CheckedIcon {...toHoverProps(props)} />
);

export const IconCheck: React.FC<LucideProps> = (props) => (
  <ItsHover.CheckedIcon {...toHoverProps(props)} />
);

export const IconFileText: React.FC<LucideProps> = (props) => (
  <ItsHover.FileDescriptionIcon {...toHoverProps(props)} />
);

export const IconClipboardList: React.FC<LucideProps> = (props) => (
  <ItsHover.FileDescriptionIcon {...toHoverProps(props)} />
);

export const IconSettings: React.FC<LucideProps> = (props) => (
  <ItsHover.GearIcon {...toHoverProps(props)} />
);

export const IconCpu: React.FC<LucideProps> = (props) => (
  <ItsHover.CpuIcon {...toHoverProps(props)} />
);

export const IconPhone: React.FC<LucideProps> = (props) => (
  <ItsHover.TelephoneIcon {...toHoverProps(props)} />
);

export const IconPackage: React.FC<LucideProps> = (props) => (
  <ItsHover.CartIcon {...toHoverProps(props)} />
);

export const IconWrench: React.FC<LucideProps> = (props) => (
  <ItsHover.WrenchIcon {...toHoverProps(props)} />
);

export const IconChevronDown: React.FC<LucideProps> = (props) => (
  <ItsHover.DownChevronIcon {...toHoverProps(props)} />
);

export const IconChevronRight: React.FC<LucideProps> = (props) => (
  <ItsHover.RightChevronIcon {...toHoverProps(props)} />
);

export const IconFilter: React.FC<LucideProps> = (props) => (
  <ItsHover.FilterIcon {...toHoverProps(props)} />
);

/**
 * ============================================================================
 * SUPPLEMENTARY SYSTEM SVG ICONS
 * Centralized in assets/icon/ adhering to Strict Engineering Rules.
 * ============================================================================
 */
export const IconShield = createLucideIcon(Shield);
export const IconShieldAlert = createLucideIcon(ShieldAlert);
export const IconPackageCheck = createLucideIcon(PackageCheck);
export const IconUserCheck = createLucideIcon(UserCheck);
export const IconFileCheck = createLucideIcon(FileCheck);
export const IconDollarSign = createLucideIcon(DollarSign);
export const IconXCircle = createLucideIcon(XCircle);
export const IconAlertCircle = createLucideIcon(AlertCircle);
export const IconLaptop = createLucideIcon(Laptop);
export const IconSmartphone = createLucideIcon(Smartphone);
export const IconTv = createLucideIcon(Tv);
export const IconHardDrive = createLucideIcon(HardDrive);
export const IconPlus = createLucideIcon(Plus);
export const IconEye = createLucideIcon(Eye);
export const IconPrinter = createLucideIcon(Printer);
export const IconCalendar = createLucideIcon(Calendar);
export const IconX = createLucideIcon(X);
export const IconArrowLeft = createLucideIcon(ArrowLeft);
export const IconArrowRight = createLucideIcon(ArrowRight);
export const IconArrowDown = createLucideIcon(ArrowDown);
export const IconMenu = createLucideIcon(Menu);
export const IconHistory = createLucideIcon(History);
export const IconLayers = createLucideIcon(Layers);
export const IconTag = createLucideIcon(Tag);
export const IconQrCode = createLucideIcon(QrCode);
export const IconDownload = createLucideIcon(Download);
export const IconEdit = createLucideIcon(Pencil);
export const IconMoreHorizontal = createLucideIcon(MoreHorizontal);
export const IconMoreVertical = createLucideIcon(MoreVertical);
