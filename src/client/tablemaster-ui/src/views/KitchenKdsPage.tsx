import React, { useState, useEffect } from 'react';
import {
  Clock,
  Flame,
  ChefHat,
  ShieldAlert,
  Printer,
  Check,
  Search,
  Sparkles,
  Volume2,
  VolumeX,
  Cake,
  Baby,
  X,
} from 'lucide-react';
import type { TableItem, BookingDetails, TableOrderRecord, OrderItem } from '../types';

interface KitchenKdsPageProps {
  tables: TableItem[];
  bookings?: BookingDetails[];
  tableOrders: Record<string, TableOrderRecord>;
  setTableOrders: React.Dispatch<React.SetStateAction<Record<string, TableOrderRecord>>>;
  onNavigateToHost?: () => void;
  onNavigateToWaiter?: () => void;
}

export const KitchenKdsPage: React.FC<KitchenKdsPageProps> = ({
  tables: _tables,
  bookings = [],
  tableOrders,
  setTableOrders,
  onNavigateToHost,
}) => {
  // Real-time Kitchen Clock
  const [currentTime, setCurrentTime] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'ALLERGY_ALERT' | 'PREORDER' | 'PREPARING'>('ALL');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Ticket Print Modal
  const [printingTicket, setPrintingTicket] = useState<{
    tableCode: string;
    guestName: string;
    guestCount: number;
    seatedAtTime: string;
    occasion?: string;
    dietaryNotes?: string;
    babyChairCount?: number;
    candleSetup?: boolean;
    notes?: string;
    items: Array<{ name: string; quantity: number; notes?: string; status: string }>;
  } | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('vi-VN', { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const playKitchenBeep = () => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      // AudioContext fallback
    }
  };

  // Toggle dish preparation status
  const handleToggleDishStatus = (tableId: string, dishId: string) => {
    setTableOrders((prev) => {
      const current = prev[tableId];
      if (!current) return prev;

      const updatedItems: OrderItem[] = current.items.map((item) => {
        if (item.dishId === dishId) {
          const nextStatus: 'PREPARING' | 'SERVED' = item.status === 'PREPARING' ? 'SERVED' : 'PREPARING';
          return { ...item, status: nextStatus };
        }
        return item;
      });

      return {
        ...prev,
        [tableId]: {
          ...current,
          items: updatedItems,
        },
      };
    });
    playKitchenBeep();
    showToast('Cập nhật trạng thái chế biến món ăn thành công!');
  };

  // Build combined list of active kitchen tickets (From active tableOrders + Confirmed Bookings with pre-orders)
  const tickets = React.useMemo(() => {
    const list: Array<{
      tableId: string;
      tableCode: string;
      guestName: string;
      guestCount: number;
      phone?: string;
      source: 'ONLINE' | 'WALK_IN';
      seatedAtTime: string;
      occasion?: string;
      dietaryNotes?: string;
      babyChairCount?: number;
      candleSetup?: boolean;
      notes?: string;
      items: Array<{ dishId: string; name: string; quantity: number; notes?: string; status: 'PREPARING' | 'SERVED' }>;
    }> = [];

    // 1. From tableOrders (Active dining tables)
    Object.entries(tableOrders).forEach(([tId, order]) => {
      if (order.items && order.items.length > 0) {
        list.push({
          tableId: tId,
          tableCode: order.tableCode,
          guestName: order.guestName,
          guestCount: order.guestCount,
          phone: order.phone,
          source: order.source,
          seatedAtTime: order.seatedAtTime,
          occasion: order.occasion,
          dietaryNotes: order.dietaryNotes,
          babyChairCount: order.babyChairCount,
          candleSetup: order.candleSetup,
          notes: order.notes,
          items: order.items.map((i) => ({
            dishId: i.dishId,
            name: i.name,
            quantity: i.quantity,
            notes: i.notes,
            status: i.status,
          })),
        });
      }
    });

    // 2. From confirmed bookings with pre-orders that aren't yet seated
    bookings.forEach((b) => {
      if (b.status === 'CONFIRMED' && b.preOrders && b.preOrders.length > 0) {
        const alreadyInOrders = list.some((t) => t.tableCode === b.tableCode || t.tableId === b.tableId);
        if (!alreadyInOrders) {
          list.push({
            tableId: b.tableId,
            tableCode: b.tableCode,
            guestName: b.customerName,
            guestCount: b.partySize,
            phone: b.phone,
            source: 'ONLINE',
            seatedAtTime: `Hẹn lúc ${b.timeSlot.split('-')[0].trim()} (Sắp tới)`,
            occasion: b.occasion,
            dietaryNotes: b.dietaryNotes,
            babyChairCount: b.babyChairCount,
            candleSetup: b.candleSetup,
            notes: b.notes,
            items: b.preOrders.map((po) => ({
              dishId: po.dish.id,
              name: po.dish.name,
              quantity: po.quantity,
              notes: po.preparationNotes,
              status: 'PREPARING',
            })),
          });
        }
      }
    });

    return list;
  }, [tableOrders, bookings]);

  // Filtering
  const filteredTickets = tickets.filter((t) => {
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const matchCode = t.tableCode.toLowerCase().includes(q);
      const matchName = t.guestName.toLowerCase().includes(q);
      const matchDish = t.items.some((i) => i.name.toLowerCase().includes(q));
      const matchDiet = (t.dietaryNotes || '').toLowerCase().includes(q);
      if (!matchCode && !matchName && !matchDish && !matchDiet) return false;
    }

    if (filterMode === 'ALLERGY_ALERT') {
      return Boolean(t.dietaryNotes && t.dietaryNotes.trim().length > 0) || (t.babyChairCount || 0) > 0;
    }
    if (filterMode === 'PREORDER') {
      return t.source === 'ONLINE';
    }
    if (filterMode === 'PREPARING') {
      return t.items.some((i) => i.status === 'PREPARING');
    }
    return true;
  });

  const totalAllergyAlertCount = tickets.filter(
    (t) => Boolean(t.dietaryNotes && t.dietaryNotes.trim().length > 0) || (t.babyChairCount || 0) > 0
  ).length;

  return (
    <div className="min-h-screen bg-[#111318] text-[#F3F4F6] flex flex-col font-sans pb-16 selection:bg-rose-900 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 right-6 z-50 px-5 py-3 rounded-2xl bg-rose-600 text-white font-semibold text-xs shadow-2xl flex items-center gap-2 border border-rose-400 animate-in fade-in slide-in-from-top-4 duration-200">
          <Sparkles className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP KDS HEADER BAR */}
      <header className="bg-[#181B22] border-b border-[#2C313E] sticky top-0 z-30 px-4 sm:px-6 py-3.5 shadow-xl">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Brand & KDS Identifier */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-600 to-amber-600 text-white flex items-center justify-center font-bold shadow-md shadow-rose-950/40">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-black text-lg tracking-wider text-white">
                  LE PRIME BISTRO • KDS BẾP
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  <span>LIVE COUNTDOWN</span>
                </span>
              </div>
              <p className="text-[11px] text-[#9CA3AF]">
                Kitchen Display System: Tiếp nhận món đặt trước, cảnh báo dị ứng & không rắc tiêu (UC-08 & UC-25)
              </p>
            </div>
          </div>

          {/* Center Digital Clock & Quick Stats */}
          <div className="flex items-center gap-3">
            <div className="bg-[#1F2430] border border-[#2D3344] px-4 py-2 rounded-2xl flex items-center gap-3 shadow-inner">
              <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
              <div>
                <span className="text-[9px] uppercase tracking-wider text-[#9CA3AF] font-bold block">
                  Giờ Hiện Tại
                </span>
                <span className="font-mono text-base font-black text-amber-400 tracking-wider">
                  {currentTime || '19:00:00'}
                </span>
              </div>
            </div>

            {/* Allergy Alert Pill */}
            {totalAllergyAlertCount > 0 && (
              <div className="bg-gradient-to-r from-rose-950/80 to-rose-900/60 border border-rose-600/70 px-3.5 py-2 rounded-2xl flex items-center gap-2.5 shadow-md shadow-rose-950/40 animate-pulse">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-rose-300 font-bold block">
                    Cảnh Báo Dị Ứng
                  </span>
                  <span className="font-mono text-xs font-bold text-white">
                    {totalAllergyAlertCount} Bàn Cần Lưu Ý
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Action Tools: Sound & Back to Host */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                soundEnabled
                  ? 'bg-[#1F2430] border-[#2D3344] text-amber-400 hover:bg-[#282E3E]'
                  : 'bg-stone-800 text-stone-400 border-stone-700'
              }`}
              title={soundEnabled ? 'Chuông âm báo Bếp đang BẬT' : 'Chuông âm báo Bếp đang TẮT'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden sm:inline">{soundEnabled ? 'Âm Báo: Bật' : 'Âm Báo: Tắt'}</span>
            </button>

            {onNavigateToHost && (
              <button
                type="button"
                onClick={onNavigateToHost}
                className="px-4 py-2 rounded-xl bg-[#232836] hover:bg-[#2C3345] text-white border border-[#373E52] text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <span>Sảnh Lễ Tân</span>
                <span>➔</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter bar */}
        <div className="max-w-[1600px] mx-auto mt-3 pt-3 border-t border-[#232836] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'ALL', label: 'Tất Cả Order Bếp', count: tickets.length },
              { id: 'ALLERGY_ALERT', label: '🚨 Cảnh Báo Dị Ứng / Trẻ Nhỏ', count: totalAllergyAlertCount },
              { id: 'PREORDER', label: '🥩 Món Đặt Trước (Pre-order)', count: tickets.filter((t) => t.source === 'ONLINE').length },
              { id: 'PREPARING', label: '⏳ Bếp Đang Nấu', count: tickets.filter((t) => t.items.some((i) => i.status === 'PREPARING')).length },
            ].map((tab) => {
              const isSelected = filterMode === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterMode(tab.id as any)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-950/30'
                      : 'bg-[#1F2430] text-[#9CA3AF] hover:text-white border border-[#2D3344] hover:border-[#3D455C]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-[#151821] text-[#D1D5DB]'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm số bàn, tên món, dị ứng..."
              className="w-full bg-[#1F2430] border border-[#2D3344] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#6B7280] focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>
      </header>

      {/* MAIN KDS TICKETS BOARD */}
      <main className="max-w-[1600px] mx-auto w-full px-4 sm:px-6 pt-6 flex-1">
        {filteredTickets.length === 0 ? (
          <div className="h-96 flex flex-col items-center justify-center text-center p-8 bg-[#181B22] rounded-3xl border border-[#2C313E] space-y-3">
            <ChefHat className="w-12 h-12 text-[#4B5563]" />
            <h3 className="font-serif text-lg font-bold text-[#E5E7EB]">Hiện Chưa Có Phiếu Order Nào</h3>
            <p className="text-xs text-[#9CA3AF] max-w-md">
              Khi khách hàng đặt bàn trực tuyến có món ăn Signature hoặc nhân viên phục vụ gửi order từ sảnh, phiếu bếp sẽ xuất hiện ngay tại đây kèm cảnh báo dị ứng.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredTickets.map((ticket) => {
              const hasAllergy = Boolean(ticket.dietaryNotes && ticket.dietaryNotes.trim().length > 0);
              const hasBabyChair = (ticket.babyChairCount || 0) > 0;
              const hasCandle = Boolean(ticket.candleSetup);
              const isBirthday = ticket.occasion === 'BIRTHDAY';
              const isAnniversary = ticket.occasion === 'ANNIVERSARY';
              const isBusiness = ticket.occasion === 'BUSINESS';

              const allServed = ticket.items.every((i) => i.status === 'SERVED');

              return (
                <div
                  key={ticket.tableId}
                  className={`rounded-3xl border flex flex-col justify-between transition-all overflow-hidden shadow-xl ${
                    hasAllergy
                      ? 'bg-gradient-to-b from-[#1C171A] to-[#161820] border-rose-500/60 ring-1 ring-rose-500/30'
                      : 'bg-[#181B22] border-[#2C313E] hover:border-[#3D455C]'
                  }`}
                >
                  {/* TICKET TOP HEADER */}
                  <div className="p-5 space-y-3.5">
                    {/* Header Row: Table Code & Time */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-serif font-black text-xl tracking-tight shadow-md">
                            {ticket.tableCode}
                          </span>
                          <span className="text-xs font-bold text-white font-serif">
                            {ticket.guestName}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#9CA3AF] block mt-1">
                          {ticket.guestCount} khách • {ticket.source === 'ONLINE' ? '📱 Đặt Online (Cọc VietQR)' : '🚶 Khách Tại Bàn'}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-[#232836] border border-[#343B4E] text-amber-400 block">
                          {ticket.seatedAtTime}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPrintingTicket(ticket)}
                          className="mt-1.5 text-[10px] text-[#9CA3AF] hover:text-white flex items-center gap-1 ml-auto cursor-pointer"
                        >
                          <Printer className="w-3 h-3" />
                          <span>In Phiếu Bếp</span>
                        </button>
                      </div>
                    </div>

                    {/* UC-08 HIGH PRIORITY ALLERGY & DIETARY ALERT BANNER */}
                    {hasAllergy && (
                      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-950/90 via-rose-900/80 to-rose-950/90 border-2 border-rose-500 text-white space-y-1.5 shadow-lg shadow-rose-950/50">
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 animate-bounce" />
                          <span className="font-bold text-xs uppercase tracking-wider text-rose-200">
                            CẢNH BÁO DỊ ỨNG & CHẾ BIẾN (UC-08)
                          </span>
                        </div>
                        <p className="text-xs font-extrabold text-amber-300 leading-snug">
                          {ticket.dietaryNotes}
                        </p>
                        <p className="text-[10px] text-rose-200">
                          ⚠️ Tuyệt đối dùng chảo nấu riêng, khử khuẩn dụng cụ và kiểm tra kỹ thành phần gia vị trước khi ra món!
                        </p>
                      </div>
                    )}

                    {/* UC-08 SPECIAL OCCASION & FACILITY BADGES ROW */}
                    {(isBirthday || isAnniversary || isBusiness || hasBabyChair || hasCandle) && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {isBirthday && (
                          <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                            <Cake className="w-3 h-3 text-amber-400" />
                            <span>🎂 Tiệc Sinh Nhật (Viết chữ đĩa bánh)</span>
                          </span>
                        )}
                        {isAnniversary && (
                          <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-purple-400" />
                            <span>🥂 Kỷ Niệm Ngày Cưới</span>
                          </span>
                        )}
                        {isBusiness && (
                          <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1">
                            <span>💼 Tiếp Khách Đối Tác</span>
                          </span>
                        )}
                        {hasBabyChair && (
                          <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                            <Baby className="w-3 h-3 text-emerald-400" />
                            <span>👶 {ticket.babyChairCount} Ghế em bé high-chair</span>
                          </span>
                        )}
                        {hasCandle && (
                          <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                            <Flame className="w-3 h-3 text-amber-400" />
                            <span>🕯️ Nến thơm lãng mạn</span>
                          </span>
                        )}
                      </div>
                    )}

                    {/* DISH ITEMS LIST */}
                    <div className="space-y-2 pt-2 border-t border-[#292F3E]">
                      <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-[#9CA3AF] font-bold">
                        <span>Danh Sách Món Cần Nấu:</span>
                        <span>{ticket.items.length} món</span>
                      </div>

                      <div className="space-y-2">
                        {ticket.items.map((item) => {
                          const isReady = item.status === 'SERVED';
                          return (
                            <div
                              key={item.dishId}
                              className={`p-3 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                                isReady
                                  ? 'bg-[#15231C] border-emerald-600/50 text-[#D1FAE5]'
                                  : 'bg-[#1F2430] border-[#2D3344] text-white hover:border-[#3D455C]'
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                                    {item.quantity}
                                  </span>
                                  <span className={`text-xs font-bold leading-snug ${isReady ? 'line-through text-emerald-300/70' : 'text-white'}`}>
                                    {item.name}
                                  </span>
                                </div>
                                {item.notes && (
                                  <p className="text-[11px] text-amber-300 mt-1 pl-7 font-medium">
                                    📝 {item.notes}
                                  </p>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => handleToggleDishStatus(ticket.tableId, item.dishId)}
                                className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                                  isReady
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                                    : 'bg-amber-600 hover:bg-amber-500 text-slate-950 font-black'
                                }`}
                              >
                                {isReady ? (
                                  <>
                                    <Check className="w-3 h-3" />
                                    <span>Đã Lên Món</span>
                                  </>
                                ) : (
                                  <>
                                    <Flame className="w-3 h-3 animate-pulse" />
                                    <span>Đang Nấu</span>
                                  </>
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Additional Customer Notes */}
                    {ticket.notes && (
                      <div className="p-3 rounded-xl bg-[#1F2430] border border-[#2D3344] text-[11px] text-[#D1D5DB]">
                        <span className="text-[#9CA3AF] font-bold block mb-0.5">Ghi chú sảnh:</span>
                        <p>{ticket.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* BOTTOM ACTIONS BAR */}
                  <div className="p-4 bg-[#14161E] border-t border-[#232836] flex items-center justify-between gap-3">
                    <span className="text-[11px] text-[#9CA3AF] font-medium">
                      {allServed ? '✅ Bàn đã ra đủ món' : '⏳ Bếp trưởng đang điều phối'}
                    </span>

                    <button
                      type="button"
                      onClick={() => setPrintingTicket(ticket)}
                      className="px-3.5 py-2 rounded-xl bg-[#232836] hover:bg-[#2C3345] text-white border border-[#373E52] text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      <Printer className="w-3.5 h-3.5 text-amber-400" />
                      <span>In Phiếu Order Bếp</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* MODAL IN PHIẾU BẾP (THERMAL KITCHEN TICKET SIMULATOR) */}
      {printingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white text-stone-900 rounded-3xl p-6 sm:p-7 shadow-2xl border border-stone-300 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-amber-700" />
                <h3 className="font-serif text-base font-bold text-stone-900">
                  Mô Phỏng Phiếu In Nhiệt Bếp (KDS Ticket)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPrintingTicket(null)}
                className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:text-stone-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Simulated Thermal Paper Slip */}
            <div className="p-5 bg-stone-50 rounded-2xl border border-stone-300 font-mono text-xs space-y-3 shadow-inner">
              <div className="text-center space-y-0.5 border-b border-dashed border-stone-400 pb-2.5">
                <p className="font-bold text-sm tracking-wider">LE PRIME BISTRO & LOUNGE</p>
                <p className="text-[10px] text-stone-500">KITCHEN ORDER TICKET (BẾP KDS)</p>
                <p className="text-[10px] text-stone-500">{new Date().toLocaleString('vi-VN')}</p>
              </div>

              <div className="flex justify-between font-bold text-sm border-b border-dashed border-stone-400 pb-2">
                <span>BÀN: {printingTicket.tableCode}</span>
                <span>{printingTicket.guestCount} KHÁCH</span>
              </div>

              <div className="space-y-1 text-[11px]">
                <p>Khách: <strong>{printingTicket.guestName}</strong></p>
                <p>Thời gian: {printingTicket.seatedAtTime}</p>
                {printingTicket.occasion && <p>Dịp tiệc: <strong>{printingTicket.occasion}</strong></p>}
              </div>

              {/* CRITICAL ALLERGY WARNING IN BOLD */}
              {printingTicket.dietaryNotes && (
                <div className="p-2.5 bg-rose-100 border-2 border-rose-600 text-rose-900 rounded-lg font-bold text-xs">
                  <p className="text-[10px] uppercase text-rose-700">*** CẢNH BÁO DỊ ỨNG & LƯU Ý BẾP ***</p>
                  <p className="text-sm mt-0.5">🚨 {printingTicket.dietaryNotes}</p>
                  {printingTicket.babyChairCount && printingTicket.babyChairCount > 0 && (
                    <p className="text-xs text-rose-800 mt-1">👶 Có {printingTicket.babyChairCount} trẻ nhỏ - TUYỆT ĐỐI KHÔNG RẮC TIÊU</p>
                  )}
                </div>
              )}

              {/* Items Table */}
              <div className="border-t border-b border-dashed border-stone-400 py-2 space-y-2">
                <div className="flex justify-between font-bold text-[10px] text-stone-500">
                  <span>MÓN ĂN</span>
                  <span>SL</span>
                </div>
                {printingTicket.items.map((item, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex justify-between font-bold text-xs">
                      <span>{item.name}</span>
                      <span className="font-mono text-sm font-black">x{item.quantity}</span>
                    </div>
                    {item.notes && (
                      <p className="text-[10px] text-amber-800 italic pl-2">
                        &gt;&gt; {item.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {printingTicket.notes && (
                <div className="text-[10px] text-stone-600">
                  <span className="font-bold">Ghi chú:</span> {printingTicket.notes}
                </div>
              )}

              <div className="text-center pt-2 text-[10px] text-stone-400">
                --- KẾT THÚC PHIẾU BẾP ---
              </div>
            </div>

            {/* Print action button */}
            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setPrintingTicket(null)}
                className="flex-1 py-2.5 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                  showToast('Đã gửi lệnh in phiếu bếp ra máy in nhiệt!');
                  setPrintingTicket(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Xác Nhận In Phiếu</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
