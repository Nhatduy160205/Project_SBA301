import React, { useState } from 'react';
import {
  Zap,
  CreditCard,
  Sparkles,
  CheckCircle2,
  Radio,
  ArrowRight,
  ShieldCheck,
  Utensils,
} from 'lucide-react';
import type { TableItem, TableStatus } from '../../types';
import { hostAudioService } from '../../services/hostAudioService';

interface OneTouchStatusRibbonProps {
  table: TableItem;
  onStatusChange: (newStatus: TableStatus, guestName?: string, notes?: string) => Promise<void> | void;
  activeRole?: 'HOST' | 'CASHIER' | 'WAITER';
  isCompact?: boolean;
}

export const OneTouchStatusRibbon: React.FC<OneTouchStatusRibbonProps> = ({
  table,
  onStatusChange,
  activeRole = 'HOST',
  isCompact = false,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastActionMessage, setLastActionMessage] = useState<string | null>(null);

  // Vòng đời 4 bước chuyển trạng thái phục vụ: SEATED -> CALL_BILL -> CLEANING -> AVAILABLE
  const STEPS: {
    status: TableStatus;
    label: string;
    subLabel: string;
    icon: React.ReactNode;
    colorClasses: string;
    activeClasses: string;
    roleTag: string;
    roleColor: string;
  }[] = [
    {
      status: 'SEATED',
      label: 'Đang Dùng Bữa',
      subLabel: 'Khách tại bàn',
      icon: <Utensils className="w-3.5 h-3.5" />,
      colorClasses: 'border-blue-400 text-blue-800 bg-blue-50/70',
      activeClasses: 'border-blue-600 bg-blue-600 text-white shadow-md ring-2 ring-blue-400/50',
      roleTag: 'Phục Vụ',
      roleColor: 'bg-blue-100 text-blue-800',
    },
    {
      status: 'CALL_BILL',
      label: 'Gọi Tính Tiền',
      subLabel: 'In bill & thanh toán',
      icon: <CreditCard className="w-3.5 h-3.5" />,
      colorClasses: 'border-purple-400 text-purple-800 bg-purple-50/70',
      activeClasses: 'border-purple-600 bg-purple-600 text-white shadow-md ring-2 ring-purple-400/60 animate-pulse',
      roleTag: 'Thu Ngân POS',
      roleColor: 'bg-purple-100 text-purple-800',
    },
    {
      status: 'CLEANING',
      label: 'Đang Dọn Bàn',
      subLabel: 'Vệ sinh & setup mới',
      icon: <Sparkles className="w-3.5 h-3.5" />,
      colorClasses: 'border-teal-400 text-teal-800 bg-teal-50/70',
      activeClasses: 'border-teal-600 bg-teal-600 text-white shadow-md ring-2 ring-teal-400/50',
      roleTag: 'Tạp Vụ / Waiter',
      roleColor: 'bg-teal-100 text-teal-800',
    },
    {
      status: 'AVAILABLE',
      label: 'Trống Sẵn Sàng',
      subLabel: 'Đón lượt khách mới',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      colorClasses: 'border-emerald-400 text-emerald-800 bg-emerald-50/70',
      activeClasses: 'border-emerald-600 bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400/50',
      roleTag: 'Lễ Tân Tiếp Đón',
      roleColor: 'bg-emerald-100 text-emerald-800',
    },
  ];

  // Xác định bước tiếp theo theo chu trình UC-17
  const getNextStatusConfig = (current: TableStatus): { nextStatus: TableStatus; buttonLabel: string; buttonColor: string; description: string } => {
    switch (current) {
      case 'CONFIRMED':
        return {
          nextStatus: 'SEATED',
          buttonLabel: `[1 Chạm] Đón Khách Vào Bàn ${table.code}`,
          buttonColor: 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-blue-500/30',
          description: 'Khách đã cọc có mặt tại nhà hàng, nhận bàn và chuyển sang Xanh Dương (SEATED).',
        };
      case 'SEATED':
        return {
          nextStatus: 'CALL_BILL',
          buttonLabel: `[1 Chạm] Khách Gọi Tính Tiền • Báo Thu Ngân`,
          buttonColor: 'bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white shadow-purple-500/30',
          description: 'Báo động tức thì tới quầy Thu ngân POS để in hóa đơn và chuẩn bị máy quẹt thẻ.',
        };
      case 'CALL_BILL':
        return {
          nextStatus: 'CLEANING',
          buttonLabel: `[1 Chạm] Đã Thanh Toán ➔ Chuyển Dọn Bàn`,
          buttonColor: 'bg-gradient-to-r from-teal-600 to-cyan-700 hover:from-teal-700 hover:to-cyan-800 text-white shadow-teal-500/30',
          description: 'Khách rời bàn, thông báo Phục vụ và Tạp vụ vào dọn dĩa, thay khăn bàn, xịt khuẩn.',
        };
      case 'CLEANING':
        return {
          nextStatus: 'AVAILABLE',
          buttonLabel: `[1 Chạm] Đã Dọn Xong ➔ Bàn Trống Sẵn Sàng`,
          buttonColor: 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-emerald-500/30',
          description: 'Bàn đã setup hoàn hảo, thông báo Lễ tân sảnh sẵn sàng đón khách vãng lai hoặc ca tiếp theo.',
        };
      case 'AVAILABLE':
      default:
        return {
          nextStatus: 'SEATED',
          buttonLabel: `[1 Chạm] Xếp Khách Vào Bàn ${table.code} (Seated)`,
          buttonColor: 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-blue-500/30',
          description: 'Đón khách vãng lai (walk-in) vào bàn, chuyển màu sang Xanh Dương (SEATED).',
        };
    }
  };

  const nextConfig = getNextStatusConfig(table.status);

  const handleExecuteTransition = async (targetStatus: TableStatus) => {
    if (isUpdating) return;
    setIsUpdating(true);

    // 1. Âm thanh và haptic phản hồi thời gian thực
    hostAudioService.playOneTouchTransition(targetStatus);

    try {
      await onStatusChange(
        targetStatus,
        table.currentGuestName,
        `Đổi trạng thái 1 chạm bởi ${activeRole} lúc ${new Date().toLocaleTimeString('vi-VN')}`
      );
      setLastActionMessage(`Đã chuyển Bàn ${table.code} sang ${targetStatus} (<300ms)`);
      setTimeout(() => setLastActionMessage(null), 3000);
    } catch (err: any) {
      console.warn('Lỗi khi đổi trạng thái bàn:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className={`rounded-2xl border bg-gradient-to-br from-white via-[#FCFAF7] to-amber-50/30 p-4 shadow-sm border-amber-200/70 space-y-3 ${isCompact ? 'p-3' : 'p-4'}`}>
      {/* Ribbon Header: Tiêu đề & Cam kết độ trễ STOMP */}
      <div className="flex items-center justify-between gap-2 border-b border-amber-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-700">
            <Zap className="w-4 h-4 fill-amber-500 text-amber-600" />
          </div>
          <div>
            <h4 className="font-serif font-bold text-sm text-[#2C221E] flex items-center gap-2">
              <span>Đổi Trạng Thái Bàn 1 Chạm (UC-17)</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-300 font-bold">
                Bàn {table.code}
              </span>
            </h4>
            <p className="text-[11px] text-[#78716C]">
              Đồng bộ tức thì Lễ tân ➔ Thu ngân ➔ Phục vụ qua STOMP WebSocket
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-[10px] font-mono font-bold">
          <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
          <span>&lt;300ms STOMP Live</span>
        </div>
      </div>

      {/* 4-Step Interactive Stepper: SEATED -> CALL_BILL -> CLEANING -> AVAILABLE */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {STEPS.map((step, idx) => {
          const isActive = table.status === step.status;
          return (
            <button
              key={step.status}
              type="button"
              disabled={isUpdating}
              onClick={() => handleExecuteTransition(step.status)}
              className={`relative text-left p-2.5 rounded-xl border transition-all duration-200 cursor-pointer active:scale-95 ${
                isActive
                  ? step.activeClasses
                  : `${step.colorClasses} hover:bg-white hover:shadow-xs`
              }`}
            >
              {/* Step Number & Role Badge */}
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${isActive ? 'bg-white/25 text-white' : 'bg-slate-200/80 text-slate-700'}`}>
                  0{idx + 1}
                </span>
                <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white text-slate-900' : step.roleColor}`}>
                  {step.roleTag}
                </span>
              </div>

              {/* Title & Icon */}
              <div className="flex items-center gap-1.5">
                <span className={isActive ? 'text-white' : 'text-slate-700'}>
                  {step.icon}
                </span>
                <span className={`text-xs font-bold font-sans tracking-tight ${isActive ? 'text-white' : ''}`}>
                  {step.label}
                </span>
              </div>

              <div className={`text-[10px] mt-0.5 truncate ${isActive ? 'text-white/90' : 'text-[#78716C]'}`}>
                {step.subLabel}
              </div>

              {/* Active Indicator Arrow */}
              {isActive && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-inherit rotate-45 border-r border-b border-inherit" />
              )}
            </button>
          );
        })}
      </div>

      {/* Nút Hành Động 1 Chạm Chính (Primary One-Touch Action Button) */}
      <div className="pt-1">
        <button
          type="button"
          disabled={isUpdating}
          onClick={() => handleExecuteTransition(nextConfig.nextStatus)}
          className={`w-full py-3 px-4 rounded-xl font-sans font-bold text-sm tracking-wide shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 ${
            nextConfig.buttonColor
          } ${isUpdating ? 'opacity-60 cursor-wait' : ''}`}
        >
          {isUpdating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Đang đồng bộ STOMP đa kênh...</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 fill-current" />
              <span>{nextConfig.buttonLabel}</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </>
          )}
        </button>

        <p className="text-[11px] text-[#78716C] italic text-center mt-1.5">
          {nextConfig.description}
        </p>
      </div>

      {/* Thông báo cập nhật thành công nếu có */}
      {lastActionMessage && (
        <div className="p-2 rounded-xl bg-emerald-100/90 border border-emerald-400 text-emerald-900 text-xs font-medium flex items-center gap-2 animate-fade-in">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{lastActionMessage}</span>
        </div>
      )}
    </div>
  );
};
