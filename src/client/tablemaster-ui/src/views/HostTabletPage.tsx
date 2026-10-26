import React, { useState } from 'react';
import {
  Search,
  Clock,
  QrCode,
  X,
  Users,
  CheckCircle2,
  Plus,
  Minus,
  Receipt,
  CreditCard,
  Banknote,
  Utensils,
  FileText,
  UserCheck,
  Check,
  RefreshCw,
  Smartphone,
  Sparkles,
  ArrowRightLeft,
  Merge,
  ArrowRight,
  Info,
  Baby,
  Cake,
  Flame,
  ShieldAlert,
  Edit3,
  ChefHat,
} from 'lucide-react';
import type { TableItem, TableStatus, BookingDetails, TableOrderRecord } from '../types';
import { SIGNATURE_DISHES } from '../data/mockData';
import { bookingApi } from '../services/bookingApi';

interface HostTabletPageProps {
  tables: TableItem[];
  bookings?: BookingDetails[];
  tableOrders: Record<string, TableOrderRecord>;
  setTableOrders: React.Dispatch<React.SetStateAction<Record<string, TableOrderRecord>>>;
  onUpdateTableStatus: (tableId: string, status: TableStatus, guestName?: string) => void;
  onTransferTable?: (sourceTableId: string, targetTableId: string) => void;
  onMergeTables?: (sourceTableId: string, targetTableId: string) => void;
  onNavigateToWaiter?: () => void;
  onNavigateToKds?: () => void;
}

export const HostTabletPage: React.FC<HostTabletPageProps> = ({
  tables,
  bookings = [],
  tableOrders,
  setTableOrders,
  onUpdateTableStatus,
  onTransferTable,
  onMergeTables,
  onNavigateToWaiter,
  onNavigateToKds,
}) => {
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AVAILABLE' | 'SEATED' | 'CONFIRMED' | 'CLEANING'>('ALL');
  const selectedShift = '🌙 Ca Tối (17:00 - 23:00)';

  // Active Table for POS / Detail Drawer
  const [selectedTableForPOS, setSelectedTableForPOS] = useState<TableItem | null>(null);

  // Walk-in Quick Open Modal
  const [walkInTargetTable, setWalkInTargetTable] = useState<TableItem | null>(null);
  const [walkInName, setWalkInName] = useState('Khách Vãng Lai');
  const [walkInGuests, setWalkInGuests] = useState(2);
  const [walkInNotes, setWalkInNotes] = useState('');

  // Table Transfer Modal
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferTargetId, setTransferTargetId] = useState<string>('');

  // Table Merge Modal
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [mergeTargetId, setMergeTargetId] = useState<string>('');

  // Feedback Toast
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Scanner modal
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);

  // Quick Menu Category for Add Dishes inside POS
  const [menuTab, setMenuTab] = useState<string>('ALL');
  const [menuSearchQuery, setMenuSearchQuery] = useState('');

  // Custom Dish Input by Cashier / Host
  const [isAddingCustomDish, setIsAddingCustomDish] = useState(false);
  const [customDishName, setCustomDishName] = useState('');
  const [customDishPrice, setCustomDishPrice] = useState<string>('50000');
  const [customDishNotes, setCustomDishNotes] = useState('');

  // UC-08: Special Requests & Dietary Notes Edit Modal State
  const [isEditSpecialModalOpen, setIsEditSpecialModalOpen] = useState(false);
  const [editingTableId, setEditingTableId] = useState<string>('');
  const [editOccasion, setEditOccasion] = useState<string>('');
  const [editBabyChairCount, setEditBabyChairCount] = useState<number>(0);
  const [editCandleSetup, setEditCandleSetup] = useState<boolean>(false);
  const [editDietaryNotes, setEditDietaryNotes] = useState<string>('');
  const [editStaffNotes, setEditStaffNotes] = useState<string>('');

  // Payment Confirmation State
  const [isPaymentSuccessOpen, setIsPaymentSuccessOpen] = useState(false);
  const [paidTableSummary, setPaidTableSummary] = useState<{
    code: string;
    total: number;
    guestName: string;
    depositDeducted: number;
    finalPaid: number;
    paymentMethod: string;
  } | null>(null);

  // Calculate table metrics
  const totalTables = tables.length;
  const availableTables = tables.filter((t) => t.status === 'AVAILABLE').length;
  const seatedTables = tables.filter((t) => t.status === 'SEATED').length;
  const reservedTables = tables.filter((t) => t.status === 'CONFIRMED' || t.status === 'HOLDING').length;

  // Calculate total shift revenue
  const totalShiftRevenue = Object.values(tableOrders).reduce((sum, order) => {
    const orderItemsTotal = order.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    return sum + orderItemsTotal;
  }, 0);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => {
      setFeedbackToast(null);
    }, 4000);
  };

  // Handlers
  const handleOpenWalkInModal = (table: TableItem) => {
    setWalkInTargetTable(table);
    setWalkInName('Khách Vãng Lai');
    setWalkInGuests(table.capacity > 4 ? 4 : table.capacity);
    setWalkInNotes('');
  };

  const handleConfirmWalkInOpen = () => {
    if (!walkInTargetTable) return;
    const nowStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    onUpdateTableStatus(walkInTargetTable.id, 'SEATED', walkInName);

    setTableOrders((prev) => ({
      ...prev,
      [walkInTargetTable.id]: {
        tableCode: walkInTargetTable.code,
        guestName: walkInName,
        source: 'WALK_IN',
        guestCount: walkInGuests,
        seatedAtTime: `${nowStr} (Vừa vào)`,
        notes: walkInNotes,
        depositAmount: 0,
        items: [],
      },
    }));

    showToast(`Đã mở bàn ${walkInTargetTable.code} thành công (${walkInGuests} khách).`);
    setWalkInTargetTable(null);
  };

  const handleCheckInOnlineBooking = (table: TableItem) => {
    const nowStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    onUpdateTableStatus(table.id, 'SEATED', table.currentGuestName || 'Khách Đặt Online');

    const matchedBooking = bookings.find((b: BookingDetails) => b.tableId === table.id || b.tableCode.includes(table.code));

    setTableOrders((prev) => {
      const existing = prev[table.id];
      if (existing) {
        return {
          ...prev,
          [table.id]: {
            ...existing,
            seatedAtTime: `${nowStr} (Vừa nhận bàn)`,
            occasion: existing.occasion || matchedBooking?.occasion,
            dietaryNotes: existing.dietaryNotes || matchedBooking?.dietaryNotes,
            babyChairCount: existing.babyChairCount ?? matchedBooking?.babyChairCount ?? 0,
            candleSetup: existing.candleSetup ?? matchedBooking?.candleSetup ?? false,
          },
        };
      }

      // Convert preorder items to order items if present
      const preOrderItems = matchedBooking?.preOrders?.map((po: any) => ({
        dishId: po.dish.id,
        name: po.dish.name,
        price: po.dish.price,
        quantity: po.quantity,
        status: 'PREPARING' as const,
        category: po.dish.category,
        notes: po.preparationNotes,
      })) || [];

      return {
        ...prev,
        [table.id]: {
          tableCode: table.code,
          guestName: table.currentGuestName || matchedBooking?.customerName || 'Khách Đặt Online',
          phone: table.guestPhone || matchedBooking?.phone || '090***',
          source: 'ONLINE',
          guestCount: matchedBooking?.partySize || table.capacity,
          seatedAtTime: `${nowStr} (Vừa nhận bàn)`,
          notes: matchedBooking?.notes || 'Đặt bàn qua cổng Online Le Prime Bistro',
          occasion: matchedBooking?.occasion,
          dietaryNotes: matchedBooking?.dietaryNotes,
          babyChairCount: matchedBooking?.babyChairCount || 0,
          candleSetup: matchedBooking?.candleSetup || false,
          depositAmount: matchedBooking?.depositAmount || table.depositPrice || 200000,
          items: preOrderItems,
        },
      };
    });

    showToast(`Check-in thành công: Bàn ${table.code} (${table.currentGuestName || 'Khách Online'}).`);
  };

  // UC-08: Open Special Requests & Dietary Edit Modal
  const handleOpenEditSpecialModal = (tableId: string) => {
    const order = tableOrders[tableId];
    const table = tables.find((t) => t.id === tableId);
    const booking = bookings.find((b: BookingDetails) => b.tableId === tableId || (table && b.tableCode.includes(table.code)));

    setEditingTableId(tableId);
    setEditOccasion(order?.occasion || booking?.occasion || 'BIRTHDAY');
    setEditBabyChairCount(order?.babyChairCount ?? booking?.babyChairCount ?? 0);
    setEditCandleSetup(order?.candleSetup ?? booking?.candleSetup ?? false);
    setEditDietaryNotes(order?.dietaryNotes || booking?.dietaryNotes || '');
    setEditStaffNotes(order?.notes || booking?.notes || '');
    setIsEditSpecialModalOpen(true);
  };

  // UC-08: Save Special Requests & Sync to KDS Bếp
  const handleSaveSpecialRequests = async () => {
    if (!editingTableId) return;

    setTableOrders((prev) => {
      const current = prev[editingTableId];
      if (!current) return prev;
      return {
        ...prev,
        [editingTableId]: {
          ...current,
          occasion: editOccasion,
          babyChairCount: editBabyChairCount,
          candleSetup: editCandleSetup,
          dietaryNotes: editDietaryNotes,
          notes: editStaffNotes,
        },
      };
    });

    const table = tables.find((t) => t.id === editingTableId);
    const booking = bookings.find((b: BookingDetails) => b.tableId === editingTableId || (table && b.tableCode.includes(table.code)));

    if (booking && booking.tableId) {
      try {
        await bookingApi.updateSpecialRequests(booking.tableId, {
          occasion: editOccasion,
          dietaryNotes: editDietaryNotes,
          babyChairCount: editBabyChairCount,
          candleSetup: editCandleSetup,
          specialNotes: editStaffNotes,
        });
      } catch (e) {
        console.warn('Backend sync in local state:', e);
      }
    }

    setIsEditSpecialModalOpen(false);
    showToast(`✅ Đã đồng bộ Nhu cầu đặc biệt & Dị ứng sang KDS Bếp cho bàn ${table?.code || ''}!`);
  };

  const handleAddDishToTable = (tableId: string, dish: typeof SIGNATURE_DISHES[0]) => {
    setTableOrders((prev) => {
      const current = prev[tableId] || {
        tableCode: tables.find((t) => t.id === tableId)?.code || 'Bàn',
        guestName: 'Khách Tại Bàn',
        source: 'WALK_IN',
        guestCount: 2,
        seatedAtTime: 'Vừa gọi món',
        depositAmount: 0,
        items: [],
      };

      const existingItemIndex = current.items.findIndex((i) => i.dishId === dish.id);
      let updatedItems = [...current.items];

      if (existingItemIndex >= 0) {
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + 1,
        };
      } else {
        updatedItems.push({
          dishId: dish.id,
          name: dish.name,
          price: dish.price,
          quantity: 1,
          status: 'PREPARING',
          category: dish.category,
        });
      }

      return {
        ...prev,
        [tableId]: {
          ...current,
          items: updatedItems,
        },
      };
    });
  };

  const handleAddCustomDish = (tableId: string) => {
    if (!customDishName.trim()) {
      alert('Vui lòng nhập tên món ăn / đồ uống');
      return;
    }
    const price = parseInt(customDishPrice.replace(/\D/g, ''), 10) || 0;

    setTableOrders((prev) => {
      const current = prev[tableId] || {
        tableCode: tables.find((t) => t.id === tableId)?.code || 'Bàn',
        guestName: 'Khách Tại Bàn',
        source: 'WALK_IN',
        guestCount: 2,
        seatedAtTime: 'Vừa gọi món',
        depositAmount: 0,
        items: [],
      };

      const customDishId = `custom-${Date.now()}`;
      const updatedItems = [
        ...current.items,
        {
          dishId: customDishId,
          name: customDishName.trim(),
          price,
          quantity: 1,
          status: 'PREPARING' as const,
          category: 'Món Nhập Riêng',
          notes: customDishNotes.trim(),
        },
      ];

      return {
        ...prev,
        [tableId]: {
          ...current,
          items: updatedItems,
        },
      };
    });

    setCustomDishName('');
    setCustomDishPrice('50000');
    setCustomDishNotes('');
    setIsAddingCustomDish(false);
    showToast(`Đã thêm món riêng vào bàn.`);
  };

  const handleUpdateDishQty = (tableId: string, dishId: string, delta: number) => {
    setTableOrders((prev) => {
      const current = prev[tableId];
      if (!current) return prev;

      const updatedItems = current.items
        .map((item) => {
          if (item.dishId === dishId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((i): i is import('../types').OrderItem => i !== null);

      return {
        ...prev,
        [tableId]: {
          ...current,
          items: updatedItems,
        },
      };
    });
  };

  const handleToggleDishStatus = (tableId: string, dishId: string) => {
    setTableOrders((prev) => {
      const current = prev[tableId];
      if (!current) return prev;

      const updatedItems = current.items.map((item) => {
        if (item.dishId === dishId) {
          return {
            ...item,
            status: item.status === 'PREPARING' ? ('SERVED' as const) : ('PREPARING' as const),
          };
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
  };

  // Transfer table handler
  const handleConfirmTransfer = () => {
    if (!selectedTableForPOS || !transferTargetId) return;
    const targetTable = tables.find((t) => t.id === transferTargetId);
    if (!targetTable) return;

    if (onTransferTable) {
      onTransferTable(selectedTableForPOS.id, transferTargetId);
    }

    showToast(`Đã chuyển toàn bộ hóa đơn từ ${selectedTableForPOS.code} sang ${targetTable.code}.`);
    setSelectedTableForPOS(targetTable);
    setIsTransferModalOpen(false);
    setTransferTargetId('');
  };

  // Merge tables handler
  const handleConfirmMerge = () => {
    if (!selectedTableForPOS || !mergeTargetId) return;
    const targetTable = tables.find((t) => t.id === mergeTargetId);
    if (!targetTable) return;

    if (onMergeTables) {
      onMergeTables(selectedTableForPOS.id, mergeTargetId);
    }

    showToast(`Đã ghép bàn ${selectedTableForPOS.code} vào bàn ${targetTable.code} thành công.`);
    setSelectedTableForPOS(targetTable);
    setIsMergeModalOpen(false);
    setMergeTargetId('');
  };

  const handleCompletePayment = (table: TableItem, paymentMethod: string) => {
    const order = tableOrders[table.id];
    const itemsTotal = order ? order.items.reduce((sum, i) => sum + i.price * i.quantity, 0) : 0;
    const serviceCharge = Math.round(itemsTotal * 0.05);
    const subtotal = itemsTotal + serviceCharge;
    const deposit = order ? order.depositAmount : 0;
    const finalPaid = Math.max(0, subtotal - deposit);

    setPaidTableSummary({
      code: table.code,
      total: subtotal,
      guestName: order?.guestName || 'Khách Tại Bàn',
      depositDeducted: deposit,
      finalPaid,
      paymentMethod,
    });

    onUpdateTableStatus(table.id, 'AVAILABLE', undefined);

    setTableOrders((prev) => {
      const copy = { ...prev };
      delete copy[table.id];
      return copy;
    });

    setSelectedTableForPOS(null);
    setIsPaymentSuccessOpen(true);
  };

  const handleSimulateScan = () => {
    setScanResult('Đang nhận diện mã vé đặt bàn...');
    setTimeout(() => {
      setScanResult('Check-in thành công: Bàn T-03 • Ông Đặng Hoàng Nam (4 khách • Đã cọc 300k)');
      const target = tables.find((t) => t.code === 'T-03');
      if (target) {
        handleCheckInOnlineBooking(target);
      }
      setTimeout(() => {
        setIsScannerOpen(false);
        setScanResult(null);
      }, 1500);
    }, 900);
  };

  // Filter tables
  const filteredTables = tables.filter((t) => {
    const matchesSearch =
      t.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.currentGuestName && t.currentGuestName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.guestPhone && t.guestPhone.includes(searchQuery));

    if (!matchesSearch) return false;

    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'AVAILABLE') return t.status === 'AVAILABLE';
    if (statusFilter === 'SEATED') return t.status === 'SEATED';
    if (statusFilter === 'CONFIRMED') return t.status === 'CONFIRMED' || t.status === 'HOLDING';
    if (statusFilter === 'CLEANING') return t.status === 'CLEANING';
    return true;
  });

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans relative">
      {/* Real-time Global Feedback Toast */}
      {feedbackToast && (
        <div className="fixed top-24 right-6 z-50 bg-[#2C221E] text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-[#C4A480] flex items-center gap-3 text-xs animate-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">{feedbackToast}</span>
          <button type="button" onClick={() => setFeedbackToast(null)} className="text-white/60 hover:text-white ml-2">
            ✕
          </button>
        </div>
      )}

      {/* 1. TOP HEADER & METRICS BAR (FRONT DESK HOST DASHBOARD) */}
      <div className="bg-white border border-[#E8DFD1] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-[#E8DFD1]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-bold text-[#8C6A43] uppercase tracking-[0.2em] font-mono">
                Front-Desk Host & Cashier POS • Màn Hình Quầy Lễ Tân
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#2C221E] font-bold tracking-tight mt-1">
              Quản Lý Bàn & Thu Ngân Trực Sảnh
            </h1>
            <p className="text-xs text-[#78716C] mt-1">
              Tiếp nhận bàn đặt online, mở bàn cho khách vãng lai, hỗ trợ chuyển bàn / ghép bàn và thanh toán hóa đơn.
            </p>
          </div>

          {/* Shift info & Fast Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-[#FAF7F2] px-4 py-2 rounded-2xl border border-[#E8DFD1] text-xs font-semibold text-[#44403C]">
              <Clock className="w-4 h-4 text-[#8C6A43]" />
              <span>{selectedShift}</span>
            </div>

            {onNavigateToWaiter && (
              <button
                type="button"
                onClick={onNavigateToWaiter}
                className="px-4 py-2 rounded-2xl bg-[#FAF4EB] hover:bg-[#F3ECE0] text-[#8C6A43] border border-[#C4A480] text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
              >
                <Smartphone className="w-4 h-4 text-[#8C6A43]" />
                <span>Mở App Phục Vụ (Order Tại Bàn)</span>
              </button>
            )}

            {onNavigateToKds && (
              <button
                type="button"
                onClick={onNavigateToKds}
                className="px-4 py-2 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-300 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
              >
                <ChefHat className="w-4 h-4 text-amber-700" />
                <span>Màn Hình Bếp (KDS)</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="px-4 py-2 rounded-2xl bg-[#8C6A43] text-white hover:bg-[#735534] text-xs font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>Quét Mã Vé Check-in</span>
            </button>
          </div>
        </div>

        {/* Real-time Status Metric Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8DFD1] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#78716C]">Bàn Trống (Sẵn Sàng)</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            </div>
            <p className="font-serif text-2xl sm:text-3xl font-bold text-[#2C221E]">
              {availableTables} <span className="text-xs font-normal text-[#78716C]">/ {totalTables} bàn</span>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF4EB] border border-[#C4A480]/60 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#8C6A43]">Đang Có Khách Ngồi</span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            </div>
            <p className="font-serif text-2xl sm:text-3xl font-bold text-[#8C6A43]">
              {seatedTables} <span className="text-xs font-normal text-[#78716C]">bàn</span>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-800">Đặt Online Chờ Đến</span>
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            </div>
            <p className="font-serif text-2xl sm:text-3xl font-bold text-blue-900">
              {reservedTables} <span className="text-xs font-normal text-blue-600">bàn</span>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-800">Doanh Thu Tạm Tính</span>
              <Receipt className="w-4 h-4 text-emerald-700" />
            </div>
            <p className="font-mono text-xl sm:text-2xl font-bold text-emerald-900 truncate">
              {new Intl.NumberFormat('vi-VN').format(totalShiftRevenue)} đ
            </p>
          </div>
        </div>

        {/* Filter Chips & Search Box */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          {/* Status filter tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'ALL', label: 'Tất Cả Bàn', count: tables.length },
              { id: 'AVAILABLE', label: '🟢 Bàn Trống', count: availableTables },
              { id: 'SEATED', label: '🟠 Đang Dùng Bữa', count: seatedTables },
              { id: 'CONFIRMED', label: '🔵 Đặt Online', count: reservedTables },
            ].map((tab) => {
              const isSelected = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id as any)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#8C6A43] text-white shadow-xs'
                      : 'bg-[#FAF7F2] text-[#6B5E54] hover:bg-white border border-[#E8DFD1]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-white text-[#8C6A43] border border-[#E8DFD1]'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#78716C] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm số bàn (T-01, VIP-01) hoặc tên khách..."
              className="w-full bg-[#FAF7F2] border border-[#E8DFD1] rounded-2xl pl-9 pr-4 py-2.5 text-xs text-[#2C221E] font-medium focus:outline-none focus:border-[#C4A480]"
            />
          </div>
        </div>
      </div>

      {/* 2. MAIN TABLE BOXES GRID (BOX VIEW) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-bold text-[#2C221E] flex items-center gap-2">
            <span>Danh Sách Ô Bàn Tại Sảnh</span>
            <span className="text-xs font-normal text-[#78716C]">
              (Bấm vào từng ô bàn để mở bàn, chuyển bàn, ghép bàn, order hoặc tính tiền)
            </span>
          </h2>
          <span className="text-xs text-[#8C6A43] font-semibold">
            Hiển thị {filteredTables.length} bàn
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredTables.map((table) => {
            const isAvailable = table.status === 'AVAILABLE';
            const isSeated = table.status === 'SEATED';
            const isConfirmed = table.status === 'CONFIRMED' || table.status === 'HOLDING';
            const isCleaning = table.status === 'CLEANING';

            const currentOrder = tableOrders[table.id];
            const itemsCount = currentOrder?.items.reduce((sum, i) => sum + i.quantity, 0) || 0;
            const itemsTotal = currentOrder?.items.reduce((sum, i) => sum + i.price * i.quantity, 0) || 0;

            return (
              <div
                key={table.id}
                className={`rounded-3xl border p-5 flex flex-col justify-between transition-all relative overflow-hidden ${
                  isAvailable
                    ? 'bg-white border-[#E8DFD1] hover:border-emerald-500 hover:shadow-md'
                    : isSeated
                    ? 'bg-gradient-to-b from-[#FFFDF9] to-[#FAF4EB] border-[#C4A480] shadow-sm ring-1 ring-[#C4A480]/40'
                    : isConfirmed
                    ? 'bg-gradient-to-b from-[#F0F7FF] to-[#E5F0FD] border-blue-300 shadow-sm'
                    : 'bg-stone-100 border-stone-300 opacity-80'
                }`}
              >
                {/* Top Row: Table Code, Capacity & Status Badge */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-serif text-2xl font-bold text-[#2C221E] tracking-tight">
                          {table.code}
                        </span>
                        <span className="text-[11px] font-bold text-[#78716C] bg-[#FAF7F2] px-2 py-0.5 rounded-lg border border-[#E8DFD1] flex items-center gap-1">
                          <Users className="w-3 h-3 text-[#C4A480]" />
                          <span>{table.capacity} ghế</span>
                        </span>
                      </div>
                      <span className="text-[10px] text-[#8C6A43] font-medium block mt-0.5">
                        {table.zone === 'WINDOW_VIEW'
                          ? '🌟 View phố Nguyễn Huệ'
                          : table.zone === 'VIP'
                          ? '👑 Phòng VIP Salon'
                          : table.zone === 'OUTDOOR'
                          ? '🌿 Sky Terrace'
                          : '🍽️ Sảnh Tiêu Chuẩn'}
                      </span>
                    </div>

                    {/* Badge */}
                    {isAvailable && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        🟢 Bàn Trống
                      </span>
                    )}
                    {isSeated && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        🟠 Đang Có Khách
                      </span>
                    )}
                    {isConfirmed && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        🔵 Đặt Online
                      </span>
                    )}
                    {isCleaning && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-stone-200 text-stone-700">
                        ⚪ Cần Dọn Bàn
                      </span>
                    )}
                  </div>

                  {/* Body Info based on Table State */}
                  {isAvailable && (
                    <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#E8DFD1] text-[11px] text-[#78716C] space-y-1">
                      <p className="font-semibold text-[#2C221E] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Sẵn sàng đón khách mới</span>
                      </p>
                      <p className="text-[10px] text-[#8C6A43]">
                        Khi nhân viên phục vụ báo khách chọn bàn này ➔ Bấm nút dưới để mở bàn.
                      </p>
                    </div>
                  )}

                  {isConfirmed && (
                    <div className="p-3 bg-white/90 rounded-2xl border border-blue-200 text-xs space-y-1.5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#1E3A8A] truncate">
                          {table.currentGuestName || 'Khách Đặt Online'}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                          {table.bookingTime || '19:00'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#475569]">
                        SĐT: {table.guestPhone || '090***'}
                      </p>

                      {/* UC-08 Badges for Online Booking */}
                      {(() => {
                        const matchingBk = bookings.find(
                          (b: BookingDetails) =>
                            b.tableId === table.id ||
                            b.tableCode.includes(table.code) ||
                            (table.currentGuestName && b.customerName === table.currentGuestName)
                        );
                        if (!matchingBk) return null;
                        const hasSpecial =
                          matchingBk.occasion ||
                          matchingBk.babyChairCount ||
                          matchingBk.candleSetup ||
                          matchingBk.dietaryNotes;
                        if (!hasSpecial) return null;

                        return (
                          <div className="space-y-1 pt-1 border-t border-blue-100">
                            <div className="flex flex-wrap items-center gap-1">
                              {matchingBk.occasion && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                                  <Cake className="w-2.5 h-2.5 text-amber-600" />
                                  {matchingBk.occasion}
                                </span>
                              )}
                              {matchingBk.babyChairCount && matchingBk.babyChairCount > 0 ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold">
                                  <Baby className="w-2.5 h-2.5 text-blue-600" />
                                  {matchingBk.babyChairCount} Ghế bé
                                </span>
                              ) : null}
                              {matchingBk.candleSetup && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-bold">
                                  <Flame className="w-2.5 h-2.5 text-rose-600" />
                                  Nến
                                </span>
                              )}
                            </div>
                            {matchingBk.dietaryNotes && (
                              <div className="flex items-start gap-1 p-1 bg-rose-50 border border-rose-200 rounded text-rose-800 text-[10px] font-semibold leading-tight">
                                <ShieldAlert className="w-3 h-3 text-rose-600 shrink-0 mt-0.5" />
                                <span className="line-clamp-2">{matchingBk.dietaryNotes}</span>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      <div className="flex items-center justify-between text-[10px] text-[#1E3A8A] font-semibold pt-1 border-t border-blue-100">
                        <span>Tiền cọc đã trả:</span>
                        <span className="font-mono">{new Intl.NumberFormat('vi-VN').format(table.depositPrice)} đ</span>
                      </div>
                    </div>
                  )}

                  {isSeated && (
                    <div className="p-3 bg-white/90 rounded-2xl border border-[#E8DFD1] text-xs space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#2C221E] truncate">
                          {currentOrder?.guestName || table.currentGuestName || 'Khách Tại Bàn'}
                        </span>
                        <span className="text-[10px] text-[#8C6A43] font-semibold bg-[#FAF4EB] px-2 py-0.5 rounded border border-[#E8DFD1]">
                          {currentOrder?.source === 'ONLINE' ? '✨ Online' : '🚶 Vãng lai'}
                        </span>
                      </div>

                      {/* UC-08 Badges for Seated Order */}
                      {(() => {
                        const hasSpecial =
                          currentOrder?.occasion ||
                          currentOrder?.babyChairCount ||
                          currentOrder?.candleSetup ||
                          currentOrder?.dietaryNotes;
                        if (!hasSpecial) return null;

                        return (
                          <div className="space-y-1 pt-1 border-t border-[#E8DFD1]">
                            <div className="flex flex-wrap items-center gap-1">
                              {currentOrder?.occasion && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                                  <Cake className="w-2.5 h-2.5 text-amber-600" />
                                  {currentOrder.occasion}
                                </span>
                              )}
                              {currentOrder?.babyChairCount && currentOrder.babyChairCount > 0 ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold">
                                  <Baby className="w-2.5 h-2.5 text-blue-600" />
                                  {currentOrder.babyChairCount} Ghế bé
                                </span>
                              ) : null}
                              {currentOrder?.candleSetup && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-bold">
                                  <Flame className="w-2.5 h-2.5 text-rose-600" />
                                  Nến
                                </span>
                              )}
                            </div>
                            {currentOrder?.dietaryNotes && (
                              <div className="flex items-start gap-1 p-1 bg-rose-50 border border-rose-200 rounded text-rose-800 text-[10px] font-semibold leading-tight">
                                <ShieldAlert className="w-3 h-3 text-rose-600 shrink-0 mt-0.5" />
                                <span className="line-clamp-2">{currentOrder.dietaryNotes}</span>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-[#78716C] pt-1 border-t border-[#E8DFD1]">
                        <div>
                          <span>Thời gian:</span>
                          <p className="font-semibold text-[#2C221E]">{currentOrder?.seatedAtTime || 'Đang ngồi'}</p>
                        </div>
                        <div>
                          <span>Đã gọi:</span>
                          <p className="font-semibold text-[#8C6A43]">{itemsCount} món</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-[#E8DFD1]">
                        <span className="font-semibold text-[#78716C]">Tạm tính:</span>
                        <span className="font-mono font-bold text-[#8C6A43]">
                          {new Intl.NumberFormat('vi-VN').format(itemsTotal)} đ
                        </span>
                      </div>
                    </div>
                  )}

                  {isCleaning && (
                    <div className="p-3 bg-white rounded-2xl border border-stone-300 text-xs text-stone-600">
                      <span>Bàn vừa thanh toán xong, đang được nhân viên dọn dẹp và khử khuẩn.</span>
                    </div>
                  )}
                </div>

                {/* Bottom Action Button */}
                <div className="pt-4 mt-3 border-t border-[#E8DFD1]">
                  {isAvailable && (
                    <button
                      type="button"
                      onClick={() => handleOpenWalkInModal(table)}
                      className="w-full py-2.5 rounded-xl bg-[#FAF7F2] hover:bg-[#8C6A43] text-[#8C6A43] hover:text-white border border-[#E8DFD1] hover:border-[#8C6A43] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Mở Bàn (Phục vụ báo khách ngồi)</span>
                    </button>
                  )}

                  {isConfirmed && (
                    <button
                      type="button"
                      onClick={() => handleCheckInOnlineBooking(table)}
                      className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Khách Tới ➔ Nhận Bàn (Check-in)</span>
                    </button>
                  )}

                  {isSeated && (
                    <div className="space-y-1.5">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedTableForPOS(table)}
                          className="py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#F3ECE0] text-[#2C221E] border border-[#E8DFD1] text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <FileText className="w-3 h-3 text-[#8C6A43]" />
                          <span>Order / Thêm Món</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedTableForPOS(table)}
                          className="py-2 rounded-xl bg-[#8C6A43] hover:bg-[#735534] text-white text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                        >
                          <Receipt className="w-3 h-3" />
                          <span>Tính Tiền</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenEditSpecialModal(table.id)}
                        className="w-full py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        title="Xem & Cập nhật Nhu cầu đặc biệt & Cảnh báo dị ứng cho bếp"
                      >
                        <Sparkles className="w-3 h-3 text-amber-700" />
                        <span>Nhu Cầu Đặc Biệt & Dị Ứng (KDS)</span>
                      </button>
                    </div>
                  )}

                  {isCleaning && (
                    <button
                      type="button"
                      onClick={() => onUpdateTableStatus(table.id, 'AVAILABLE')}
                      className="w-full py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Đã Dọn Xong ➔ Trở Về Bàn Trống</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. MODAL: PHỤC VỤ BÁO MỞ BÀN (WALK-IN GUEST OPEN MODAL) */}
      {walkInTargetTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1412]/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 border border-[#E8DFD1] shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8DFD1]">
              <div className="flex items-center gap-2.5">
                <div className="px-3.5 h-10 rounded-xl bg-[#8C6A43] min-w-[50px] text-white flex items-center justify-center font-serif font-bold text-sm whitespace-nowrap shadow-xs shrink-0">
                  {walkInTargetTable.code}
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#2C221E]">
                    Mở Bàn Cho Khách ({walkInTargetTable.code})
                  </h3>
                  <p className="text-[11px] text-[#78716C]">
                    Nhân viên phục vụ bên trong báo khách vừa chọn ngồi bàn này
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWalkInTargetTable(null)}
                className="w-8 h-8 rounded-full bg-[#FAF7F2] border border-[#E8DFD1] flex items-center justify-center text-[#78716C] hover:text-[#2C221E] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Party size selection */}
              <div className="space-y-2">
                <label className="font-bold text-[#2C221E] uppercase tracking-wider text-[11px]">
                  Số lượng khách ngồi bàn:
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 6, 8, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setWalkInGuests(num)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        walkInGuests === num
                          ? 'bg-[#8C6A43] text-white border-[#8C6A43] shadow-xs'
                          : 'bg-[#FAF7F2] text-[#2C221E] border-[#E8DFD1] hover:bg-white'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Guest name */}
              <div className="space-y-1.5">
                <label className="font-bold text-[#2C221E] uppercase tracking-wider text-[11px]">
                  Tên khách hoặc Đại diện nhóm (Tùy chọn):
                </label>
                <input
                  type="text"
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  placeholder="Ví dụ: Anh Tuấn, Khách vãng lai..."
                  className="w-full bg-[#FAF7F2] border border-[#E8DFD1] rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[#2C221E] focus:outline-none focus:border-[#C4A480]"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="font-bold text-[#2C221E] uppercase tracking-wider text-[11px]">
                  Ghi chú phục vụ (Tùy chọn):
                </label>
                <input
                  type="text"
                  value={walkInNotes}
                  onChange={(e) => setWalkInNotes(e.target.value)}
                  placeholder="Ví dụ: Uống nước suối lạnh trước, xin thêm ghế em bé..."
                  className="w-full bg-[#FAF7F2] border border-[#E8DFD1] rounded-xl px-3.5 py-2.5 text-xs text-[#2C221E] focus:outline-none focus:border-[#C4A480]"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-[#E8DFD1]">
              <button
                type="button"
                onClick={() => setWalkInTargetTable(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#E8DFD1] text-xs font-bold text-[#78716C] hover:bg-[#FAF7F2] cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmWalkInOpen}
                className="flex-1 py-2.5 rounded-xl bg-[#8C6A43] hover:bg-[#735534] text-white text-xs font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Xác Nhận Mở Bàn {walkInTargetTable.code}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. MODAL: POS CHI TIẾT BÀN, QUẢN LÝ ORDER & TÍNH TIỀN */}
      {selectedTableForPOS && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1412]/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-4xl bg-white rounded-3xl border border-[#E8DFD1] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header - Fixed Badge Overflow with min-w & whitespace-nowrap */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-[#FAF7F2] via-[#F5ECE0] to-[#FAF7F2] border-b border-[#E8DFD1] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="px-3.5 h-12 rounded-2xl bg-[#8C6A43] min-w-[56px] text-white flex items-center justify-center font-serif font-bold text-lg whitespace-nowrap shadow-xs shrink-0">
                  {selectedTableForPOS.code}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-serif text-xl font-bold text-[#2C221E]">
                      Hóa Đơn & Quản Lý Bàn {selectedTableForPOS.code}
                    </h3>
                    <span className="text-[11px] font-bold text-[#8C6A43] bg-white px-2.5 py-0.5 rounded-full border border-[#E8DFD1]">
                      {tableOrders[selectedTableForPOS.id]?.source === 'ONLINE' ? '✨ Khách Đặt Online' : '🚶 Khách Vãng Lai'}
                    </span>
                  </div>
                  <p className="text-xs text-[#78716C] mt-0.5">
                    Thực khách: <strong>{tableOrders[selectedTableForPOS.id]?.guestName || selectedTableForPOS.currentGuestName || 'Khách Tại Bàn'}</strong> • {tableOrders[selectedTableForPOS.id]?.seatedAtTime || 'Đang ngồi'}
                  </p>
                </div>
              </div>

              {/* Table Action Controls (Chuyển bàn, Ghép bàn, Waiter App, Đóng) */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAF4EB] text-[#2C221E] border border-[#E8DFD1] text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                  title="Chuyển toàn bộ order sang một bàn trống khác"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-[#8C6A43]" />
                  <span>Chuyển Bàn</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsMergeModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAF4EB] text-[#2C221E] border border-[#E8DFD1] text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                  title="Ghép bàn hoặc gộp hóa đơn với bàn khác"
                >
                  <Merge className="w-3.5 h-3.5 text-[#8C6A43]" />
                  <span>Ghép Bàn</span>
                </button>

                {onNavigateToWaiter && (
                  <button
                    type="button"
                    onClick={onNavigateToWaiter}
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAF4EB] text-[#8C6A43] border border-[#E8DFD1] text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-[#8C6A43]" />
                    <span>App Phục Vụ</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedTableForPOS(null)}
                  className="w-9 h-9 rounded-full bg-white border border-[#E8DFD1] flex items-center justify-center text-[#78716C] hover:text-[#2C221E] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Main POS Content Grid (Left: Current Orders List | Right: Billing & Add Dish) */}
            <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto flex-1">
              {/* LEFT: Current Orders List (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#E8DFD1]">
                  <h4 className="font-serif text-base font-bold text-[#2C221E] flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-[#8C6A43]" />
                    <span>Danh Sách Món Đang Dùng</span>
                  </h4>
                  <span className="text-xs font-semibold text-[#8C6A43]">
                    {tableOrders[selectedTableForPOS.id]?.items.reduce((a, b) => a + b.quantity, 0) || 0} phần món
                  </span>
                </div>

                {/* Items container */}
                <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                  {(!tableOrders[selectedTableForPOS.id]?.items || tableOrders[selectedTableForPOS.id].items.length === 0) ? (
                    <div className="p-8 text-center bg-[#FAF7F2] rounded-2xl border border-dashed border-[#E8DFD1] space-y-2">
                      <Utensils className="w-8 h-8 text-[#C4A480] mx-auto opacity-50" />
                      <p className="text-xs font-bold text-[#2C221E]">Bàn này chưa gọi món nào</p>
                      <p className="text-[11px] text-[#78716C]">
                        Chọn món từ thực đơn bên dưới hoặc nhập món riêng để thêm vào hóa đơn bàn.
                      </p>
                    </div>
                  ) : (
                    tableOrders[selectedTableForPOS.id].items.map((item) => (
                      <div
                        key={item.dishId}
                        className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8DFD1] flex items-center justify-between gap-3 hover:bg-white transition-all shadow-2xs"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#2C221E] truncate">
                              {item.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleToggleDishStatus(selectedTableForPOS.id, item.dishId)}
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-md border cursor-pointer transition-colors ${
                                item.status === 'SERVED'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {item.status === 'SERVED' ? '✓ Đã Lên Bàn' : '⏳ Bếp Đang Nấu'}
                            </button>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[11px] font-mono text-[#8C6A43]">
                              {new Intl.NumberFormat('vi-VN').format(item.price)} đ / phần
                            </p>
                            {item.notes && (
                              <span className="text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                📝 {item.notes}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Stepper & Total */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-xl border border-[#E8DFD1]">
                            <button
                              type="button"
                              onClick={() => handleUpdateDishQty(selectedTableForPOS.id, item.dishId, -1)}
                              className="w-5 h-5 rounded flex items-center justify-center text-[#6B5E54] hover:bg-[#FAF7F2] cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-bold font-mono w-4 text-center text-[#2C221E]">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateDishQty(selectedTableForPOS.id, item.dishId, 1)}
                              className="w-5 h-5 rounded flex items-center justify-center text-[#8C6A43] hover:bg-[#FAF4EB] cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <span className="text-xs font-mono font-bold text-[#2C221E] w-24 text-right">
                            {new Intl.NumberFormat('vi-VN').format(item.price * item.quantity)} đ
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Section: ADD DISHES (Fast Menu Picker + Custom Dish Entry) */}
                <div className="space-y-3 pt-3 border-t border-[#E8DFD1]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#2C221E] uppercase tracking-wider">
                      + Thêm Món Vào Bàn (Phục vụ báo order):
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddingCustomDish(!isAddingCustomDish)}
                      className="text-[11px] font-bold text-[#8C6A43] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isAddingCustomDish ? 'Đóng nhập tay' : '+ Tự nhập món riêng / nước ngọt'}</span>
                    </button>
                  </div>

                  {/* Custom Dish Manual Entry Form */}
                  {isAddingCustomDish && (
                    <div className="p-3 bg-[#FAF4EB] rounded-2xl border border-[#C4A480] space-y-2.5 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#2C221E]">Nhập món / Đồ uống ngoài menu:</span>
                        <span className="text-[10px] text-[#78716C]">Nhập tên & giá</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={customDishName}
                          onChange={(e) => setCustomDishName(e.target.value)}
                          placeholder="Tên món (VD: Bia Heineken, Nước Suối...)"
                          className="bg-white border border-[#E8DFD1] rounded-xl px-3 py-1.5 text-xs text-[#2C221E] focus:outline-none focus:border-[#C4A480]"
                        />
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={customDishPrice}
                            onChange={(e) => setCustomDishPrice(e.target.value)}
                            placeholder="Giá tiền (VNĐ)"
                            className="w-full bg-white border border-[#E8DFD1] rounded-xl px-3 py-1.5 text-xs font-mono text-[#2C221E] focus:outline-none focus:border-[#C4A480]"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddCustomDish(selectedTableForPOS.id)}
                            className="px-3 py-1.5 bg-[#8C6A43] hover:bg-[#735534] text-white text-xs font-bold rounded-xl shrink-0 cursor-pointer shadow-2xs"
                          >
                            + Thêm
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={customDishNotes}
                        onChange={(e) => setCustomDishNotes(e.target.value)}
                        placeholder="Ghi chú thêm (VD: Uống đá riêng, ít ngọt...)"
                        className="w-full bg-white border border-[#E8DFD1] rounded-xl px-3 py-1.5 text-xs text-[#2C221E] focus:outline-none focus:border-[#C4A480]"
                      />
                    </div>
                  )}

                  {/* Menu tabs & Search */}
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { id: 'ALL', label: 'Tất Cả' },
                          { id: 'Set Menu & Combo', label: '🌟 Set Combo' },
                          { id: 'Bò Dry-Aged & Món Chính', label: '🥩 Bò & Steak' },
                          { id: 'Rượu Vang & Champagne', label: '🍷 Vang & Rượu' },
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setMenuTab(tab.id)}
                            className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border transition-colors cursor-pointer ${
                              menuTab === tab.id
                                ? 'bg-[#8C6A43] text-white border-[#8C6A43]'
                                : 'bg-[#FAF7F2] text-[#6B5E54] border-[#E8DFD1] hover:bg-white'
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>

                      <div className="relative w-full sm:w-44">
                        <Search className="w-3 h-3 text-[#78716C] absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={menuSearchQuery}
                          onChange={(e) => setMenuSearchQuery(e.target.value)}
                          placeholder="Tìm nhanh món..."
                          className="w-full bg-[#FAF7F2] border border-[#E8DFD1] rounded-xl pl-7 pr-2 py-1 text-xs text-[#2C221E] focus:outline-none focus:border-[#C4A480]"
                        />
                      </div>
                    </div>

                    {/* Quick dish grid */}
                    <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1">
                      {SIGNATURE_DISHES
                        .filter(
                          (d) =>
                            (menuTab === 'ALL' || d.category === menuTab) &&
                            d.name.toLowerCase().includes(menuSearchQuery.toLowerCase())
                        )
                        .slice(0, 8)
                        .map((dish) => (
                          <button
                            key={dish.id}
                            type="button"
                            onClick={() => handleAddDishToTable(selectedTableForPOS.id, dish)}
                            className="p-2.5 rounded-xl bg-[#FAF7F2] hover:bg-white border border-[#E8DFD1] hover:border-[#C4A480] text-left transition-all flex items-center justify-between gap-2 group cursor-pointer"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-[#2C221E] truncate group-hover:text-[#8C6A43]">
                                {dish.name}
                              </p>
                              <p className="text-[10px] font-mono text-[#8C6A43]">
                                {new Intl.NumberFormat('vi-VN').format(dish.price)} đ
                              </p>
                            </div>
                            <Plus className="w-4 h-4 text-[#8C6A43] shrink-0 group-hover:scale-110 transition-transform" />
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT: Billing Summary & Payment Checkout (5 cols) */}
              <div className="lg:col-span-5 bg-[#FAF7F2] rounded-3xl p-5 border border-[#E8DFD1] flex flex-col justify-between space-y-5">
                <div className="space-y-4">
                  <div className="pb-3 border-b border-[#E8DFD1]">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8C6A43] block">
                      POS & Hóa Đơn Thanh Toán
                    </span>
                    <h4 className="font-serif text-xl font-bold text-[#2C221E] mt-0.5">
                      Bảng Tính Tiền Bàn {selectedTableForPOS.code}
                    </h4>
                  </div>

                  {/* UC-08: Nhu cầu Đặc biệt & Dị ứng Card */}
                  {(() => {
                    const current = tableOrders[selectedTableForPOS.id];
                    const hasSpecial = current?.occasion || current?.babyChairCount || current?.candleSetup || current?.dietaryNotes;
                    return (
                      <div className={`p-3.5 rounded-2xl border text-xs space-y-2.5 transition-all ${
                        current?.dietaryNotes 
                          ? 'bg-rose-50/80 border-rose-200' 
                          : hasSpecial 
                          ? 'bg-[#FAF4EB] border-[#C4A480]' 
                          : 'bg-white border-[#E8DFD1]'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-[#8C6A43]" />
                            <span className="font-bold text-[#2C221E] uppercase tracking-wider text-[11px]">
                              Nhu Cầu Đặc Biệt & Dị Ứng
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleOpenEditSpecialModal(selectedTableForPOS.id)}
                            className="text-[11px] font-bold text-[#8C6A43] hover:text-[#735534] flex items-center gap-1 cursor-pointer hover:underline"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Chỉnh sửa / Đồng bộ KDS</span>
                          </button>
                        </div>

                        {/* Badges row */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          {current?.occasion && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold">
                              <Cake className="w-3 h-3 text-amber-700" />
                              {current.occasion}
                            </span>
                          )}
                          {current?.babyChairCount && current.babyChairCount > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-300 text-[10px] font-bold">
                              <Baby className="w-3 h-3 text-blue-700" />
                              {current.babyChairCount} Ghế trẻ em
                            </span>
                          ) : null}
                          {current?.candleSetup && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-300 text-[10px] font-bold">
                              <Flame className="w-3 h-3 text-rose-700" />
                              Setup Nến Thơm
                            </span>
                          )}
                        </div>

                        {/* Dietary Notes alert */}
                        {current?.dietaryNotes ? (
                          <div className="p-2.5 rounded-xl bg-white/90 border border-rose-300 text-rose-900 flex items-start gap-2 shadow-2xs">
                            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            <div className="space-y-0.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">
                                Cảnh Báo Bếp (Dị ứng / Lưu ý nấu nướng):
                              </span>
                              <p className="text-xs font-semibold text-rose-950 leading-relaxed">
                                {current.dietaryNotes}
                              </p>
                            </div>
                          </div>
                        ) : !hasSpecial ? (
                          <p className="text-[11px] text-[#78716C] italic">
                            Chưa có ghi chú đặc biệt. Bấm "Chỉnh sửa" nếu khách cần thêm ghế trẻ em, nến thơm, hoặc kiêng gia vị.
                          </p>
                        ) : null}
                      </div>
                    );
                  })()}

                  {/* Pricing Breakdown */}
                  {(() => {
                    const current = tableOrders[selectedTableForPOS.id];
                    const itemsTotal = current ? current.items.reduce((s, i) => s + i.price * i.quantity, 0) : 0;
                    const serviceCharge = Math.round(itemsTotal * 0.05);
                    const subtotal = itemsTotal + serviceCharge;
                    const deposit = current ? current.depositAmount : 0;
                    const finalPayable = Math.max(0, subtotal - deposit);

                    return (
                      <div className="space-y-2.5 text-xs">
                        <div className="flex items-center justify-between text-[#78716C]">
                          <span>Tiền món ăn & đồ uống:</span>
                          <span className="font-mono font-semibold text-[#2C221E]">
                            {new Intl.NumberFormat('vi-VN').format(itemsTotal)} đ
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[#78716C]">
                          <span>Phí phục vụ tiêu chuẩn (5%):</span>
                          <span className="font-mono font-semibold text-[#2C221E]">
                            {new Intl.NumberFormat('vi-VN').format(serviceCharge)} đ
                          </span>
                        </div>

                        {deposit > 0 && (
                          <div className="flex items-center justify-between text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-200">
                            <span className="font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Trừ tiền cọc Online đã trả:</span>
                            </span>
                            <span className="font-mono font-bold">
                              - {new Intl.NumberFormat('vi-VN').format(deposit)} đ
                            </span>
                          </div>
                        )}

                        <div className="pt-3 border-t-2 border-[#E8DFD1] flex items-baseline justify-between">
                          <div>
                            <span className="font-serif text-sm font-bold text-[#2C221E] block">
                              Tổng Tiền Cần Thu:
                            </span>
                            <span className="text-[10px] text-[#78716C]">
                              (Đã khấu trừ tiền cọc trước)
                            </span>
                          </div>
                          <span className="font-mono text-2xl font-bold text-[#8C6A43]">
                            {new Intl.NumberFormat('vi-VN').format(finalPayable)} đ
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Checkout Payment Actions */}
                <div className="space-y-2.5 pt-4 border-t border-[#E8DFD1]">
                  <span className="text-[10px] font-bold text-[#6B5E54] uppercase tracking-wider block">
                    Chọn hình thức thanh toán tại quầy:
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleCompletePayment(selectedTableForPOS, 'TIỀN MẶT')}
                      className="py-3 px-2 rounded-xl bg-white border border-[#E8DFD1] hover:border-[#8C6A43] text-xs font-bold text-[#2C221E] hover:bg-[#FAF4EB] transition-all flex flex-col items-center justify-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <Banknote className="w-4 h-4 text-emerald-600" />
                      <span>Tiền Mặt</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCompletePayment(selectedTableForPOS, 'QUẸT THẺ POS')}
                      className="py-3 px-2 rounded-xl bg-white border border-[#E8DFD1] hover:border-[#8C6A43] text-xs font-bold text-[#2C221E] hover:bg-[#FAF4EB] transition-all flex flex-col items-center justify-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <CreditCard className="w-4 h-4 text-blue-600" />
                      <span>Quẹt Thẻ POS</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCompletePayment(selectedTableForPOS, 'VIETQR CHUYỂN KHOẢN')}
                    className="w-full py-3.5 rounded-2xl bg-[#8C6A43] hover:bg-[#735534] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Quét VietQR & Hoàn Tất Thanh Toán Bàn {selectedTableForPOS.code}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL: CHUYỂN BÀN (TABLE TRANSFER MODAL) */}
      {isTransferModalOpen && selectedTableForPOS && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1412]/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 border border-[#E8DFD1] shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8DFD1]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#8C6A43] text-white flex items-center justify-center font-bold">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#2C221E]">
                    Chuyển Toàn Bộ Bàn {selectedTableForPOS.code}
                  </h3>
                  <p className="text-[11px] text-[#78716C]">
                    Chuyển order, khách và tiền cọc sang một bàn trống khác
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#FAF7F2] flex items-center justify-center text-[#78716C] hover:text-[#2C221E] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#E8DFD1] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#78716C] uppercase font-bold">Bàn Nguồn (Hiện tại):</span>
                  <p className="font-serif font-bold text-sm text-[#2C221E]">{selectedTableForPOS.code} ({tableOrders[selectedTableForPOS.id]?.guestName || 'Khách'})</p>
                </div>
                <ArrowRight className="w-4 h-4 text-[#8C6A43]" />
                <div className="text-right">
                  <span className="text-[10px] text-[#78716C] uppercase font-bold">Bàn Đích Sắp Chuyển:</span>
                  <p className="font-serif font-bold text-sm text-[#8C6A43]">
                    {transferTargetId ? tables.find(t => t.id === transferTargetId)?.code : 'Chưa chọn'}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-bold text-[#2C221E] uppercase tracking-wider text-[11px] block">
                  Chọn Bàn Trống Muốn Chuyển Sang:
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                  {tables
                    .filter((t) => t.id !== selectedTableForPOS.id && t.status === 'AVAILABLE')
                    .map((t) => {
                      const isSelected = transferTargetId === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setTransferTargetId(t.id)}
                          className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#8C6A43] text-white border-[#8C6A43] font-bold shadow-xs'
                              : 'bg-[#FAF7F2] text-[#2C221E] border-[#E8DFD1] hover:bg-white hover:border-[#C4A480]'
                          }`}
                        >
                          <p className="font-serif font-bold text-sm">{t.code}</p>
                          <p className={`text-[10px] ${isSelected ? 'text-amber-100' : 'text-[#78716C]'}`}>{t.capacity} ghế</p>
                        </button>
                      );
                    })}
                </div>
              </div>

              <p className="text-[11px] text-[#78716C] italic flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-[#8C6A43] shrink-0" />
                <span>Bàn cũ {selectedTableForPOS.code} sẽ tự động trở về Bàn Trống ngay sau khi chuyển.</span>
              </p>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-[#E8DFD1]">
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#E8DFD1] text-xs font-bold text-[#78716C] hover:bg-[#FAF7F2] cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={!transferTargetId}
                onClick={handleConfirmTransfer}
                className="flex-1 py-2.5 rounded-xl bg-[#8C6A43] hover:bg-[#735534] disabled:opacity-40 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Xác Nhận Chuyển Bàn</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL: GHÉP BÀN / GỘP HÓA ĐƠN (TABLE MERGE MODAL) */}
      {isMergeModalOpen && selectedTableForPOS && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1412]/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 border border-[#E8DFD1] shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8DFD1]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#8C6A43] text-white flex items-center justify-center font-bold">
                  <Merge className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#2C221E]">
                    Ghép Bàn {selectedTableForPOS.code}
                  </h3>
                  <p className="text-[11px] text-[#78716C]">
                    Gộp order & tiền cọc với bàn khác để thanh toán chung 1 hóa đơn
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMergeModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#FAF7F2] flex items-center justify-center text-[#78716C] hover:text-[#2C221E] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-2">
                <label className="font-bold text-[#2C221E] uppercase tracking-wider text-[11px] block">
                  Chọn Bàn Muốn Ghép Vào:
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {tables
                    .filter((t) => t.id !== selectedTableForPOS.id)
                    .map((t) => {
                      const isSelected = mergeTargetId === t.id;
                      const hasOrder = Boolean(tableOrders[t.id]);
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setMergeTargetId(t.id)}
                          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-[#8C6A43] text-white border-[#8C6A43] font-bold shadow-xs'
                              : 'bg-[#FAF7F2] text-[#2C221E] border-[#E8DFD1] hover:bg-white hover:border-[#C4A480]'
                          }`}
                        >
                          <div>
                            <p className="font-serif font-bold text-sm">{t.code}</p>
                            <p className={`text-[10px] ${isSelected ? 'text-amber-100' : 'text-[#78716C]'}`}>
                              {t.capacity} ghế • {hasOrder ? '🟠 Đang có khách' : '🟢 Bàn trống'}
                            </p>
                          </div>
                          {isSelected && <Check className="w-4 h-4" />}
                        </button>
                      );
                    })}
                </div>
              </div>

              <div className="p-3 bg-amber-50 text-amber-900 rounded-2xl border border-amber-200 text-[11px] space-y-1">
                <p className="font-bold">⚡ Quy tắc ghép bàn:</p>
                <p>• Toàn bộ món ăn và tiền cọc của <strong>{selectedTableForPOS.code}</strong> sẽ được cộng dồn vào bàn được chọn.</p>
                <p>• Bàn <strong>{selectedTableForPOS.code}</strong> sẽ được giải phóng về trạng thái Bàn Trống.</p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-[#E8DFD1]">
              <button
                type="button"
                onClick={() => setIsMergeModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#E8DFD1] text-xs font-bold text-[#78716C] hover:bg-[#FAF7F2] cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={!mergeTargetId}
                onClick={handleConfirmMerge}
                className="flex-1 py-2.5 rounded-xl bg-[#8C6A43] hover:bg-[#735534] disabled:opacity-40 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Xác Nhận Ghép Bàn</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL: THANH TOÁN THÀNH CÔNG (PAYMENT RECEIPT SUCCESS) */}
      {isPaymentSuccessOpen && paidTableSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1412]/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-[#E8DFD1] shadow-2xl space-y-5 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest font-mono">
                Thanh Toán Hoàn Tất
              </span>
              <h3 className="font-serif text-2xl font-bold text-[#2C221E]">
                Bàn {paidTableSummary.code} Đã Thanh Toán
              </h3>
              <p className="text-xs text-[#78716C]">
                Thực khách: <strong>{paidTableSummary.guestName}</strong>
              </p>
            </div>

            <div className="bg-[#FAF7F2] rounded-2xl p-4 border border-[#E8DFD1] text-xs space-y-2 text-left">
              <div className="flex justify-between text-[#78716C]">
                <span>Tổng hóa đơn:</span>
                <span className="font-mono font-semibold">{new Intl.NumberFormat('vi-VN').format(paidTableSummary.total)} đ</span>
              </div>
              {paidTableSummary.depositDeducted > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Tiền cọc Online đã trừ:</span>
                  <span className="font-mono font-bold">- {new Intl.NumberFormat('vi-VN').format(paidTableSummary.depositDeducted)} đ</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-[#2C221E] pt-2 border-t border-[#E8DFD1]">
                <span>Thực thu tại quầy:</span>
                <span className="font-mono text-base text-[#8C6A43]">{new Intl.NumberFormat('vi-VN').format(paidTableSummary.finalPaid)} đ</span>
              </div>
              <div className="text-[11px] text-[#78716C] pt-1">
                Phương thức: <strong>{paidTableSummary.paymentMethod}</strong>
              </div>
            </div>

            <div className="p-3 bg-blue-50 text-blue-800 rounded-xl text-xs flex items-center gap-2">
              <RefreshCw className="w-4 h-4 shrink-0 text-blue-600" />
              <span>Bàn {paidTableSummary.code} đã được tự động chuyển về trạng thái <strong>Bàn Trống (Available)</strong> sẵn sàng đón khách mới.</span>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsPaymentSuccessOpen(false);
                setPaidTableSummary(null);
              }}
              className="w-full py-3 rounded-2xl bg-[#8C6A43] hover:bg-[#735534] text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              Đóng & Tiếp Tục Giám Sát
            </button>
          </div>
        </div>
      )}

      {/* 8. SCANNER SIMULATION MODAL */}
      {isScannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1412]/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 border border-[#E8DFD1] shadow-2xl space-y-4 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#E8DFD1] pb-3">
              <h3 className="text-sm font-bold text-[#2C221E] flex items-center gap-2">
                <QrCode className="w-4 h-4 text-[#8C6A43]" />
                <span>Quét Mã QR Vé Đặt Bàn</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsScannerOpen(false)}
                className="w-8 h-8 rounded-full bg-[#FAF7F2] flex items-center justify-center text-[#78716C] hover:text-[#2C221E] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="w-full h-52 bg-[#FAF7F2] rounded-2xl border-2 border-dashed border-[#C4A480] flex flex-col items-center justify-center p-4">
              <div className="w-36 h-36 border-2 border-[#8C6A43] rounded-2xl flex items-center justify-center relative bg-white/50 shadow-inner">
                <span className="text-[11px] text-[#78716C] font-semibold">Hướng camera vào mã QR</span>
                <span className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-[#8C6A43]" />
                <span className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-[#8C6A43]" />
                <span className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-[#8C6A43]" />
                <span className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-[#8C6A43]" />
              </div>
            </div>

            {scanResult && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold">
                {scanResult}
              </div>
            )}

            <button
              type="button"
              onClick={handleSimulateScan}
              className="w-full py-3 rounded-2xl bg-[#8C6A43] hover:bg-[#735534] text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              Giả Lập Quét Vé Khách Tới (Ông Đặng Hoàng Nam • Bàn T-03)
            </button>
          </div>
        </div>
      )}

      {/* 9. UC-08: SPECIAL REQUESTS & DIETARY NOTES EDIT MODAL */}
      {isEditSpecialModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1412]/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-[#E8DFD1] shadow-2xl p-6 sm:p-7 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8DFD1]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-[#8C6A43]" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#2C221E]">
                    Nhu Cầu Đặc Biệt & Dị Ứng
                  </h3>
                  <p className="text-xs text-[#78716C]">
                    Bàn {tables.find((t) => t.id === editingTableId)?.code || editingTableId} • Đồng bộ tức thì sang KDS Bếp
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditSpecialModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#FAF7F2] flex items-center justify-center text-[#78716C] hover:text-[#2C221E] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {/* Occasion Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#2C221E] block">
                  Mục Đích Bữa Tiệc (Occasion):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {['Không có', 'Sinh nhật', 'Kỷ niệm', 'Hẹn hò', 'Gặp đối tác', 'Gia đình'].map((occ) => {
                    const isSelected = (occ === 'Không có' && !editOccasion) || editOccasion === occ;
                    return (
                      <button
                        key={occ}
                        type="button"
                        onClick={() => setEditOccasion(occ === 'Không có' ? '' : occ)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#8C6A43] text-white border-[#8C6A43] shadow-2xs'
                            : 'bg-[#FAF7F2] text-[#44403C] border-[#E8DFD1] hover:bg-white'
                        }`}
                      >
                        {occ}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Extra Facilities: Baby Chair & Candles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#E8DFD1] space-y-2">
                  <span className="text-xs font-bold text-[#2C221E] flex items-center gap-1.5">
                    <Baby className="w-4 h-4 text-blue-600" />
                    <span>Ghế ăn em bé (High-chair)</span>
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#78716C]">Số lượng:</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditBabyChairCount(Math.max(0, editBabyChairCount - 1))}
                        className="w-7 h-7 rounded-lg bg-white border border-[#E8DFD1] flex items-center justify-center font-bold text-xs hover:bg-[#FAF4EB] cursor-pointer"
                      >
                        -
                      </button>
                      <span className="font-mono font-bold text-sm w-5 text-center text-[#2C221E]">
                        {editBabyChairCount}
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditBabyChairCount(Math.min(5, editBabyChairCount + 1))}
                        className="w-7 h-7 rounded-lg bg-white border border-[#E8DFD1] flex items-center justify-center font-bold text-xs hover:bg-[#FAF4EB] cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#E8DFD1] space-y-2">
                  <span className="text-xs font-bold text-[#2C221E] flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-rose-600" />
                    <span>Setup nến thơm</span>
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#78716C]">Thắp nến lãng mạn</span>
                    <button
                      type="button"
                      onClick={() => setEditCandleSetup(!editCandleSetup)}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                        editCandleSetup ? 'bg-[#8C6A43]' : 'bg-[#D6C7B2]'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform shadow-xs ${
                          editCandleSetup ? 'left-5.5' : 'left-0.5'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Dietary notes & Allergy Warnings */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>Lưu Ý Ăn Uống & Cảnh Báo Dị Ứng Cho Bếp:</span>
                  </label>
                  <span className="text-[10px] text-rose-600 font-semibold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                    KDS Bếp ưu tiên
                  </span>
                </div>

                {/* Quick chip suggestions */}
                <div className="flex flex-wrap gap-1.5 pb-1">
                  {[
                    'Không rắc tiêu vào thức ăn vì có trẻ nhỏ',
                    'Dị ứng hải sản có vỏ',
                    'Dị ứng đậu phộng',
                    'Không ăn cay',
                    'Ăn chay (Vegetarian)',
                    'Không hành tỏi',
                    'Không bột ngọt',
                  ].map((preset) => {
                    const isIncluded = editDietaryNotes.includes(preset);
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          if (isIncluded) {
                            setEditDietaryNotes(
                              editDietaryNotes
                                .split(', ')
                                .filter((s) => s.trim() !== preset)
                                .join(', ')
                            );
                          } else {
                            setEditDietaryNotes(
                              editDietaryNotes ? `${editDietaryNotes}, ${preset}` : preset
                            );
                          }
                        }}
                        className={`text-[10px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                          isIncluded
                            ? 'bg-rose-600 text-white border-rose-600 shadow-2xs font-bold'
                            : 'bg-rose-50/60 text-rose-800 border-rose-200 hover:bg-rose-100 font-medium'
                        }`}
                      >
                        {isIncluded ? '✓ ' : '+ '}
                        {preset}
                      </button>
                    );
                  })}
                </div>

                <textarea
                  value={editDietaryNotes}
                  onChange={(e) => setEditDietaryNotes(e.target.value)}
                  rows={2}
                  placeholder="Ghi chú chi tiết cho đầu bếp (VD: Không rắc tiêu vì có bé nhỏ, dị ứng tôm cua...)"
                  className="w-full p-3 rounded-xl border border-rose-300 bg-rose-50/30 text-xs text-rose-950 focus:outline-none focus:border-rose-500 font-medium leading-relaxed"
                />
              </div>

              {/* Staff internal notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#2C221E] block">
                  Ghi Chú Nội Bộ Phục Vụ / Lễ Tân:
                </label>
                <input
                  type="text"
                  value={editStaffNotes}
                  onChange={(e) => setEditStaffNotes(e.target.value)}
                  placeholder="Ghi chú phục vụ (VD: Khách VIP thân thiết, chuẩn bị bánh kem...)"
                  className="w-full px-3 py-2 rounded-xl border border-[#E8DFD1] text-xs text-[#2C221E] focus:outline-none focus:border-[#C4A480]"
                />
              </div>
            </div>

            {/* Modal actions */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#E8DFD1]">
              <button
                type="button"
                onClick={() => setIsEditSpecialModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-[#E8DFD1] text-xs font-semibold text-[#78716C] hover:bg-[#FAF7F2] cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveSpecialRequests}
                className="px-5 py-2.5 rounded-xl bg-[#8C6A43] hover:bg-[#735534] text-white text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Lưu & Đồng Bộ Sang KDS Bếp</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
