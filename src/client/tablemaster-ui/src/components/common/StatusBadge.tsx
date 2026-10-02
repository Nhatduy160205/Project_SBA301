import React from 'react';
import type { TableStatus } from '../../types';

interface StatusBadgeProps {
  status: TableStatus;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
  pulse?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showDot = true,
  pulse = false,
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'AVAILABLE':
        return {
          label: 'Trống khả dụng',
          classes: 'bg-emerald-50 text-emerald-700 border-emerald-400',
          dotColor: 'bg-emerald-500',
        };
      case 'HOLDING':
        return {
          label: 'Đang giữ chỗ 5p',
          classes: 'bg-amber-50 text-amber-700 border-amber-400',
          dotColor: 'bg-amber-500',
        };
      case 'CONFIRMED':
        return {
          label: 'Đã xác nhận cọc',
          classes: 'bg-rose-50 text-rose-700 border-rose-300',
          dotColor: 'bg-rose-500',
        };
      case 'SEATED':
        return {
          label: 'Đang dùng bữa',
          classes: 'bg-blue-50 text-blue-700 border-blue-400',
          dotColor: 'bg-blue-500',
        };
      case 'CLEANING':
        return {
          label: 'Đang dọn bàn',
          classes: 'bg-slate-100 text-slate-600 border-slate-300',
          dotColor: 'bg-slate-400',
        };
      default:
        return {
          label: status,
          classes: 'bg-gray-100 text-gray-700 border-gray-300',
          dotColor: 'bg-gray-400',
        };
    }
  };

  const config = getStatusConfig();

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2',
  }[size];

  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  }[size];

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border shadow-xs transition-colors duration-200 ${config.classes} ${sizeClasses}`}
    >
      {showDot && (
        <span className="relative flex items-center justify-center">
          {(pulse || status === 'HOLDING') && (
            <span
              className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${config.dotColor}`}
            />
          )}
          <span className={`relative inline-flex rounded-full ${dotSizes} ${config.dotColor}`} />
        </span>
      )}
      <span>{config.label}</span>
    </span>
  );
};
