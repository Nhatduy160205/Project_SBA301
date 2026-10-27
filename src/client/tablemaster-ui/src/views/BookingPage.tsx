import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  Users,
  Sparkles,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Heart,
  ShieldCheck,
  User,
  Phone,
  Mail,
  FileText,
  X,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  ArrowRight,
  Info,
  Gift,
  Building2,
  Award,
  Utensils,
  Wine,
  Flame,
  Check,
  Tag,
  ShoppingBag,
  Trash2,
  Shirt,
  Move3d,
  Sun,
  Moon,
  Star,
  Sliders,
  Cake,
  Baby,
  ShieldAlert,
  AlertCircle,
} from 'lucide-react';
import type { TableItem, SignatureDish, BookingDetails } from '../types';
import { SIGNATURE_DISHES } from '../data/mockData';
import { QRPaymentModal } from '../components/common/QRPaymentModal';
import { ETicketModal } from '../components/booking/ETicketModal';
import { AvailabilitySearchEngine } from '../components/booking/AvailabilitySearchEngine';
import { FloorPlanCanvas } from '../components/floor/FloorPlanCanvas';
import { SpatialFloor3D } from '../components/floor/SpatialFloor3D';
import { webSocketFloorService } from '../services/websocketService';
import {
  bookingApi,
  ensureUUID,
  getDishUUID,
  SEED_DATA,
  type CreateBookingRequestPayload,
  type TableAvailabilityDto,
} from '../services/bookingApi';

export const OCCASIONS = [
  { id: 'date', label: 'Hẹn hò lãng mạn', icon: Heart, desc: 'Bàn nến ấm cúng, view lãng mạn' },
  { id: 'anniversary', label: 'Kỷ niệm ngày cưới / Yêu nhau', icon: Sparkles, desc: 'Setup hoa hồng & chúc mừng' },
  { id: 'birthday', label: 'Tiệc sinh nhật', icon: Gift, desc: 'Tặng đĩa bánh sinh nhật nhỏ' },
  { id: 'business', label: 'Tiếp đối tác / Công việc', icon: Building2, desc: 'Yên tĩnh, trang trọng & riêng tư' },
  { id: 'family', label: 'Tụ họp gia đình / Bạn bè', icon: Users, desc: 'Không gian rộng rãi, ấm cúng' },
];

export const DIETARY_OPTIONS = [
  {
    id: 'no_pepper',
    label: 'Không rắc tiêu vào thức ăn (Có trẻ nhỏ)',
    subtitle: 'Không rắc tiêu đen hoặc tiêu sọ vào bất kỳ món ăn nào',
    badge: '🚨 Quan trọng',
    color: 'text-rose-700 bg-rose-50 border-rose-300 ring-rose-200',
  },
  {
    id: 'seafood_allergy',
    label: 'Dị ứng hải sản có vỏ',
    subtitle: 'Không dùng tôm, cua, sò điệp, hàu trong bất kỳ công đoạn chế biến',
    badge: '⚠️ Dị ứng',
    color: 'text-amber-800 bg-amber-50 border-amber-300 ring-amber-200',
  },
  {
    id: 'peanut_allergy',
    label: 'Dị ứng đậu phộng / các loại hạt',
    subtitle: 'Tuyệt đối không dùng dầu lạc, bơ đậu phộng, hạt điều, hạnh nhân',
    badge: '⚠️ Dị ứng',
    color: 'text-amber-800 bg-amber-50 border-amber-300 ring-amber-200',
  },
  {
    id: 'no_spicy',
    label: 'Không ăn cay (Không ớt, gia vị cay)',
    subtitle: 'Chế biến thanh ngọt tự nhiên, êm dịu dạ dày',
    badge: '🌶️ Khẩu vị',
    color: 'text-stone-700 bg-stone-50 border-stone-300 ring-stone-200',
  },
  {
    id: 'vegetarian',
    label: 'Có khách ăn chay (Vegetarian)',
    subtitle: 'Bếp trưởng chuẩn bị riêng thực đơn nấm & rau củ quả hữu cơ',
    badge: '🥗 Món chay',
    color: 'text-emerald-800 bg-emerald-50 border-emerald-300 ring-emerald-200',
  },
  {
    id: 'no_msg',
    label: 'Không bột ngọt / Mì chính (No MSG)',
    subtitle: 'Nước xốt hầm mộc tự nhiên từ rau củ và xương trong 18 tiếng',
    badge: '🌿 Tự nhiên',
    color: 'text-teal-800 bg-teal-50 border-teal-300 ring-teal-200',
  },
  {
    id: 'gluten_free',
    label: 'Không Gluten / Bất dung nạp sữa',
    subtitle: 'Không dùng bánh mì bột mì, nước tương có lúa mì, bơ sữa động vật',
    badge: '🌾 Ăn kiêng',
    color: 'text-indigo-800 bg-indigo-50 border-indigo-300 ring-indigo-200',
  },
];

export const FACILITY_TAGS = [
  'Ưu tiên bàn gần cửa sổ ngắm view phố Nguyễn Huệ',
  'Vị trí góc yên tĩnh để đàm đạo riêng tư',
  'Có người lớn tuổi cần ghế êm & gần lối đi',
  'Cần Sommelier riêng tư vấn hầm rượu vang',
  'Chuẩn bị hoa hồng tươi & thiệp chúc mừng trên bàn',
];

const formatDateToISO = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getUpcomingSaturday = (): string => {
  const d = new Date();
  const day = d.getDay();
  const diff = (6 - day + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  return formatDateToISO(d);
};

const isTimeSlotPassed = (timeString: string, selectedDateISO: string): boolean => {
  const now = new Date();
  const todayISO = formatDateToISO(now);

  if (selectedDateISO < todayISO) return true; // Past date
  if (selectedDateISO > todayISO) return false; // Future date

  // If today: check hour & minute
  const match = timeString.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return false;

  const slotMinutes = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  return slotMinutes <= nowMinutes;
};

const LUNCH_SLOTS_15M = [
  '11:00', '11:15', '11:30', '11:45',
  '12:00', '12:15', '12:30', '12:45',
  '13:00', '13:15', '13:30', '13:45', '14:00'
];

const DINNER_SLOTS_15M = [
  '17:00', '17:15', '17:30', '17:45',
  '18:00', '18:15', '18:30', '18:45',
  '19:00', '19:15', '19:30', '19:45',
  '20:00', '20:15', '20:30', '20:45',
  '21:00', '21:15', '21:30', '21:45',
  '22:00', '22:15', '22:30', '22:45', '23:00'
];

const HOT_SLOTS = [
  { slot: '11:30 - 13:30', startTime: '11:30', shift: 'Bữa Trưa' },
  { slot: '12:00 - 14:00', startTime: '12:00', shift: 'Trưa Cao Điểm' },
  { slot: '18:00 - 20:00', startTime: '18:00', shift: 'Bữa Tối (Sớm)' },
  { slot: '19:00 - 21:00', startTime: '19:00', shift: '🔥 Giờ Vàng (Đẹp nhất)' },
  { slot: '19:30 - 21:30', startTime: '19:30', shift: '🔥 Cao Điểm Tối' },
  { slot: '20:00 - 22:00', startTime: '20:00', shift: 'Bữa Tối (Muộn)' },
];

const floorDescriptions: Record<1 | 2 | 3, { name: string; tag: string; view: string }> = {
  1: {
    name: 'Tầng 1: Sảnh Chính & View Phố Nguyễn Huệ',
    tag: '14 Bàn • Cửa kính Panoramic',
    view: 'Ngắm trọn đại lộ Nguyễn Huệ lung linh, cạnh Sân khấu Acoustic và Quầy Bar mở',
  },
  2: {
    name: 'Tầng 2: Phòng Tiệc VIP & Hầm Rượu Vang',
    tag: '3 Phòng VIP • Riêng tư tuyệt đối',
    view: 'Không gian cách âm cao cấp, hầm rượu Bordeaux Grand Cru, phục vụ riêng',
  },
  3: {
    name: 'Tầng 3: Sky Lounge Rooftop Ngoài Trời',
    tag: '6 Bàn • Chill & Lãng mạn',
    view: 'Ngắm hoàng hôn và view toàn cảnh thành phố về đêm',
  },
};

interface BookingPageProps {
  tables: TableItem[];
  initialFloor?: 1 | 2 | 3;
  onUpdateTableStatus: (tableId: string, newStatus: TableItem['status']) => void;
  onAddBooking: (newBooking: BookingDetails) => void;
  rebookData?: BookingDetails | null;
  onClearRebook?: () => void;
  onOpenBanquetModal?: () => void;
}

export const BookingPage: React.FC<BookingPageProps> = ({
  tables,
  initialFloor = 1,
  onUpdateTableStatus,
  onAddBooking,
  rebookData,
  onClearRebook,
  onOpenBanquetModal,
}) => {
  // Toast thông báo Re-book 1 chạm
  const [rebookToast, setRebookToast] = useState<string | null>(null);

  // Step 1: Time & Party
  const [showSection1, setShowSection1] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<string>(() => formatDateToISO(new Date()));
  const [selectedSlot, setSelectedSlot] = useState<string>('19:00 - 21:00');
  const [isCustomTime, setIsCustomTime] = useState<boolean>(true);
  const [customArrivalTime, setCustomArrivalTime] = useState<string>('19:00');
  const [isTimePickerOpen, setIsTimePickerOpen] = useState<boolean>(false);
  const [partySize, setPartySize] = useState<number>(2);

  // Step 2: Occasion & Preferences (Ghi chú thêm)
  const [showSection2, setShowSection2] = useState<boolean>(true);
  const [currentFloor, setCurrentFloor] = useState<1 | 2 | 3>(initialFloor);
  const [floorViewMode, setFloorViewMode] = useState<'floor2d' | 'floor3d' | 'cards'>('floor2d');
  const [selectedTable, setSelectedTable] = useState<TableAvailabilityDto | null>(null);

  // UC-06: Khóa Giữ bàn 5 phút & Xử lý Tranh chấp (Redlock Concurrency Hold)
  const [holdToken, setHoldToken] = useState<string | null>(null);
  const [holdExpiresAt, setHoldExpiresAt] = useState<number | null>(null);
  const [holdRemainingSeconds, setHoldRemainingSeconds] = useState<number>(300);
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [isHoldingTable, setIsHoldingTable] = useState<boolean>(false);

  // Step 3: Occasion & Preferences (UC-08 Special Requests & Dietary Notes)
  const [showSection3, setShowSection3] = useState<boolean>(true);
  const [selectedOccasion, setSelectedOccasion] = useState<string | null>('date');
  const [babyChairCount, setBabyChairCount] = useState<number>(1);
  const [candleSetup, setCandleSetup] = useState<boolean>(true);
  const [birthdayName, setBirthdayName] = useState<string>('Minh Anh');
  const [selectedDietaryTags, setSelectedDietaryTags] = useState<string[]>([
    'Không rắc tiêu vào thức ăn (Có trẻ nhỏ)',
  ]);
  const [customNotes, setCustomNotes] = useState<string>('Ưu tiên bàn gần cửa sổ ngắm trọn phố Nguyễn Huệ giúp mình nhé!');

  // Step 4: Pre-orders (UC-07 Signature Pre-order Menu & Elaborate Prep)
  const [showSection4, setShowSection4] = useState<boolean>(true);
  const [selectedDishes, setSelectedDishes] = useState<Record<string, number>>({});
  const [dishNotes, setDishNotes] = useState<Record<string, string>>({});
  const [selectedMenuCategory, setSelectedMenuCategory] = useState<string>('ALL');
  const [expandedComboIds, setExpandedComboIds] = useState<Record<string, boolean>>({ 'combo-1': true });

  // Step 5: Policies
  const [showSection5, setShowSection5] = useState<boolean>(true);

  // Customer Contact Info
  const [customerName, setCustomerName] = useState<string>('Nguyễn Trần Bảo Anh');
  const [customerPhone, setCustomerPhone] = useState<string>('0909123456');
  const [customerEmail, setCustomerEmail] = useState<string>('baoanh.nguyen@gmail.com');

  // Payment modal state
  const [isQRModalOpen, setIsQRModalOpen] = useState<boolean>(false);
  const [currentBooking, setCurrentBooking] = useState<BookingDetails | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<BookingDetails | null>(null);
  const [backendBookingUUID, setBackendBookingUUID] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isETicketOpen, setIsETicketOpen] = useState<boolean>(false);

  // Generate 7 upcoming days for horizontal date selector
  const upcomingDays = useMemo(() => {
    const list = [];
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const iso = formatDateToISO(d);
      const isToday = i === 0;
      const isTomorrow = i === 1;
      list.push({
        iso,
        dayName: isToday ? 'Hôm nay' : isTomorrow ? 'Ngày mai' : dayNames[d.getDay()],
        dayNum: d.getDate(),
        month: d.getMonth() + 1,
        fullLabel: `${dayNames[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1}`,
      });
    }
    return list;
  }, []);
  // Step 3: Pre-orders
  const [selectedDishes, setSelectedDishes] = useState<Record<string, number>>({});
  const [showPreOrderSection, setShowPreOrderSection] = useState<boolean>(true);

  // Tự động khôi phục dữ liệu khi khách bấm "Đặt lại bàn này" (Re-book 1-Chạm, gồm cả món Signature & ghi chú)
  useEffect(() => {
    if (rebookData) {
      if (rebookData.partySize) setPartySize(rebookData.partySize);
      if (rebookData.customerName) setCustomerName(rebookData.customerName);
      if (rebookData.phone) setCustomerPhone(rebookData.phone);
      if (rebookData.email) setCustomerEmail(rebookData.email);
      if (rebookData.notes) setCustomNotes(rebookData.notes);
      if (rebookData.occasion) setSelectedOccasion(rebookData.occasion.toLowerCase());
      if (typeof rebookData.babyChairCount === 'number') setBabyChairCount(rebookData.babyChairCount);
      if (typeof rebookData.candleSetup === 'boolean') setCandleSetup(rebookData.candleSetup);
      if (rebookData.dietaryNotes) {
        setSelectedDietaryTags(rebookData.dietaryNotes.split(',').map((s) => s.trim()).filter(Boolean));
      }

      if (rebookData.preOrders && rebookData.preOrders.length > 0) {
        const dishMap: Record<string, number> = {};
        const noteMap: Record<string, string> = {};
        rebookData.preOrders.forEach((p) => {
          if (p.dish && p.dish.id) {
            dishMap[p.dish.id] = p.quantity;
            if (p.preparationNotes) {
              noteMap[p.dish.id] = p.preparationNotes;
            }
          }
        });
        setSelectedDishes(dishMap);
        setDishNotes(noteMap);
      }

      setRebookToast(`Đã tự động tải cấu hình bàn & món ăn cũ từ đơn ${rebookData.bookingId}. Quý khách chỉ cần chọn ngày giờ phù hợp để hoàn tất.`);
    }
  }, [rebookData]);
  const [selectedMenuCategory, setSelectedMenuCategory] = useState<string>('ALL');
  const [expandedComboIds, setExpandedComboIds] = useState<Record<string, boolean>>({ 'combo-1': true });

  // Step 4: Policies
  const [showSection4, setShowSection4] = useState<boolean>(true);

  const toggleComboDetails = (dishId: string) => {
    setExpandedComboIds((prev) => ({ ...prev, [dishId]: !prev[dishId] }));
  };

  const handleClearAllDishes = () => {
    setSelectedDishes({});
    setDishNotes({});
  };

  // Customer info
  const [customerName, setCustomerName] = useState<string>('Nguyễn Trần Bảo Anh');
  const [customerPhone, setCustomerPhone] = useState<string>('0909123456');
  const [customerEmail, setCustomerEmail] = useState<string>('baoanh.nguyen@gmail.com');

  // Payment modal state
  const [isQRModalOpen, setIsQRModalOpen] = useState<boolean>(false);
  const [currentBooking, setCurrentBooking] = useState<BookingDetails | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<BookingDetails | null>(null);
  const [backendBookingUUID, setBackendBookingUUID] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleQuickTagClick = (tag: string) => {
    if (customNotes.includes(tag)) {
      setCustomNotes((prev) =>
        prev
          .replace(tag, '')
          .replace(/,\s*,/g, ',')
          .replace(/^,\s*/, '')
          .trim()
      );
    } else {
      setCustomNotes((prev) => (prev ? `${prev.trim()}, ${tag}` : tag));
    }
  };

  const handleDishQuantityChange = (dishId: string, delta: number) => {
    setSelectedDishes((prev) => {
      const current = prev[dishId] || 0;
      const next = current + delta;
      const copy = { ...prev };
      if (next <= 0) {
        delete copy[dishId];
      } else {
        copy[dishId] = next;
      }
      return copy;
    });

    // Mặc định gợi ý ghi chú chế biến công phu cho các món signature đặc thù
    if (delta > 0 && !selectedDishes[dishId] && !dishNotes[dishId]) {
      if (dishId === 'dish-1') {
        setDishNotes((prev) => ({ ...prev, [dishId]: 'Độ chín: Medium-Rare, Ủ nhiệt 45 phút kỹ thuật Sous-vide' }));
      } else if (dishId === 'wine-1') {
        setDishNotes((prev) => ({ ...prev, [dishId]: 'Decant chiết thở bình pha lê trước 30 phút, ướp lạnh 16°C' }));
      } else if (dishId === 'cake-1') {
        setDishNotes((prev) => ({ ...prev, [dishId]: 'Viết chữ: Chúc Mừng Sinh Nhật (Tặng kèm nến sinh nhật)' }));
      }
    }
  };

  const handleUpdateDishNote = (dishId: string, note: string) => {
    setDishNotes((prev) => ({ ...prev, [dishId]: note }));
  };

  const dishesTotal = Object.entries(selectedDishes).reduce((sum, [dishId, qty]) => {
    const dish = SIGNATURE_DISHES.find((d) => d.id === dishId);
    return sum + (dish ? dish.price * qty : 0);
  }, 0);

  const depositRequired = 200000;
  const grandTotal = depositRequired + dishesTotal;

  // Find a matching table behind the scenes for internal reference
  const findMatchingTable = (): TableItem => {
    const matched = tables.find((t) => t.capacity >= partySize);
    return matched || tables[0];
  };

  const activeTableItem = useMemo(() => {
    if (selectedTable) {
      return tables.find((t) => t.id === selectedTable.tableId || t.code === selectedTable.tableCode) || null;
    }
    return null;
  }, [tables, selectedTable]);

  // Định dạng chuỗi mm:ss cho đồng hồ đếm ngược 05:00
  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // UC-06: Đếm ngược 05:00 (300 giây) khi Redlock giữ bàn thành công
  useEffect(() => {
    if (!selectedTable || !holdExpiresAt) {
      setHoldRemainingSeconds(300);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const diffMs = holdExpiresAt - now;
      const sec = Math.max(0, Math.floor(diffMs / 1000));
      setHoldRemainingSeconds(sec);

      if (sec <= 0) {
        clearInterval(interval);
        // Hết hạn 300s tự động giải phóng bàn
        if (selectedTable && holdToken) {
          bookingApi.releaseHold({
            tableId: ensureUUID(selectedTable.tableId),
            holdToken: holdToken,
            tableCode: selectedTable.tableCode,
          });
        }
        onUpdateTableStatus(selectedTable.tableId, 'AVAILABLE');
        setSelectedTable(null);
        setHoldToken(null);
        setHoldExpiresAt(null);
        setConflictError('⏰ Đã hết thời hạn 5 phút giữ bàn tạm thời (300 giây). Bàn đã được tự động giải phóng để nhường quyền cho khách hàng khác!');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedTable, holdExpiresAt, holdToken, onUpdateTableStatus]);

  // UC-06: Lắng nghe WebSocket STOMP đồng bộ thời gian thực đổi màu bàn toàn hệ thống
  useEffect(() => {
    const unsubscribe = webSocketFloorService.subscribeToTableUpdates((update) => {
      if (!update || !update.tableId) return;

      console.log('⚡ [STOMP Floor Sync] Cập nhật bàn:', update);

      if (update.status === 'HOLDING') {
        // Nếu không phải phiên giữ của chính client này thì cập nhật trạng thái HOLDING (vàng)
        if (!holdToken || update.holdToken !== holdToken) {
          onUpdateTableStatus(update.tableId, 'HOLDING');
        }
      } else if (update.status === 'AVAILABLE') {
        onUpdateTableStatus(update.tableId, 'AVAILABLE');
      } else if (update.status === 'CONFIRMED') {
        onUpdateTableStatus(update.tableId, 'CONFIRMED');
      }
    });

    return () => unsubscribe();
  }, [holdToken, onUpdateTableStatus]);

  // Handle table selection directly on 2D / 3D Floor Canvas - Kích hoạt Redis Redlock 300s (UC-06, BR-02)
  const handleSelectTableFromFloor = async (table: TableItem) => {
    if (table.status !== 'AVAILABLE') {
      if (table.status === 'HOLDING') {
        setConflictError(`Bàn ${table.code} hiện đang được khách hàng khác giữ chỗ trong 5 phút. Vui lòng chọn bàn khác!`);
      }
      return;
    }

    setIsHoldingTable(true);
    setConflictError(null);

    try {
      // 1. Gọi backend kích hoạt Redis Redlock giữ bàn 300 giây (BR-02)
      const res = await bookingApi.holdTable({
        tableId: table.id,
        tableCode: table.code,
        bookingDate: selectedDate,
        timeSlotId: SEED_DATA.TIME_SLOT_ID,
        guestCount: partySize,
        floorNumber: table.floor,
        previousHoldToken: holdToken || undefined,
        previousTableId: selectedTable?.tableId || undefined,
      });

      if (res && res.data) {
        const expiresTime = new Date(res.data.expiresAt).getTime();
        setHoldToken(res.data.holdToken);
        setHoldExpiresAt(expiresTime);
        setHoldRemainingSeconds(res.data.holdDurationSeconds || 300);

        const dto: TableAvailabilityDto = {
          tableId: table.id,
          tableCode: table.code,
          floorNumber: table.floor,
          floorName: table.floor === 1
            ? 'Tầng 1 - Sảnh Vòm & Bar'
            : table.floor === 2
            ? 'Tầng 2 - Phòng VIP Riêng Tư'
            : 'Tầng 3 - Sky Lounge Ngoài Trời',
          zoneType: table.zone,
          minCapacity: Math.max(1, table.capacity - 2),
          maxCapacity: table.capacity,
          customDeposit: table.depositPrice || 200000,
          shape: table.shape,
          isAvailable: true,
          status: 'HELD',
          statusMessage: `Bàn ${table.code} đang được bạn giữ chỗ 5 phút (Redlock)`,
          satisfiesCapacityRule: partySize <= table.capacity,
          isBookedInDb: false,
          isHeldInRedis: true,
          recommended: false,
        };

        setSelectedTable(dto);
        onUpdateTableStatus(table.id, 'HOLDING');
      }
    } catch (err: any) {
      console.warn('❌ [Redlock Concurrency Hold] Tranh chấp bàn:', err.message);
      if (err.isConflict || err.status === 409) {
        setConflictError(err.message || `Bàn ${table.code} vừa có khách hàng khác chọn trước. Vui lòng chọn bàn khác!`);
        onUpdateTableStatus(table.id, 'HOLDING');
      } else {
        setConflictError(`Không thể giữ bàn ${table.code}: ${err.message}`);
      }
    } finally {
      setIsHoldingTable(false);
    }
  };

  const handleDeselectTable = async () => {
    if (!selectedTable) return;
    const oldId = selectedTable.tableId;
    const oldCode = selectedTable.tableCode;
    const oldToken = holdToken;

    setSelectedTable(null);
    setHoldToken(null);
    setHoldExpiresAt(null);
    setHoldRemainingSeconds(300);
    onUpdateTableStatus(oldId, 'AVAILABLE');

    if (oldToken) {
      await bookingApi.releaseHold({
        tableId: oldId,
        holdToken: oldToken,
        tableCode: oldCode,
      });
    }
  };

  const computeEffectiveSlot = () => {
    return isCustomTime ? customArrivalTime : selectedSlot;
  };

  const effectiveTimeSlot = computeEffectiveSlot();

  const handleOpenDepositModal = async () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      alert('Vui lòng nhập họ tên và số điện thoại liên hệ');
      return;
    }

    const assignedTable = findMatchingTable();
    const tableUUID = ensureUUID(selectedTable ? selectedTable.tableId : assignedTable.id);
    const tableCode = selectedTable
      ? `Bàn ${selectedTable.tableCode}`
      : (assignedTable.code || `Bàn ${assignedTable.id}`);
    const tableFloor = (selectedTable?.floorNumber as 1 | 2 | 3) || currentFloor;

    const preOrderItems = Object.entries(selectedDishes)
      .map(([id, quantity]) => {
        const dish = SIGNATURE_DISHES.find((d) => d.id === id);
        return dish
          ? {
              dish,
              quantity,
              preparationNotes: dishNotes[id] || '',
            }
          : null;
      })
      .filter((item): item is { dish: SignatureDish; quantity: number; preparationNotes: string } => item !== null);

    const occasionLabel = OCCASIONS.find((o) => o.id === selectedOccasion)?.label || '';
    const dietaryNotesString = selectedDietaryTags.join(', ');

    // Tạo chuỗi ghi chú tổng hợp chu đáo
    const noteParts: string[] = [];
    if (occasionLabel) {
      if (selectedOccasion === 'birthday' && birthdayName.trim()) {
        noteParts.push(`[Dịp: Tiệc sinh nhật - Bánh kem viết tên "${birthdayName.trim()}"]`);
      } else {
        noteParts.push(`[Dịp: ${occasionLabel}]`);
      }
    }

    const tableReqs: string[] = [];
    if (babyChairCount > 0) tableReqs.push(`Chuẩn bị ${babyChairCount} ghế em bé (baby high-chair)`);
    if (candleSetup) tableReqs.push('Setup nến thơm tinh dầu');
    if (tableReqs.length > 0) noteParts.push(`[Yêu cầu bàn: ${tableReqs.join(', ')}]`);

    if (dietaryNotesString) noteParts.push(`[Cảnh báo Dị ứng & Bếp KDS: ${dietaryNotesString}]`);
    if (customNotes.trim()) noteParts.push(customNotes.trim());

    const fullNotes = noteParts.join(' ').trim();

    setIsSubmitting(true);
    let realBookingCode = `BK-${Math.floor(1000 + Math.random() * 9000)}`;

    // GỌI BACKEND THẬT QUA REST API: POST /api/v1/bookings/request
    try {
      const payload: CreateBookingRequestPayload = {
        guestName: customerName,
        guestPhone: customerPhone,
        guestEmail: customerEmail || 'customer@leprimebistro.vn',
        bookingDate: selectedDate,
        timeSlotId: SEED_DATA.TIME_SLOT_ID,
        guestCount: partySize,
        tableIds: [tableUUID],
        occasion: selectedOccasion ? selectedOccasion.toUpperCase() : 'OTHER',
        dietaryNotes: dietaryNotesString,
        babyChairCount: babyChairCount,
        candleSetup: candleSetup,
        specialNotes: fullNotes,
        totalDeposit: grandTotal, // UC-07: Tổng cọc đã cộng dồn (Cọc bàn + Cọc món ăn đặt trước)
        preorderItems: preOrderItems.map((p) => ({
          menuItemId: getDishUUID(p.dish.id),
          itemName: p.dish.name,
          quantity: p.quantity,
          unitPrice: p.dish.price,
          notes: p.preparationNotes,
        })),
      };

      const res = await bookingApi.createBooking(payload);
      if (res.success && res.data) {
        realBookingCode = res.data.bookingCode;
        setBackendBookingUUID(res.data.id);
        console.log('✅ [Backend API] Đã tạo thành công đơn đặt bàn trên PostgreSQL:', res.data);
      }
    } catch (err: any) {
      console.warn('⚠️ [Backend API] Lỗi khi gửi đơn lên Backend (chuyển sang dự phòng):', err.message);
    } finally {
      setIsSubmitting(false);
    }

    const newBooking: BookingDetails = {
      bookingId: realBookingCode,
      customerName,
      phone: customerPhone,
      email: customerEmail || 'customer@leprimebistro.vn',
      partySize,
      floor: tableFloor,
      tableCode: tableCode,
      tableId: assignedTable.id,
      date: selectedDate,
      timeSlot: effectiveTimeSlot,
      notes: fullNotes,
      occasion: selectedOccasion ? selectedOccasion.toUpperCase() : 'OTHER',
      dietaryNotes: dietaryNotesString,
      babyChairCount: babyChairCount,
      candleSetup: candleSetup,
      preOrders: preOrderItems,
      depositAmount: grandTotal, // UC-07: Cọc cộng dồn chuyển sang VietQR
      totalEstimatedAmount: grandTotal,
      createdAt: 'Vừa xong',
      status: 'PENDING_DEPOSIT',
      vietqrCode: `TM ${realBookingCode}`,
    };

    setCurrentBooking(newBooking);
    setIsQRModalOpen(true);
  };

  const handlePaymentSuccess = async () => {
    if (currentBooking) {
      // GỌI BACKEND THẬT: DUYỆT ĐƠN VÀ XÁC NHẬN CỌC
      if (backendBookingUUID) {
        try {
          const res = await bookingApi.approveAndRequestDeposit(
            backendBookingUUID,
            grandTotal, // UC-07: Duyệt cọc tổng cộng dồn
            60,
            'Khách đã thanh toán cọc bàn và món ăn Signature qua VietQR'
          );
          console.log('✅ [Backend API] Duyệt cọc đơn thành công:', res.data);
        } catch (err: any) {
          console.warn('⚠️ [Backend API] Lỗi duyệt cọc trên backend:', err.message);
        }
      }

      const confirmedBooking: BookingDetails = {
        ...currentBooking,
        status: 'CONFIRMED',
      };
      onAddBooking(confirmedBooking);
      setBookingSuccess(confirmedBooking);
      setIsQRModalOpen(false);
      setIsETicketOpen(true); // UC-12: Tự động mở Vé Điện Tử QR Check-in sau khi cọc thành công

      // Giải phóng phiên giữ tạm thời Redlock khi đã cọc tiền thành công
      if (selectedTable && holdToken) {
        bookingApi.releaseHold({
          tableId: ensureUUID(selectedTable.tableId),
          holdToken: holdToken,
          tableCode: selectedTable.tableCode,
        });
      }
      setHoldToken(null);
      setHoldExpiresAt(null);
      setHoldRemainingSeconds(300);

      const matched = findMatchingTable();
      if (matched) {
        onUpdateTableStatus(matched.id, 'CONFIRMED');
      }
      if (selectedTable) {
        onUpdateTableStatus(selectedTable.tableId, 'CONFIRMED');
      }
    }
  };

  return (
    <div className="w-full max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Re-book Notification Banner (UC-03) */}
      {rebookToast && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 flex items-center justify-between text-xs text-amber-900 shadow-sm animate-in fade-in duration-300">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-semibold">{rebookToast}</span>
          </div>
          <button
            onClick={() => {
              setRebookToast(null);
              if (onClearRebook) onClearRebook();
            }}
            className="p-1 text-amber-600 hover:text-amber-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Hero Banner - Official Restaurant Brand & Info */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1A1412] via-[#261E1A] to-[#1A1412] p-8 sm:p-10 text-white shadow-2xl border border-[#3E312B]">
        <div className="absolute -right-16 -top-16 w-96 h-96 bg-[#C4A480]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-8 bottom-4 opacity-5 pointer-events-none hidden lg:block">
          <span className="font-serif text-9xl font-bold tracking-tighter text-white">PRIME</span>
        </div>

        <div className="relative z-10 max-w-4xl space-y-4">
          {/* Brand Tags */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[11px] font-bold text-[#E2CBB2] uppercase tracking-[0.25em] bg-[#3E312B]/90 px-3.5 py-1 rounded-full border border-[#C4A480]/30 shadow-2xs">
              Le Prime Bistro & Lounge
            </span>
            <span className="text-[11px] font-bold text-amber-300 bg-amber-950/80 px-3 py-1 rounded-full border border-amber-500/30 flex items-center gap-1.5 shadow-2xs">
              <span>⭐ Michelin Guide Selected 2024</span>
            </span>
          </div>

          {/* Restaurant Title */}
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#FBF8F3]">
              Đặt Bàn Trực Tiếp Tại Nhà Hàng
            </h1>
            <p className="text-xs sm:text-sm text-[#D4C8BC] mt-1.5 max-w-2xl leading-relaxed">
              Trải nghiệm ẩm thực Pháp đương đại & Bò lên tuổi Dry-Aged thượng hạng giữa trung tâm Sài Gòn. Quý khách vui lòng chọn ngày giờ và ghi chú để nhà hàng chuẩn bị chu đáo nhất.
            </p>
          </div>

          {/* Core Restaurant Information Strip */}
          <div className="pt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[#E5DACF]">
            <div className="flex items-center gap-2 bg-[#2D231E]/80 px-3 py-1.5 rounded-xl border border-[#4A3B34]">
              <MapPin className="w-3.5 h-3.5 text-[#C4A480] shrink-0" />
              <span><strong>Địa chỉ:</strong> 68 Nguyễn Huệ, P. Bến Nghé, Quận 1, TP.HCM</span>
            </div>

            <div className="flex items-center gap-2 bg-[#2D231E]/80 px-3 py-1.5 rounded-xl border border-[#4A3B34]">
              <Clock className="w-3.5 h-3.5 text-[#C4A480] shrink-0" />
              <span><strong>Giờ mở cửa:</strong> 10:30 – 23:00 (Hàng ngày)</span>
            </div>

            <div className="flex items-center gap-2 bg-[#2D231E]/80 px-3 py-1.5 rounded-xl border border-[#4A3B34]">
              <Phone className="w-3.5 h-3.5 text-[#C4A480] shrink-0" />
              <span><strong>Hotline:</strong> 028 3822 8899 • 0909 123 456</span>
            </div>
          </div>
        </div>

        {/* Value Highlights Footer */}
        <div className="mt-6 pt-5 border-t border-[#3E312B] grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[#E5DACF]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#C4A480]/20 flex items-center justify-center text-[#C4A480] shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-white">Giữ Chỗ Cam Kết 100%</p>
              <p className="text-[11px] text-[#A8988B]">Bàn luôn sẵn sàng đúng giờ hẹn</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#C4A480]/20 flex items-center justify-center text-[#C4A480] shrink-0">
              <Heart className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-white">Ưu Tiên Vị Trí Đẹp Theo Ghi Chú</p>
              <p className="text-[11px] text-[#A8988B]">Ghi chú view ngắm cảnh, dịp kỷ niệm</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#C4A480]/20 flex items-center justify-center text-[#C4A480] shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-white">Bảo Mật Thông Tin Tuyệt Đối</p>
              <p className="text-[11px] text-[#A8988B]">Trải nghiệm riêng tư và đẳng cấp</p>
            </div>
          </div>
        </div>
      </div>

      {/* UC-10: Large Banquet & Floor Buyout CTA Banner */}
      {onOpenBanquetModal && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1E1109] via-[#2D1B0F] to-[#1E1109] border-2 border-amber-500/50 p-6 sm:p-7 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center shrink-0 shadow-lg font-bold">
              <Sparkles className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full">
                  Private Banquet & Rooftop Buyout (UC-10)
                </span>
                <span className="text-xs text-amber-200/70 font-mono">
                  SLA Tư Vấn Trực Tiếp 15 Phút
                </span>
              </div>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-white tracking-tight">
                Đặt Tiệc Đoàn Đông (20 - 100 Khách) hoặc Bao Trọn Tầng Rooftop
              </h3>
              <p className="text-xs sm:text-sm text-stone-300 max-w-2xl leading-relaxed">
                Tổ chức sinh nhật sang trọng, Year-End Party, hội thảo công ty hay gala dinner. Quản lý ca gọi tư vấn trực tiếp thực đơn và lên thiết kế hoa tươi, âm thanh sân khấu trong 15 phút.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenBanquetModal}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-xs sm:text-sm font-bold flex items-center gap-2.5 shadow-xl hover:shadow-amber-500/20 transition-all cursor-pointer shrink-0"
          >
            <span>Tư Vấn Đặt Tiệc Sự Kiện Ngay</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Success banner if booking created */}
      {/* SUCCESS CONFIRMATION BANNER IF JUST BOOKED */}
      <AnimatePresence>
        {bookingSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-6 bg-[#F0FDF4] border-2 border-[#86EFAC] rounded-3xl shadow-md text-[#166534] flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif text-xl font-bold text-[#14532D]">
                  Đặt Bàn Thành Công! Mã đặt chỗ: #{bookingSuccess.bookingId}
                </h3>
                <p className="text-xs sm:text-sm text-[#15803D]">
                  Cảm ơn quý khách <strong>{bookingSuccess.customerName}</strong>. Bàn tại <strong>{bookingSuccess.tableCode}</strong> vào ngày <strong>{bookingSuccess.date} ({bookingSuccess.timeSlot})</strong> cho <strong>{bookingSuccess.partySize} khách</strong> đã được xác nhận.
                </p>
                {bookingSuccess.preOrders && bookingSuccess.preOrders.length > 0 && (
                  <div className="pt-1.5 flex flex-wrap items-center gap-2 text-xs text-emerald-900 font-medium">
                    <span className="bg-emerald-200/60 px-2 py-0.5 rounded-md font-bold">
                      🍳 {bookingSuccess.preOrders.reduce((s, p) => s + p.quantity, 0)} món Signature đặt trước:
                    </span>
                    <span>
                      {bookingSuccess.preOrders.map(p => `${p.quantity}x ${p.dish.name}`).join(', ')}
                    </span>
                    <span className="font-mono font-bold text-emerald-950">
                      (Tổng cọc đã thanh toán: {new Intl.NumberFormat('vi-VN').format(bookingSuccess.depositAmount)} đ)
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsETicketOpen(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <span>📱 Mở Vé QR Check-in (E-Ticket)</span>
              </button>
              <button
                type="button"
                onClick={() => setBookingSuccess(null)}
                className="px-4 py-2.5 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Đặt Thêm Bàn Mới
              </button>
            </div>

            <button
              onClick={() => setBookingSuccess(null)}
              className="px-5 py-2.5 bg-[#16A34A] text-white text-xs font-bold rounded-xl hover:bg-[#15803D] transition-colors shrink-0 cursor-pointer shadow-xs"
            >
              Đặt Thêm Bàn Mới
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 409 Conflict & Redlock Notification Banner (UC-06) */}
      <AnimatePresence>
        {conflictError && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="p-4 rounded-2xl bg-gradient-to-r from-rose-500/15 via-rose-50 to-amber-500/15 border-2 border-rose-400 flex items-center justify-between text-xs text-rose-950 shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold shrink-0 shadow-sm animate-pulse">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-rose-950 uppercase tracking-wider text-[11px]">
                    Thông Báo Tranh Chấp Bàn (Redlock 409 Conflict)
                  </span>
                  <span className="text-[10px] bg-rose-200 text-rose-900 px-2 py-0.5 rounded-full font-mono font-bold">
                    BR-02
                  </span>
                </div>
                <p className="text-rose-900 font-medium">
                  {conflictError}
                </p>
              </div>
            </div>
            <button
              onClick={() => setConflictError(null)}
              className="p-1.5 text-rose-700 hover:text-rose-950 hover:bg-rose-100 rounded-lg cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN RESERVATION WORKFLOW (2-COLUMN MODERN LUXURY LAYOUT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN (7 COLS): STEP 1, 2, 3 SELECTIONS */}
        <div className="lg:col-span-8 space-y-8">
          {/* STEP 1: DATE, TIME & PARTY SIZE */}
          <section className="bg-white border border-[#E8DFD1] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8DFD1]">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-xl bg-[#FAF4EB] text-[#8C6A43] border border-[#E8DFD1] flex items-center justify-center font-bold text-xs font-mono shrink-0">
                  01
                </span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-serif text-xl font-bold text-[#2C221E]">
                      Thời Gian & Số Lượng Thực Khách
                    </h2>
                    {!showSection1 && (
                      <span className="text-[11px] font-semibold text-[#8C6A43] bg-[#FAF4EB] px-2.5 py-0.5 rounded-full border border-[#E8DFD1]">
                        {partySize} Khách • {selectedDate} • {effectiveTimeSlot}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#78716C]">
                    Chọn ngày hẹn, khung giờ dùng bữa và số lượng khách
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowSection1(!showSection1)}
                className="w-8 h-8 rounded-full bg-[#FAF7F2] border border-[#E8DFD1] flex items-center justify-center text-[#6B5E54] hover:bg-[#FAF4EB] cursor-pointer transition-colors shrink-0"
                title={showSection1 ? 'Thu gọn mục 01' : 'Mở rộng mục 01'}
              >
                {showSection1 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            <AnimatePresence>
              {showSection1 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-6 overflow-hidden"
                >
                  {/* Quick Party Size Picker */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#6B5E54] flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-[#C4A480]" />
                        <span>Số lượng khách (Tối thiểu 2 khách):</span>
                      </label>
                      <span className="text-[10px] font-bold text-[#8C6A43] bg-[#FAF4EB] px-2 py-0.5 rounded-md border border-[#E8DFD1]">
                        ⚠️ Chỉ nhận từ 2 khách trở lên
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                      {[
                        { size: 2, label: '2 Khách (Tối thiểu)', sub: 'Hẹn hò, Đôi bạn' },
                        { size: 4, label: '3 - 4 Khách', sub: 'Gia đình nhỏ' },
                        { size: 6, label: '5 - 6 Khách', sub: 'Nhóm bạn thân' },
                        { size: 8, label: '7 - 8 Khách', sub: 'Tiệc họp mặt' },
                        { size: 12, label: '9 - 12+ Khách', sub: 'Tiệc lớn / VIP' },
                      ].map((item) => {
                        const isSelected = partySize === item.size;
                        return (
                          <button
                            key={item.size}
                            type="button"
                            onClick={() => setPartySize(item.size)}
                            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-gradient-to-b from-[#FAF4EB] to-[#F3ECE0] border-[#C4A480] shadow-2xs ring-2 ring-[#C4A480]/30'
                                : 'bg-white border-[#E8DFD1] hover:border-[#C4A480]/60 hover:bg-[#FAF7F2]'
                            }`}
                          >
                            <p className={`text-xs font-bold ${isSelected ? 'text-[#8C6A43]' : 'text-[#2C221E]'}`}>
                              {item.label}
                            </p>
                            <p className="text-[10px] text-[#78716C] mt-0.5">{item.sub}</p>
                          </button>
                        );
                      })}
                    </div>

                    {partySize >= 12 && onOpenBanquetModal && (
                      <div className="p-3 bg-amber-500/10 border border-amber-400/40 rounded-xl flex items-center justify-between text-xs text-amber-950 mt-2">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>
                            Đoàn từ <strong>15 - 100 khách</strong> hoặc muốn <strong>bao trọn tầng Rooftop</strong>?
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={onOpenBanquetModal}
                          className="underline font-bold text-amber-800 hover:text-amber-950 ml-2 whitespace-nowrap cursor-pointer"
                        >
                          Đăng ký Private Banquet &rarr;
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Date & Time Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                    {/* Date Selection */}
                    <div className="space-y-2.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#6B5E54] flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-[#C4A480]" />
                        <span>Ngày dùng bữa:</span>
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="w-full bg-[#FAF7F2] border border-[#E8DFD1] rounded-2xl px-4 py-3 text-xs font-bold text-[#2C221E] focus:outline-none focus:border-[#C4A480] cursor-pointer"
                        />
                      </div>
                      {/* Quick Date Shortcuts */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {[
                          { label: 'Hôm nay', value: formatDateToISO(new Date()) },
                          { label: 'Ngày mai', value: formatDateToISO(new Date(Date.now() + 86400000)) },
                          { label: 'Cuối tuần này', value: getUpcomingSaturday() },
                        ].map((d) => (
                          <button
                            key={d.label}
                            type="button"
                            onClick={() => setSelectedDate(d.value)}
                            className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                              selectedDate === d.value
                                ? 'bg-[#8C6A43] text-white border-[#8C6A43]'
                                : 'bg-[#FAF7F2] text-[#6B5E54] border-[#E8DFD1] hover:bg-[#F3ECE0]'
                            }`}
                          >
                            {d.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Time Selection Trigger & Expandable Slot Panel */}
                    <div className="space-y-3 relative">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#6B5E54] flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-[#C4A480]" />
                          <span>Khung giờ dùng bữa:</span>
                        </span>
                        <span className="text-[11px] text-[#8C6A43] font-semibold">
                          {isTimePickerOpen ? 'Đang chọn khung giờ' : 'Bấm để đổi giờ'}
                        </span>
                      </label>

                      {/* Main Compact Time Display / Trigger Card */}
                      <div
                        onClick={() => setIsTimePickerOpen(!isTimePickerOpen)}
                        className="p-3.5 sm:p-4 bg-gradient-to-r from-[#FAF7F2] to-[#F3ECE0] border-2 border-[#C4A480] hover:border-[#8C6A43] rounded-2xl cursor-pointer transition-all shadow-xs hover:shadow-md group flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-[#8C6A43] text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                            <Clock className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-serif text-lg sm:text-xl font-bold text-[#2C221E]">
                                {effectiveTimeSlot}
                              </span>
                              <span className="text-[10px] font-bold text-[#8C6A43] bg-white px-2 py-0.5 rounded-full border border-[#E8DFD1]">
                                {parseInt((isCustomTime ? customArrivalTime : selectedSlot).split(':')[0], 10) < 16 ? '☀️ Ca Trưa' : '🌙 Ca Tối'}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#6B5E54] mt-0.5">
                              Giờ dùng bữa: <strong>{effectiveTimeSlot}</strong>
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="px-3.5 py-2 rounded-xl bg-white border border-[#E8DFD1] text-xs font-bold text-[#8C6A43] group-hover:bg-[#8C6A43] group-hover:text-white transition-all flex items-center gap-1.5 shadow-2xs"
                        >
                          <span>{isTimePickerOpen ? 'Đóng Bảng' : 'Đổi Giờ'}</span>
                          {isTimePickerOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {/* Expandable Time Picker Modal / Panel */}
                      <AnimatePresence>
                        {isTimePickerOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0, y: -8 }}
                            animate={{ opacity: 1, height: 'auto', y: 0 }}
                            exit={{ opacity: 0, height: 0, y: -8 }}
                            transition={{ duration: 0.25 }}
                            className="bg-[#FAF7F2] border-2 border-[#C4A480]/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl overflow-hidden"
                          >
                            <div className="flex items-center justify-between pb-2 border-b border-[#E8DFD1]">
                              <span className="text-xs font-bold text-[#2C221E]">
                                Chọn khung giờ dự kiến đến nhà hàng:
                              </span>
                              <button
                                type="button"
                                onClick={() => setIsTimePickerOpen(false)}
                                className="text-xs font-semibold text-[#78716C] hover:text-[#2C221E] px-2 py-1 rounded-lg hover:bg-white transition-colors"
                              >
                                ✕ Đóng
                              </button>
                            </div>

                            {/* Section 1: Quick Hot Slots Pills */}
                            <div className="space-y-2">
                              <span className="text-[10px] font-bold text-[#8C6A43] uppercase tracking-wider block">
                                🔥 Khung Giờ Gợi Ý Nhanh:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {HOT_SLOTS.map((t) => {
                                  const isPassed = isTimeSlotPassed(t.startTime, selectedDate);
                                  const isSelected = !isCustomTime && selectedSlot === t.slot;
                                  return (
                                    <button
                                      key={t.slot}
                                      type="button"
                                      disabled={isPassed}
                                      onClick={() => {
                                        setSelectedSlot(t.slot);
                                        setIsCustomTime(false);
                                        setIsTimePickerOpen(false);
                                      }}
                                      className={`px-3 py-1.5 rounded-xl text-xs transition-all border ${
                                        isPassed
                                          ? 'bg-[#EDE7DE] text-[#A8A199] border-[#E0D7CB] cursor-not-allowed opacity-50 line-through'
                                          : isSelected
                                          ? 'bg-[#8C6A43] text-white border-[#8C6A43] font-bold shadow-2xs'
                                          : 'bg-white text-[#2C221E] border-[#E8DFD1] hover:border-[#C4A480] hover:bg-[#FAF4EB] font-medium cursor-pointer'
                                      }`}
                                    >
                                      <span>{t.startTime}</span>
                                      <span className={`text-[10px] ml-1.5 ${isPassed ? 'text-[#A8A199]' : isSelected ? 'text-amber-100' : 'text-[#8C6A43]'}`}>
                                        {isPassed ? '(Đã qua)' : `(${t.shift})`}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Section 2: 15-Minute Grid Lunch Shift */}
                            <div className="space-y-2 pt-2 border-t border-[#E8DFD1]">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-[#8C6A43] uppercase tracking-wider">
                                  ☀️ Ca Trưa (11:00 - 14:00)
                                </span>
                                <span className="text-[10px] text-[#78716C]">Nhận khách muộn nhất 14:00</span>
                              </div>
                              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-1.5">
                                {LUNCH_SLOTS_15M.map((time) => {
                                  const isPassed = isTimeSlotPassed(time, selectedDate);
                                  const isSelected = isCustomTime && customArrivalTime === time;
                                  return (
                                    <button
                                      key={time}
                                      type="button"
                                      disabled={isPassed}
                                      onClick={() => {
                                        setCustomArrivalTime(time);
                                        setIsCustomTime(true);
                                        setIsTimePickerOpen(false);
                                      }}
                                      title={isPassed ? 'Khung giờ này đã trôi qua trong hôm nay' : `Chọn giờ đến lúc ${time}`}
                                      className={`py-2 px-1 text-center rounded-xl text-xs transition-all border ${
                                        isPassed
                                          ? 'bg-[#EDE7DE] text-[#A8A199] border-[#E0D7CB] cursor-not-allowed opacity-50 line-through select-none'
                                          : isSelected
                                          ? 'bg-gradient-to-r from-[#C4A480] to-[#B3936F] text-white font-bold border-transparent shadow-xs ring-2 ring-[#C4A480]/30 cursor-pointer'
                                          : 'bg-white text-[#2C221E] border-[#E8DFD1] hover:border-[#C4A480] hover:bg-[#FAF4EB] font-medium cursor-pointer'
                                      }`}
                                    >
                                      {time}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Section 3: 15-Minute Grid Dinner Shift */}
                            <div className="space-y-2 pt-2 border-t border-[#E8DFD1]">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-[#8C6A43] uppercase tracking-wider">
                                  🌙 Ca Tối & Night Lounge (17:00 - 23:00)
                                </span>
                                <span className="text-[10px] text-[#78716C]">Đóng cửa lúc 23:00</span>
                              </div>
                              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-6 lg:grid-cols-7 gap-1.5">
                                {DINNER_SLOTS_15M.map((time) => {
                                  const isPassed = isTimeSlotPassed(time, selectedDate);
                                  const isSelected = isCustomTime && customArrivalTime === time;
                                  return (
                                    <button
                                      key={time}
                                      type="button"
                                      disabled={isPassed}
                                      onClick={() => {
                                        setCustomArrivalTime(time);
                                        setIsCustomTime(true);
                                        setIsTimePickerOpen(false);
                                      }}
                                      title={isPassed ? 'Khung giờ này đã trôi qua trong hôm nay' : `Chọn giờ đến lúc ${time}`}
                                      className={`py-2 px-1 text-center rounded-xl text-xs transition-all border ${
                                        isPassed
                                          ? 'bg-[#EDE7DE] text-[#A8A199] border-[#E0D7CB] cursor-not-allowed opacity-50 line-through select-none'
                                          : isSelected
                                          ? 'bg-gradient-to-r from-[#C4A480] to-[#B3936F] text-white font-bold border-transparent shadow-xs ring-2 ring-[#C4A480]/30 cursor-pointer'
                                          : 'bg-white text-[#2C221E] border-[#E8DFD1] hover:border-[#C4A480] hover:bg-[#FAF4EB] font-medium cursor-pointer'
                                      }`}
                                    >
                                      {time}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* STEP 2: GHI CHÚ THÊM */}
          <section className="bg-white border border-[#E8DFD1] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8DFD1]">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-xl bg-[#FAF4EB] text-[#8C6A43] border border-[#E8DFD1] flex items-center justify-center font-bold text-xs font-mono shrink-0">
                  02
                </span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-serif text-xl font-bold text-[#2C221E]">
                      Ghi Chú Thêm
                    </h2>
                    {selectedTable ? (
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300 shadow-xs flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Đã chọn: Bàn {selectedTable.tableCode} ({selectedTable.floorName})</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1.5">
                        {isHoldingTable ? (
                          <>
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                            <span>Đang kích hoạt Redis Redlock giữ bàn...</span>
                          </>
                        ) : (
                          <span>Click chọn bàn yêu thích trên sơ đồ</span>
                        )}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#78716C]">
                    Lễ tân sẽ chuẩn bị và ưu tiên sắp xếp bàn theo ghi chú và mong muốn của quý khách
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowSection2(!showSection2)}
                className="w-8 h-8 rounded-full bg-[#FAF7F2] border border-[#E8DFD1] flex items-center justify-center text-[#6B5E54] hover:bg-[#FAF4EB] cursor-pointer transition-colors shrink-0"
                title={showSection2 ? 'Thu gọn mục 02' : 'Mở rộng mục 02'}
              >
                {showSection2 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            <AnimatePresence>
              {showSection2 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-6 overflow-hidden"
                >
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-stone-50 p-2 rounded-2xl border border-stone-200">
              <div className="grid grid-cols-3 gap-2 flex-1">
                {[
                  { floor: 1 as const, label: 'Tầng 1: Sảnh Chính', sub: 'View Nguyễn Huệ', icon: '🏛️' },
                  { floor: 2 as const, label: 'Tầng 2: Phòng VIP', sub: 'Hầm Rượu Bordeaux', icon: '🍷' },
                  { floor: 3 as const, label: 'Tầng 3: Sky Lounge', sub: 'Ban Công Rooftop', icon: '🌆' },
                ].map((f) => {
                  const isCurrent = currentFloor === f.floor;
                  return (
                    <button
                      key={f.floor}
                      type="button"
                      onClick={() => setCurrentFloor(f.floor)}
                      className={`p-2.5 rounded-xl text-left transition-all cursor-pointer border flex items-center gap-2.5 ${
                        isCurrent
                          ? 'bg-white border-amber-400 text-stone-900 shadow-sm ring-1 ring-amber-400/40 font-bold'
                          : 'bg-transparent border-transparent hover:bg-white/60 text-stone-600'
                      }`}
                    >
                      <span className="text-lg">{f.icon}</span>
                      <div className="min-w-0">
                        <p className="text-xs truncate">{f.label}</p>
                        <p className="text-[10px] text-stone-400 truncate">{f.sub}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Legend Pill */}
              <div className="hidden xl:flex items-center gap-3 text-[11px] font-semibold text-stone-600 px-3 py-1.5 bg-white rounded-xl border border-stone-200">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-2xs" />
                  <span>Trống</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                  <span>Giữ 5p</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span>Đã kín</span>
                </div>
                <div className="flex items-center gap-1.5 text-amber-700">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Bạn chọn</span>
                </div>
              </div>
            </div>

            {/* Current Floor Highlight Bar */}
            <div className="px-4 py-2.5 bg-gradient-to-r from-amber-500/10 via-amber-50 to-transparent rounded-2xl border border-amber-300/60 flex items-center justify-between text-xs text-amber-950">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>{floorDescriptions[currentFloor].name}</strong> — {floorDescriptions[currentFloor].view}
                </span>
              </div>
              <span className="hidden sm:inline-block text-[11px] font-bold text-amber-800 font-mono">
                {floorDescriptions[currentFloor].tag}
              </span>
            </div>

            {/* Interactive Canvas or Smart Cards View */}
            <div className="pt-1">
              {floorViewMode === 'floor2d' && (
                <div className="space-y-4">
                  <FloorPlanCanvas
                    floorNumber={currentFloor}
                    tables={tables}
                    selectedTable={activeTableItem}
                    onSelectTable={handleSelectTableFromFloor}
                  />
                  <p className="text-[11px] text-stone-500 text-center italic">
                    💡 <strong>Mẹo:</strong> Click trực tiếp vào bàn xanh để giữ chỗ. Dùng chuột phóng to/thu nhỏ hoặc cuộn để xem góc nhìn thuận tiện nhất.
                  </p>
                </div>
              )}

              {floorViewMode === 'floor3d' && (
                <div className="space-y-4">
                  <SpatialFloor3D
                    floorNumber={currentFloor}
                    tables={tables}
                    selectedTable={activeTableItem}
                    onSelectTable={handleSelectTableFromFloor}
                    viewMode="3d"
                    onToggleViewMode={() => setFloorViewMode('floor2d')}
                  />
                </div>
              )}

              {floorViewMode === 'cards' && (
                <AvailabilitySearchEngine
                  initialDate={selectedDate}
                  initialPartySize={partySize}
                  initialFloor={currentFloor}
                  selectedTableId={selectedTable?.tableId}
                  onSelectTable={async (table, params) => {
                    setSelectedDate(params.date);
                    setPartySize(params.totalGuests);
                    if (table.floorNumber === 1 || table.floorNumber === 2 || table.floorNumber === 3) {
                      setCurrentFloor(table.floorNumber as 1 | 2 | 3);
                    }
                    const matched = tables.find((t) => t.id === table.tableId || t.code === table.tableCode);
                    if (matched) {
                      await handleSelectTableFromFloor(matched);
                    } else {
                      const syntheticTable: TableItem = {
                        id: table.tableId,
                        code: table.tableCode,
                        floor: (table.floorNumber as 1 | 2 | 3) || 1,
                        shape: (table.shape as any) || 'rect',
                        capacity: table.maxCapacity || 4,
                        x: 100,
                        y: 100,
                        width: 100,
                        height: 70,
                        status: 'AVAILABLE',
                        zone: (table.zoneType as any) || 'STANDARD',
                        depositPrice: table.customDeposit || 200000,
                      };
                      await handleSelectTableFromFloor(syntheticTable);
                    }
                  }}
                />
              )}
            </div>

            {/* SELECTED TABLE SPOTLIGHT CARD */}
            {selectedTable && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 bg-gradient-to-r from-amber-500/15 via-white to-amber-500/10 border-2 border-amber-400 rounded-3xl shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 flex flex-col items-center justify-center font-serif font-black shadow-md shrink-0">
                    <span className="text-[10px] tracking-widest font-sans uppercase">BÀN</span>
                    <span className="text-base leading-none">{selectedTable.tableCode}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-serif text-lg font-bold text-stone-900">
                        Bàn {selectedTable.tableCode} • {selectedTable.floorName}
                      </h4>
                      <span className="text-[10px] font-bold text-amber-950 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-400 flex items-center gap-1 shadow-xs">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                        <span>🟡 Đang Khóa Giữ (Redlock 300s)</span>
                      </span>
                    </div>
                    <p className="text-xs text-stone-600">
                      Sức chứa: <strong>{selectedTable.minCapacity} – {selectedTable.maxCapacity} khách</strong> • Khu vực: <strong>{selectedTable.zoneType}</strong>
                    </p>
                    <p className="text-[11px] text-amber-800">
                      {selectedTable.zoneType === 'WINDOW_VIEW'
                        ? '🪟 Bàn sát cửa kính lớn, ngắm trọn vẹn phố đi bộ Nguyễn Huệ lung linh về đêm'
                        : selectedTable.zoneType === 'VIP'
                        ? '👑 Phòng VIP riêng tư, cách âm cao cấp kèm phục vụ chuyên biệt'
                        : selectedTable.zoneType === 'OUTDOOR'
                        ? '🌿 Ban công Sky Lounge thoáng đãng ngắm toàn cảnh thành phố'
                        : '🍸 Cạnh quầy Bar & Bếp mở, thưởng thức cocktail pha chế trực tiếp'}
                    </p>
                  </div>
                </div>

                {/* Redlock Live 05:00 Countdown Box */}
                <div className="flex items-center gap-3 self-end md:self-auto flex-wrap">
                  <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 p-2 px-3.5 rounded-2xl border border-amber-300 shadow-md flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center shrink-0 font-bold">
                      <Clock className="w-3.5 h-3.5 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-amber-950">
                        <ShieldCheck className="w-3 h-3 text-emerald-900" />
                        <span>Thời gian giữ bàn (BR-02):</span>
                      </div>
                      <div className="font-mono text-base font-black text-slate-950 leading-none">
                        {formatCountdown(holdRemainingSeconds)}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-stone-500 block uppercase font-bold">Tiền cọc giữ bàn:</span>
                    <span className="font-serif text-base font-bold text-amber-700">
                      {new Intl.NumberFormat('vi-VN').format(depositRequired)} đ
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleDeselectTable}
                    className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="Bỏ chọn & Giải phóng bàn này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>

          {/* STEP 3: NHU CẦU ĐẶC BIỆT & CẢNH BÁO DỊ ỨNG (UC-08) */}
          <section className="bg-white border-2 border-stone-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 transition-all hover:border-amber-400/60">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-800 border border-amber-500/30 flex items-center justify-center font-bold text-xs font-mono shrink-0">
                  03
                </span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-serif text-xl font-bold text-stone-900">
                      Ghi Chú Nhu Cầu Đặc Biệt & Dị Ứng (Special Requests & Dietary)
                    </h2>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-300">
                      Đồng bộ Tablet Lễ tân & KDS Bếp
                    </span>
                  </div>
                  <p className="text-xs text-stone-500">
                    Mục đích tiệc, ghế em bé (high-chair), nến thơm và lưu ý dị ứng không tiêu / không cay cho Bếp trưởng
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowSection3(!showSection3)}
                className="w-8 h-8 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-200 cursor-pointer transition-colors shrink-0"
              >
                {showSection3 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            <AnimatePresence>
              {showSection3 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-7 overflow-hidden"
                >
                  {/* Subsection 1: Occasions / Party Purpose */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>1. Mục đích tiệc & Dịp dùng bữa:</span>
                      </span>
                      <span className="text-[10px] text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        Hỗ trợ setup riêng
                      </span>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {/* Occasion Cards */}
                  <div className="space-y-2.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#6B5E54] flex items-center justify-between">
                      <span>Dịp dùng bữa của quý khách:</span>
                      <span className="text-[10px] text-[#8C6A43] font-semibold bg-[#FAF4EB] px-2 py-0.5 rounded-md border border-[#E8DFD1]">
                        Gợi ý • Không bắt buộc
                      </span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {OCCASIONS.map((occ) => {
                        const Icon = occ.icon;
                        const isSelected = selectedOccasion === occ.id;
                        return (
                          <button
                            key={occ.id}
                            type="button"
                            onClick={() => {
                              setSelectedOccasion(selectedOccasion === occ.id ? null : occ.id);
                              if (occ.id === 'date' || occ.id === 'anniversary') {
                                setCandleSetup(true);
                              }
                            }}
                            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            onClick={() => setSelectedOccasion(selectedOccasion === occ.id ? null : occ.id)}
                            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                              isSelected
                                ? 'bg-[#FAF4EB] border-[#C4A480] text-[#8C6A43] font-bold ring-2 ring-[#C4A480]/20 shadow-2xs'
                                : 'bg-[#FAF7F2] border-[#E8DFD1] text-[#2C221E] hover:bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[#8C6A43]' : 'text-[#78716C]'}`} />
                              <span className="text-xs truncate">{occ.label}</span>
                            </div>
                            {isSelected && (
                              <span className="text-[10px] font-bold text-[#8C6A43] shrink-0">✓</span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Birthday Name field if birthday selected */}
                    {selectedOccasion === 'birthday' && (
                      <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-300 flex items-center gap-3 animate-in fade-in duration-200">
                        <Cake className="w-5 h-5 text-amber-600 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <label className="text-[11px] font-bold text-amber-900 block mb-1">
                            Tên người sinh nhật (Nhà hàng chuẩn bị chữ trên bánh & nhạc chúc mừng):
                          </label>
                          <input
                            type="text"
                            value={birthdayName}
                            onChange={(e) => setBirthdayName(e.target.value)}
                            placeholder="Ví dụ: Hoàng Anh (Sinh nhật lần thứ 25)"
                            className="w-full bg-white border border-amber-300 rounded-xl px-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Subsection 2: Table Setup & Special Facilities (Baby High-Chair, Candle Setup) */}
                  <div className="space-y-3 pt-1 border-t border-stone-200">
                    <label className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Baby className="w-3.5 h-3.5 text-amber-600" />
                        <span>2. Yêu cầu bổ sung tại bàn (Ghế em bé & Nến thơm):</span>
                      </span>
                      <span className="text-[10px] text-stone-400">Chuẩn bị trước khi vào bàn</span>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* Baby Chair Counter */}
                      <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 hover:border-amber-400 transition-all flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            babyChairCount > 0 ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-white text-stone-500 border border-stone-200'
                          }`}>
                            <Baby className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-stone-900">Ghế Ăn Trẻ Em (Baby High-chair)</p>
                            <p className="text-[10px] text-stone-500">Khử khuẩn sẵn sàng cho bé nhỏ</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-xl border border-stone-200 shrink-0">
                          <button
                            type="button"
                            onClick={() => setBabyChairCount((c) => Math.max(0, c - 1))}
                            disabled={babyChairCount <= 0}
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-stone-600 hover:bg-stone-100 disabled:opacity-40 cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-mono text-xs font-bold text-stone-900 w-5 text-center">
                            {babyChairCount}
                          </span>
                          <button
                            type="button"
                            onClick={() => setBabyChairCount((c) => Math.min(4, c + 1))}
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-amber-700 hover:bg-amber-50 cursor-pointer font-bold"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Candle Setup Toggle */}
                      <div
                        onClick={() => setCandleSetup(!candleSetup)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          candleSetup
                            ? 'bg-amber-50/70 border-amber-400 ring-1 ring-amber-300'
                            : 'bg-stone-50 border-stone-200 hover:border-amber-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            candleSetup ? 'bg-amber-500 text-slate-950 shadow-xs' : 'bg-white text-stone-500 border border-stone-200'
                          }`}>
                            <Flame className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-stone-900">Setup Nến Thơm Lãng Mạn</p>
                            <p className="text-[10px] text-stone-500">Thắp nến tinh dầu hoa hồng Pháp</p>
                          </div>
                        </div>

                        <div className={`w-11 h-6 rounded-full transition-colors flex items-center px-1 shrink-0 ${
                          candleSetup ? 'bg-amber-600 justify-end' : 'bg-stone-300 justify-start'
                        }`}>
                          <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                        </div>
                      </div>
                    </div>

                    {/* Quick Facility Chips */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {FACILITY_TAGS.map((tag) => {
                  {/* Ghi chú thêm (Quick Chips & Freeform Text) */}
                  <div className="space-y-3 pt-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#6B5E54] flex items-center justify-between">
                      <span>Ghi chú thêm:</span>
                      <span className="text-[11px] text-[#78716C] font-normal">Tùy chọn</span>
                    </label>

                    {/* Quick Tags */}
                    <div className="flex flex-wrap gap-2">
                      {QUICK_TAGS.map((tag) => {
                        const isChecked = customNotes.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => handleQuickTagClick(tag)}
                            className={`text-xs px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                              isChecked
                                ? 'bg-[#8C6A43] text-white border-[#8C6A43] shadow-xs font-semibold'
                                : 'bg-stone-50 text-stone-700 border-stone-200 hover:border-amber-400 hover:bg-white'
                                ? 'bg-[#8C6A43] text-white border-[#8C6A43] shadow-2xs font-semibold'
                                : 'bg-[#FAF7F2] text-[#6B5E54] border-[#E8DFD1] hover:border-[#C4A480]'
                            }`}
                          >
                            <span>{tag}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Subsection 3: Dietary Restrictions & Allergies Alert (SYNC TO KDS KITCHEN) */}
                  <div className="space-y-3 pt-1 border-t border-stone-200">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-rose-600" />
                        <span>3. Cảnh Báo Dị Ứng & Chế Độ Ăn Uống (Gửi trực tiếp KDS Bếp):</span>
                      </label>
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                        🚨 Bếp trưởng tẩm ướp riêng
                      </span>
                    </div>

                    {/* Notice Callout */}
                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-50/80 via-amber-50/60 to-rose-50/80 border border-rose-200 text-xs text-rose-950 flex items-start gap-2.5 shadow-2xs">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <p className="text-[11px] leading-relaxed">
                        <strong>Lưu ý bảo đảm an toàn thực phẩm:</strong> Dữ liệu dị ứng này sẽ được đồng bộ tức thì lên <strong>Màn hình KDS nhà Bếp</strong> và in đậm trên <strong>phiếu order</strong> để Bếp trưởng kiểm soát chảo nấu riêng, khử khuẩn dụng cụ và tuyệt đối không rắc tiêu/ớt nếu bàn có em bé.
                      </p>
                    </div>

                    {/* Grid of Dietary Chips */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {DIETARY_OPTIONS.map((opt) => {
                        const isSelected = selectedDietaryTags.includes(opt.label);
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              setSelectedDietaryTags((prev) =>
                                prev.includes(opt.label)
                                  ? prev.filter((t) => t !== opt.label)
                                  : [...prev, opt.label]
                              );
                            }}
                            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                              isSelected
                                ? `${opt.color} ring-2 font-semibold shadow-xs`
                                : 'bg-stone-50 text-stone-700 border-stone-200 hover:border-stone-400 hover:bg-white'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold truncate">{opt.label}</span>
                                <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider shrink-0 bg-white/70 border border-current">
                                  {opt.badge}
                                </span>
                              </div>
                              <p className="text-[10px] text-stone-500 truncate mt-0.5">{opt.subtitle}</p>
                            </div>
                            <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border ${
                              isSelected ? 'bg-rose-600 text-white border-rose-600' : 'bg-white border-stone-300 text-transparent'
                            }`}>
                              ✓
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Subsection 4: Custom Notes Textarea */}
                  <div className="space-y-2 pt-1 border-t border-stone-200">
                    <label className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center justify-between">
                      <span>4. Ghi chú bổ sung tự do:</span>
                      <span className="text-[11px] text-stone-400">Tùy chọn</span>
                    </label>

                    {/* Freeform Notes Area */}
                    <div className="relative">
                      <FileText className="w-4 h-4 text-[#78716C] absolute left-3.5 top-3.5" />
                      <textarea
                        rows={3}
                        value={customNotes}
                        onChange={(e) => setCustomNotes(e.target.value)}
                        placeholder="Ví dụ: Có người già đi lại khó khăn xin xếp bàn sát lối đi, chuẩn bị bánh sinh nhật nến số 25..."
                        className="w-full bg-stone-50/70 border border-stone-300 rounded-2xl pl-10 pr-4 py-3 text-xs font-medium text-stone-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
                        placeholder="Ví dụ: Ưu tiên bàn nhìn góc phố đẹp, chuẩn bị thêm 1 đĩa bánh sinh nhật nhỏ tặng bạn gái..."
                        className="w-full bg-[#FAF7F2] border border-[#E8DFD1] rounded-2xl pl-10 pr-4 py-3 text-xs font-medium text-[#2C221E] focus:outline-none focus:border-[#C4A480]"
                      />
                    </div>
                    <p className="text-[11px] text-[#78716C] italic flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-[#C4A480] shrink-0" />
                      <span>Nhà hàng luôn lưu tâm từng yêu cầu và sẽ hướng dẫn quý khách tới bàn tương ứng ngay khi bước vào sảnh.</span>
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* STEP 4: THỰC ĐƠN SIGNATURE & RƯỢU VANG (PRE-ORDER - UC-07) */}
          <section className="bg-white border-2 border-stone-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5 transition-all hover:border-amber-400/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200">
          {/* STEP 3: PRE-ORDER SIGNATURE COMBOS & MENU (OPTIONAL EXPANDABLE) */}
          <section className="bg-white border border-[#E8DFD1] rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
            {/* Accordion / Header Trigger */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8DFD1]">
              <div className="flex items-start sm:items-center gap-3">
                <span className="w-7 h-7 rounded-xl bg-[#FAF4EB] text-[#8C6A43] border border-[#E8DFD1] flex items-center justify-center font-bold text-xs font-mono shrink-0 mt-0.5 sm:mt-0">
                  03
                </span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-serif text-xl font-bold text-stone-900">
                      Chọn Món Ăn Signature Đặt Trước (Pre-order Menu)
                    </h2>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                      Cộng dồn cọc • Bếp trưởng chuẩn bị công phu
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Cho phép chọn trước Bò Wagyu A5 (ủ nhiệt 45p), Decant rượu vang (thở 30p), Bánh kem sinh nhật viết tên riêng. Tiền cọc món ăn cộng dồn vào tổng hóa đơn cọc VietQR.
                    <h2 className="font-serif text-xl font-bold text-[#2C221E]">
                      Đặt Trước Món Ăn & Rượu Vang Signature
                    </h2>
                    <span className="text-[10px] font-bold text-[#8C6A43] bg-[#FAF4EB] px-2.5 py-0.5 rounded-full border border-[#E8DFD1]">
                      Tùy chọn • Không bắt buộc
                    </span>
                  </div>
                  <p className="text-xs text-[#78716C] mt-0.5">
                    Bếp trưởng chuẩn bị tẩm ướp & nướng nhiệt độ vàng, phục vụ ngay khi quý khách nhập tiệc.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                {Object.keys(selectedDishes).length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllDishes}
                    className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Xóa món đã chọn</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowPreOrderSection(!showPreOrderSection)}
                  className="w-8 h-8 rounded-full bg-[#FAF7F2] border border-[#E8DFD1] flex items-center justify-center text-[#6B5E54] hover:bg-[#FAF4EB] cursor-pointer transition-colors"
                  title={showPreOrderSection ? 'Thu gọn thực đơn' : 'Mở rộng thực đơn'}
                >
                  {showPreOrderSection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {showPreOrderSection && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-5 overflow-hidden"
                >
                  {/* Category Filter Tabs */}
                  <div className="flex flex-wrap items-center gap-2 p-1.5 bg-[#FAF7F2] rounded-2xl border border-[#E8DFD1]">
                    {[
                      { id: 'ALL', label: 'Tất Cả', icon: Utensils, count: SIGNATURE_DISHES.length },
                      { id: 'Set Menu & Combo', label: '🌟 Set Menu & Combo', icon: Sparkles, count: SIGNATURE_DISHES.filter(d => d.category === 'Set Menu & Combo').length },
                      { id: 'Bò Dry-Aged & Món Chính', label: '🥩 Bò Dry-Aged & Mains', icon: Flame, count: SIGNATURE_DISHES.filter(d => d.category === 'Bò Dry-Aged & Món Chính').length },
                      { id: 'Rượu Vang & Champagne', label: '🍷 Vang Grand Cru', icon: Wine, count: SIGNATURE_DISHES.filter(d => d.category === 'Rượu Vang & Champagne').length },
                      { id: 'Khai Vị & Tráng Miệng', label: '🍰 Khai Vị & Tráng Miệng', icon: Award, count: SIGNATURE_DISHES.filter(d => d.category === 'Khai Vị & Tráng Miệng').length },
                    ].map((cat) => {
                      const isSelected = selectedMenuCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setSelectedMenuCategory(cat.id)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-[#8C6A43] text-white shadow-xs font-bold ring-2 ring-[#8C6A43]/20'
                              : 'bg-white text-[#6B5E54] hover:text-[#2C221E] hover:bg-[#FAF4EB] border border-[#E8DFD1]/80'
                          }`}
                        >
                          <span>{cat.label}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold leading-none ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-[#FAF4EB] text-[#8C6A43] border border-[#E8DFD1]'
                            }`}
                          >
                            {cat.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Dishes Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {SIGNATURE_DISHES
                      .filter((dish) => selectedMenuCategory === 'ALL' || dish.category === selectedMenuCategory)
                      .map((dish) => {
                        const qty = selectedDishes[dish.id] || 0;
                        const hasComboItems = Boolean(dish.comboItems && dish.comboItems.length > 0);
                        const isComboExpanded = Boolean(expandedComboIds[dish.id]);
                        const discountAmount = dish.originalPrice ? dish.originalPrice - dish.price : 0;

                        return (
                          <div
                            key={dish.id}
                            className={`p-4 rounded-2xl border transition-all flex flex-col justify-between relative overflow-hidden ${
                              qty > 0
                                ? 'bg-[#FAF4EB] border-[#C4A480] shadow-md ring-2 ring-[#C4A480]/30'
                                : 'bg-[#FAF7F2]/60 border-[#E8DFD1] hover:bg-white hover:border-[#C4A480]/60 hover:shadow-2xs'
                            }`}
                          >
                            <div>
                              <div className="flex gap-3.5">
                                {/* Dish Image */}
                                <div className="relative w-24 h-24 rounded-2xl overflow-hidden shrink-0 bg-stone-100 border border-stone-200">
                                  <img
                                    src={dish.image}
                                    alt={dish.name}
                                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                                    loading="lazy"
                                  />
                                  {dish.badge && (
                                    <div className="absolute top-1 left-1 bg-amber-500 text-slate-950 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md shadow-xs">
                                      {dish.badge}
                                    </div>
                                  )}
                                </div>

                                {/* Dish Info */}
                                <div className="flex-1 min-w-0 space-y-1">
                                  <div className="flex items-start justify-between gap-1">
                                    <h4 className="font-serif text-sm font-bold text-stone-900 leading-snug">
                                      {dish.name}
                                    </h4>
                                  </div>
                                  <p className="text-[11px] text-stone-500 line-clamp-2 leading-relaxed">
                                    {dish.description}
                                  </p>
                                  <div className="flex items-center gap-2 pt-0.5">
                                    <span className="font-serif text-sm font-bold text-amber-700">
                                      {new Intl.NumberFormat('vi-VN').format(dish.price)} đ
                                    </span>
                                    {dish.prepTimeMinutes && (
                                      <span className="text-[10px] text-stone-400 flex items-center gap-0.5">
                                        <Clock className="w-3 h-3 text-amber-600" /> Chuẩn bị {dish.prepTimeMinutes}p
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Combo courses preview if combo */}
                              {dish.comboItems && dish.comboItems.length > 0 && (
                                <div className="mt-3 pt-2.5 border-t border-stone-200 text-[11px]">
                                  <button
                                    type="button"
                                    onClick={() => toggleComboDetails(dish.id)}
                                    className="text-amber-800 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                                  >
                                    <span>{isExpanded ? 'Ẩn các món trong set' : 'Xem các món trong set menu'}</span>
                                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                  </button>
                                  {isExpanded && (
                                    <ul className="mt-1.5 space-y-0.5 text-stone-600 pl-3 list-disc">
                                      {dish.comboItems.map((item, idx) => (
                                        <li key={idx}>{item}</li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              )}

                              {/* Elaborate Preparation Options (UC-07) */}
                              {isSelected && (
                                <div className="mt-3 pt-2.5 border-t border-amber-200/70 bg-amber-50/60 -mx-4 p-3 space-y-2 rounded-xl">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-amber-950 flex items-center gap-1">
                                      <Sliders className="w-3 h-3 text-amber-600" />
                                      <span>Chuẩn Bị Công Phu (Pre-order Customization):</span>
                            {/* Top row: Badge & Image + Info */}
                            <div>
                              <div className="flex gap-3.5 items-start">
                                {/* Dish Image */}
                                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shrink-0 border border-[#E8DFD1] shadow-2xs">
                                  <img
                                    src={dish.image}
                                    alt={dish.name}
                                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                                  />
                                  {dish.badge && (
                                    <span className="absolute bottom-1 left-1 right-1 bg-[#1A1412]/80 backdrop-blur-xs text-[#EAD8C3] text-[9px] font-bold px-1.5 py-0.5 rounded-md text-center truncate border border-[#C4A480]/30">
                                      {dish.badge}
                                    </span>
                                  )}
                                </div>

                                {/* Title, Category & Serving Size */}
                                <div className="flex-1 min-w-0 space-y-1">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="text-[10px] font-bold text-[#8C6A43] uppercase tracking-wider">
                                      {dish.category}
                                    </span>
                                    {dish.prepTimeMinutes && (
                                      <span className="text-[10px] text-[#78716C] flex items-center gap-0.5">
                                        <Clock className="w-2.5 h-2.5 text-[#C4A480]" />
                                        {dish.prepTimeMinutes}p
                                      </span>
                                    )}
                                  </div>

                                  <h4 className="font-serif text-sm font-bold text-[#2C221E] leading-snug line-clamp-2">
                                    {dish.name}
                                  </h4>

                                  {dish.servingSize && (
                                    <p className="text-[10px] font-medium text-[#8C6A43] bg-[#FAF4EB] inline-block px-2 py-0.5 rounded-md border border-[#E8DFD1]">
                                      {dish.servingSize}
                                    </p>
                                  )}

                                  <p className="text-[11px] text-[#78716C] line-clamp-2 leading-relaxed">
                                    {dish.description}
                                  </p>
                                </div>
                              </div>

                              {/* Combo Items Preview if Applicable */}
                              {hasComboItems && (
                                <div className="mt-3 pt-2.5 border-t border-[#E8DFD1]/80">
                                  <button
                                    type="button"
                                    onClick={() => toggleComboDetails(dish.id)}
                                    className="text-[11px] font-bold text-[#8C6A43] hover:text-[#2C221E] flex items-center justify-between w-full cursor-pointer py-0.5"
                                  >
                                    <span className="flex items-center gap-1">
                                      <Sparkles className="w-3 h-3 text-[#C4A480]" />
                                      <span>Xem thực đơn set gồm {dish.comboItems?.length} món</span>
                                    </span>
                                    <span className="text-[10px] font-mono">
                                      {isComboExpanded ? '▲ Thu gọn' : '▼ Chi tiết'}
                                    </span>
                                  </button>

                                  {isComboExpanded && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      className="space-y-1 mt-2 bg-white/80 p-2.5 rounded-xl border border-[#E8DFD1]"
                                    >
                                      {dish.comboItems?.map((item, idx) => (
                                        <div key={idx} className="flex items-start gap-1.5 text-[10px] text-[#594D43]">
                                          <Check className="w-3 h-3 text-[#16A34A] shrink-0 mt-0.5" />
                                          <span>{item}</span>
                                        </div>
                                      ))}
                                    </motion.div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Bottom Row: Price & Quantity Stepper */}
                            <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#E8DFD1]/80">
                              <div>
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-sm sm:text-base font-mono font-bold text-[#8C6A43]">
                                    {new Intl.NumberFormat('vi-VN').format(dish.price)} đ
                                  </span>
                                  {dish.originalPrice && (
                                    <span className="text-[11px] font-mono text-[#A8A199] line-through">
                                      {new Intl.NumberFormat('vi-VN').format(dish.originalPrice)} đ
                                    </span>
                                    <span className="text-[9px] text-amber-800 bg-amber-200/50 px-1.5 py-0.5 rounded font-bold">
                                      Bếp trưởng Le Prime
                                    </span>
                                  </div>

                                  {/* Wagyu / Steak Doneness & 45-min heat hold */}
                                  {(dish.id === 'dish-1' || dish.category.includes('Bò') || dish.id.includes('dish')) && (
                                    <div className="space-y-1">
                                      <span className="text-[10px] text-stone-600 font-medium">Độ chín Steak (Ủ nhiệt Sous-vide 45 phút):</span>
                                      <div className="flex flex-wrap gap-1">
                                        {['Medium-Rare (Khuyên dùng)', 'Rare (Tái)', 'Medium (Vừa)', 'Well-Done'].map((opt) => {
                                          const key = opt.split(' ')[0];
                                          const isCurrent = (dishNotes[dish.id] || '').includes(key);
                                          return (
                                            <button
                                              key={opt}
                                              type="button"
                                              onClick={() => handleUpdateDishNote(dish.id, `Độ chín: ${opt}, Ủ nhiệt 45 phút Sous-vide & áp chảo gang`)}
                                              className={`px-2 py-0.5 rounded-lg text-[9px] font-semibold transition-all cursor-pointer ${
                                                isCurrent
                                                  ? 'bg-amber-600 text-white shadow-xs'
                                                  : 'bg-white text-stone-700 border border-stone-200 hover:border-amber-400'
                                              }`}
                                            >
                                              {opt}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  {/* Fine Wine Decanting */}
                                  {(dish.id === 'wine-1' || dish.category.includes('Vang') || dish.id.includes('wine')) && (
                                    <div className="space-y-1">
                                      <span className="text-[10px] text-stone-600 font-medium">Chiết thở bình Decanter pha lê & ướp nhiệt:</span>
                                      <div className="flex flex-wrap gap-1">
                                        {['Decant thở 30 phút (Khuyên dùng)', 'Decant thở 45 phút', 'Mở tại bàn', 'Ướp xô đá (16°C)'].map((opt) => {
                                          const key = opt.split(' ')[0];
                                          const isCurrent = (dishNotes[dish.id] || '').includes(key);
                                          return (
                                            <button
                                              key={opt}
                                              type="button"
                                              onClick={() => handleUpdateDishNote(dish.id, `Chiết thở vang: ${opt}`)}
                                              className={`px-2 py-0.5 rounded-lg text-[9px] font-semibold transition-all cursor-pointer ${
                                                isCurrent
                                                  ? 'bg-amber-600 text-white shadow-xs'
                                                  : 'bg-white text-stone-700 border border-stone-200 hover:border-amber-400'
                                              }`}
                                            >
                                              {opt}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  {/* Birthday Cake Lettering */}
                                  {(dish.id === 'cake-1' || dish.name.includes('Bánh Kem') || dish.name.includes('Sinh Nhật')) && (
                                    <div className="space-y-1">
                                      <span className="text-[10px] text-stone-600 font-medium flex items-center gap-1">
                                        <Cake className="w-3 h-3 text-amber-600" />
                                        <span>Thông điệp viết chữ trên bánh & nến sinh nhật:</span>
                                      </span>
                                      <input
                                        type="text"
                                        value={dishNotes[dish.id] || ''}
                                        onChange={(e) => handleUpdateDishNote(dish.id, e.target.value)}
                                        placeholder="VD: Chúc Mừng Sinh Nhật Minh Anh 26th (Cắm nến số 26)"
                                        className="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-1 text-[10px] text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-600"
                                      />
                                    </div>
                                  )}

                                  {/* General custom note */}
                                  {dish.id !== 'cake-1' && !dish.name.includes('Bánh Kem') && (
                                    <div className="pt-0.5">
                                      <input
                                        type="text"
                                        value={dishNotes[dish.id] || ''}
                                        onChange={(e) => handleUpdateDishNote(dish.id, e.target.value)}
                                        placeholder="Ghi chú thêm: gia vị, dị ứng, thời gian lên món..."
                                        className="w-full bg-white/90 border border-stone-200 rounded-lg px-2.5 py-1 text-[10px] text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-500"
                                      />
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Stepper Footer */}
                            <div className="mt-3 pt-3 border-t border-stone-200 flex items-center justify-between">
                              <span className="text-[10px] text-stone-500">
                                {isSelected ? (
                                  <strong className="text-amber-700 font-mono">
                                    Cọc món: {new Intl.NumberFormat('vi-VN').format(dish.price * qty)} đ
                                  </strong>
                                ) : (
                                  <span>Thêm vào tiệc</span>
                                )}
                              </span>

                              <div className="flex items-center gap-2 bg-stone-100 p-1 rounded-xl border border-stone-200">
                                {qty > 0 ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleDishQuantityChange(dish.id, -1)}
                                      className="w-6 h-6 rounded-lg bg-white hover:bg-stone-50 text-stone-800 text-xs font-bold flex items-center justify-center cursor-pointer shadow-xs"
                                    >
                                      <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="font-mono font-bold text-xs text-stone-900 min-w-6 text-center">
                                      {qty}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleDishQuantityChange(dish.id, 1)}
                                      className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 text-xs font-bold flex items-center justify-center cursor-pointer shadow-xs"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleDishQuantityChange(dish.id, 1)}
                                    className="px-3 py-1 rounded-lg bg-white hover:bg-amber-50 text-stone-800 hover:text-amber-900 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                                  >
                                    <Plus className="w-3 h-3 text-amber-600" />
                                    <span>Chọn món</span>
                                  </button>
                                )}
                                {discountAmount > 0 && (
                                  <span className="text-[9px] font-semibold text-emerald-700 flex items-center gap-0.5">
                                    <Tag className="w-2.5 h-2.5" />
                                    Tiết kiệm {new Intl.NumberFormat('vi-VN').format(discountAmount)} đ
                                  </span>
                                )}
                              </div>

                              {/* Stepper Buttons */}
                              <div className="flex items-center gap-2 bg-white px-2 py-1.5 rounded-xl border border-[#E8DFD1] shadow-2xs">
                                <button
                                  type="button"
                                  onClick={() => handleDishQuantityChange(dish.id, -1)}
                                  disabled={qty === 0}
                                  className="w-6 h-6 rounded-lg flex items-center justify-center text-[#6B5E54] hover:bg-[#FAF7F2] disabled:opacity-25 disabled:hover:bg-transparent cursor-pointer transition-colors"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="text-xs font-bold font-mono w-5 text-center text-[#2C221E]">
                                  {qty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleDishQuantityChange(dish.id, 1)}
                                  className="w-6 h-6 rounded-lg flex items-center justify-center text-[#8C6A43] hover:bg-[#FAF4EB] bg-[#FAF7F2] border border-[#E8DFD1] cursor-pointer transition-colors"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* Summary Cart Pill with Deposit Accumulation Breakdown (UC-07) */}
                  {Object.keys(selectedDishes).length > 0 && (
                    <div className="p-4 bg-gradient-to-r from-amber-500/10 via-amber-50 to-amber-500/10 rounded-2xl border border-amber-300 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-amber-950 shadow-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
                          <ShoppingBag className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-stone-900 text-sm">
                            Đã chọn {Object.values(selectedDishes).reduce((a, b) => a + b, 0)} phần món đặc biệt chuẩn bị trước
                  {/* Pre-order Selected Dishes Summary Banner */}
                  {Object.keys(selectedDishes).length > 0 && (
                    <div className="p-4 bg-gradient-to-r from-[#FAF4EB] via-[#F5ECE0] to-[#FAF4EB] border border-[#C4A480] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#8C6A43] text-white flex items-center justify-center shrink-0 shadow-xs">
                          <ShoppingBag className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#2C221E]">
                            Đã chọn {Object.values(selectedDishes).reduce((a, b) => a + b, 0)} phần món đặt trước
                          </p>
                          <p className="text-[11px] text-[#78716C]">
                            Tiền cọc món (100%): <strong className="text-[#8C6A43] font-mono">{new Intl.NumberFormat('vi-VN').format(dishesTotal)} đ</strong> (Cọc 100% để Bếp trưởng tẩm ướp & lên lửa trước khi khách đến)
                          </p>
                          <div className="text-[11px] text-stone-600 flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                            <span>Cọc bàn: <strong className="text-stone-900 font-mono">{new Intl.NumberFormat('vi-VN').format(depositRequired)} đ</strong></span>
                            <span>+</span>
                            <span>Cọc món Signature: <strong className="text-amber-800 font-mono">{new Intl.NumberFormat('vi-VN').format(dishesTotal)} đ</strong></span>
                            <span>=</span>
                            <span className="text-amber-900 font-bold bg-amber-200/60 px-2 py-0.5 rounded-md font-mono">
                              Tổng cọc VietQR: {new Intl.NumberFormat('vi-VN').format(grandTotal)} đ
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-end md:self-auto">
                        <span className="text-[11px] font-bold text-amber-900 bg-white px-3 py-1.5 rounded-xl border border-amber-300 shadow-xs flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                          <span>Cộng Dồn Vào Hóa Đơn Cọc</span>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-[#8C6A43] font-medium bg-white px-2.5 py-1 rounded-lg border border-[#E8DFD1]">
                          ✨ Bếp Trưởng Lên Lửa Chuẩn Bị
                        </span>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* STEP 4: RESTAURANT POLICIES & TERMS */}
          <section className="bg-white border border-[#E8DFD1] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8DFD1]">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-xl bg-[#FAF4EB] text-[#8C6A43] border border-[#E8DFD1] flex items-center justify-center font-bold text-xs font-mono shrink-0">
                  04
                </span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-serif text-xl font-bold text-[#2C221E]">
                      Quy Định & Chính Sách Đặt Bàn Online
                    </h2>
                    <span className="text-[10px] font-bold text-[#16A34A] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Giữ bàn 30p • Hoàn cọc linh hoạt
                    </span>
                  </div>
                  <p className="text-xs text-[#78716C]">
                    Các quy chuẩn phục vụ, thời gian giữ bàn 30 phút và chính sách cọc món ăn tại LE PRIME BISTRO
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowSection4(!showSection4)}
                className="w-8 h-8 rounded-full bg-[#FAF7F2] border border-[#E8DFD1] flex items-center justify-center text-[#6B5E54] hover:bg-[#FAF4EB] cursor-pointer transition-colors shrink-0"
                title={showSection4 ? 'Thu gọn quy định' : 'Mở rộng quy định'}
              >
                {showSection4 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            <AnimatePresence>
              {showSection4 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-6 overflow-hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Policy 0: Số lượng khách tối thiểu */}
                    <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#C4A480]/60 space-y-2 md:col-span-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#8C6A43] text-white flex items-center justify-center shadow-2xs shrink-0">
                          <Users className="w-4 h-4" />
                        </div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-xs text-[#2C221E]">Số Lượng Khách: Chỉ Nhận Từ 2 Khách Trở Lên</h4>
                          <span className="text-[10px] font-bold text-[#8C6A43] bg-white px-2 py-0.5 rounded-md border border-[#E8DFD1]">
                            Quy chuẩn phục vụ
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-[#78716C] leading-relaxed">
                        Hệ thống đặt bàn trực tuyến <strong>chỉ áp dụng nhận đặt chỗ cho nhóm từ 2 khách trở lên</strong> nhằm chuẩn bị trọn vẹn không gian bài trí tiêu chuẩn và set up bàn tiệc fine dining chu đáo nhất. Quý khách đi một mình (solo dining) vui lòng liên hệ Hotline trực tiếp để nhà hàng ưu tiên hỗ trợ sắp xếp vị trí tại quầy Bar Lounge.
                      </p>
                    </div>

                    {/* Policy 1: Thời gian giữ bàn */}
                    <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#E8DFD1] space-y-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-white border border-[#E8DFD1] flex items-center justify-center shadow-2xs shrink-0">
                          <Clock className="w-4 h-4 text-[#8C6A43]" />
                        </div>
                        <h4 className="font-bold text-xs text-[#2C221E]">Thời Gian Giữ Bàn (30 Phút)</h4>
                      </div>
                      <p className="text-[11px] text-[#78716C] leading-relaxed">
                        Nhà hàng cam kết ưu tiên giữ bàn tối đa <strong>30 phút</strong> so với giờ hẹn đã đặt. Quý khách vui lòng gọi Hotline thông báo trước nếu đến muộn để nhà hàng bảo lưu vị trí bàn đẹp nhất.
                      </p>
                    </div>

                    {/* Policy 2: Chính sách hoàn cọc phân tầng chống đặt ảo */}
                    <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#E8DFD1] space-y-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-white border border-[#E8DFD1] flex items-center justify-center shadow-2xs shrink-0">
                          <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
                        </div>
                        <h4 className="font-bold text-xs text-[#2C221E]">Chính Sách Cọc Bàn & Cọc Món (100%)</h4>
                      </div>
                      <div className="text-[11px] text-[#594D43] space-y-1 leading-relaxed">
                        <p>• <strong>Cọc món đặt trước (100%):</strong> Do món ăn & bò Dry-Aged được Bếp trưởng chế biến trước giờ hẹn, quý khách cần cọc 100% tiền món để tránh hủy đơn gây lãng phí nguyên liệu.</p>
                        <p>• <strong>Hủy trước 24 giờ:</strong> Hoàn trả <strong>100%</strong> toàn bộ tiền cọc (bàn + món đặt trước).</p>
                        <p>• <strong>Hủy từ 6h – 24h:</strong> Hoàn trả <strong>50%</strong> tiền cọc (khấu trừ 50% chi phí chuẩn bị và giữ chỗ bàn).</p>
                        <p>• <strong>Hủy dưới 6h / Vắng mặt:</strong> <strong>Không hoàn cọc</strong> (bù đắp chi phí món đã chế biến & slot bàn).</p>
                      </div>
                    </div>

                    {/* Policy 3: Trang phục */}
                    <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#E8DFD1] space-y-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-white border border-[#E8DFD1] flex items-center justify-center shadow-2xs shrink-0">
                          <Shirt className="w-4 h-4 text-[#8C6A43]" />
                        </div>
                        <h4 className="font-bold text-xs text-[#2C221E]">Quy Chuẩn Trang Phục (Dress Code)</h4>
                      </div>
                      <p className="text-[11px] text-[#78716C] leading-relaxed">
                        Khuyến khích phong cách <strong>Smart Casual / Lịch sự</strong> (quần dài, áo sơ mi/polo hoặc đầm dạ tiệc thanh lịch; hạn chế áo ba lỗ và dép xỏ ngón).
                      </p>
                    </div>

                    {/* Policy 4: Rượu ngoài & Bánh kem */}
                    <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#E8DFD1] space-y-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-white border border-[#E8DFD1] flex items-center justify-center shadow-2xs shrink-0">
                          <Wine className="w-4 h-4 text-[#8C6A43]" />
                        </div>
                        <h4 className="font-bold text-xs text-[#2C221E]">Đồ Uống Mang Ngoài & Món Đặt Trước</h4>
                      </div>
                      <p className="text-[11px] text-[#78716C] leading-relaxed">
                        Món bò Dry-Aged & Set Menu được bếp trưởng chuẩn bị trước 4 tiếng. Miễn phí giữ lạnh & phục vụ bánh kem sinh nhật; áp dụng phí mở rượu ngoài theo menu.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-[#FAF4EB] border border-[#E8DFD1] rounded-2xl flex items-center gap-3 text-xs text-[#6B5E54]">
                    <Info className="w-4 h-4 text-[#8C6A43] shrink-0" />
                    <span>
                      Sau khi quét mã VietQR và đặt cọc thành công, tin nhắn SMS & mã đặt chỗ sẽ được gửi tự động đến quý khách.
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>

        {/* RIGHT COLUMN (5 COLS): STICKY BOOKING SUMMARY & CONTACT FORM */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
          <div className="bg-white border-2 border-[#C4A480]/60 rounded-3xl p-6 space-y-6 shadow-xl relative overflow-hidden">
            {/* Header */}
            <div className="pb-4 border-b border-[#E8DFD1]">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8C6A43] block">
                Thông Tin Xác Nhận Đặt Bàn
              </span>
              <h3 className="font-serif text-2xl font-bold text-[#2C221E] mt-0.5">
                Tóm Tắt Đặt Chỗ
              </h3>
            </div>

            {/* Selected Summary Card */}
            <div className="bg-[#FAF7F2] rounded-2xl p-4 border border-[#E8DFD1] space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#78716C] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#C4A480]" />
                  <span>Ngày hẹn:</span>
                </span>
                <span className="font-bold text-[#2C221E]">{selectedDate}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-[#78716C] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#C4A480]" />
                  <span>Khung giờ:</span>
                </span>
                <span className="font-bold text-[#2C221E]">{effectiveTimeSlot}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-[#78716C] flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#C4A480]" />
                  <span>Số lượng:</span>
                </span>
                <span className="font-bold text-[#2C221E]">{partySize} Khách</span>
              </div>

              {selectedTable && (
                <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-950 via-amber-900/60 to-amber-950 border border-amber-500/40 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                      <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                      <span>Giữ chỗ tạm thời (Redlock):</span>
                    </div>
                    <span className="font-mono font-black text-amber-300 text-xs bg-black/50 px-2 py-0.5 rounded border border-amber-500/30">
                      {formatCountdown(holdRemainingSeconds)}
                    </span>
                  </div>
                  <div className="w-full bg-stone-800 h-1 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min(100, Math.max(0, (holdRemainingSeconds / 300) * 100))}%` }}
                    />
                  </div>
                </div>
              )}

              {selectedOccasion && (
                <div className="flex items-center justify-between text-xs pt-2 border-t border-[#E8DFD1]">
                  <span className="text-[#78716C] flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-[#C4A480]" />
                    <span>Dịp đặc biệt:</span>
                  </span>
                  <span className="font-bold text-[#8C6A43]">
                    {OCCASIONS.find((o) => o.id === selectedOccasion)?.label}
                  </span>
                </div>
              )}

              {/* Pre-order summary (UC-07) */}
              {Object.keys(selectedDishes).length > 0 && (
                <div className="pt-2 border-t border-stone-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                      Món Signature Đặt Trước:
                    </span>
                    <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-mono">
                      {Object.values(selectedDishes).reduce((a, b) => a + b, 0)} phần
                    </span>
                  </div>
              {Object.keys(selectedDishes).length > 0 && (
                <div className="pt-2 border-t border-[#E8DFD1] space-y-1.5">
                  <span className="text-[10px] font-bold text-[#8C6A43] uppercase tracking-wider block">
                    Món ăn đặt trước:
                  </span>
                  {Object.entries(selectedDishes).map(([id, qty]) => {
                    const dish = SIGNATURE_DISHES.find((d) => d.id === id);
                    if (!dish) return null;
                    return (
                      <div key={id} className="space-y-0.5 text-[11px] pb-1 border-b border-stone-800/60 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between">
                          <span className="text-stone-300 truncate pr-2">
                            <strong className="text-amber-400 font-mono">{qty}x</strong> {dish.name}
                          </span>
                          <span className="font-mono text-stone-200 shrink-0">
                            {new Intl.NumberFormat('vi-VN').format(dish.price * qty)} đ
                          </span>
                        </div>
                        {dishNotes[id] && (
                          <p className="text-[10px] text-amber-300/80 italic pl-2 leading-tight">
                            ↳ {dishNotes[id]}
                          </p>
                        )}
                      <div key={id} className="flex items-center justify-between text-[11px]">
                        <span className="text-[#594D43] truncate pr-2">
                          <strong className="text-[#8C6A43] font-mono">{qty}x</strong> {dish.name}
                        </span>
                        <span className="font-mono text-[#2C221E] shrink-0 font-semibold">
                          {new Intl.NumberFormat('vi-VN').format(dish.price * qty)} đ
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Customer Inputs Form */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-[#6B5E54] block">
                Thông tin người đặt:
              </label>

              <div className="relative">
                <User className="w-4 h-4 text-[#78716C] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Họ và tên quý khách *"
                  className="w-full bg-[#FAF7F2] border border-[#E8DFD1] rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-semibold text-[#2C221E] focus:outline-none focus:border-[#C4A480]"
                />
              </div>

              <div className="relative">
                <Phone className="w-4 h-4 text-[#78716C] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Số điện thoại nhận mã QR *"
                  className="w-full bg-[#FAF7F2] border border-[#E8DFD1] rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-semibold text-[#2C221E] focus:outline-none focus:border-[#C4A480]"
                />
              </div>

              <div className="relative">
                <Mail className="w-4 h-4 text-[#78716C] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="Email nhận xác nhận (tùy chọn)"
                  className="w-full bg-[#FAF7F2] border border-[#E8DFD1] rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-semibold text-[#2C221E] focus:outline-none focus:border-[#C4A480]"
                />
              </div>
            </div>

            {/* Financial Breakdown (UC-07 Cọc Bàn + Cọc Món Ăn) */}
            <div className="space-y-2 pt-3 border-t border-stone-800 text-xs">
              <div className="flex justify-between items-center text-stone-300">
                <span>Tiền cọc giữ bàn:</span>
                <span className="font-bold text-white font-mono">
                  {new Intl.NumberFormat('vi-VN').format(depositRequired)} đ
            {/* Financial Breakdown */}
            <div className="space-y-2 pt-4 border-t border-[#E8DFD1] text-xs">
              <div className="flex justify-between items-center text-[#6B5E54]">
                <span>Tiền cọc giữ bàn (Le Prime):</span>
                <span className="font-bold text-[#2C221E]">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(depositRequired)}
                </span>
              </div>

              {dishesTotal > 0 && (
                <div className="flex justify-between items-center text-amber-300">
                  <span>Tiền cọc món ăn Signature:</span>
                  <span className="font-bold text-amber-300 font-mono">
                    +{new Intl.NumberFormat('vi-VN').format(dishesTotal)} đ
                <div className="flex justify-between items-center text-[#6B5E54]">
                  <span>Tiền cọc món ăn đặt trước (100%):</span>
                  <span className="font-bold text-[#8C6A43] font-mono">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(dishesTotal)}
                  </span>
                </div>
              )}

              {/* Grand Total Box */}
              <div className="p-4 bg-gradient-to-r from-amber-950/80 to-amber-900/60 rounded-2xl border border-amber-500/40 flex justify-between items-center text-xs font-bold pt-3 shadow-md">
                <div>
                  <span className="text-amber-200 block">Tổng Cọc VietQR:</span>
                  <span className="text-[10px] text-stone-400 font-normal">Đã cộng dồn món đặt trước</span>
                </div>
                <span className="font-serif text-lg font-black text-amber-300">
              <div className="p-3.5 bg-[#FAF4EB] rounded-2xl border border-[#E8DFD1] flex justify-between items-center text-xs font-bold pt-2.5">
                <span className="text-[#2C221E]">Tổng Tiền Cọc Thanh Toán (VietQR):</span>
                <span className="font-serif text-base text-[#8C6A43]">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(grandTotal)}
                </span>
              </div>
            </div>

            {/* Submit Action Button */}
            <button
              onClick={handleOpenDepositModal}
              disabled={isSubmitting}
              className="w-full py-4 bg-gradient-to-r from-[#C4A480] to-[#B3936F] hover:brightness-105 text-white text-xs font-bold rounded-2xl flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-98 disabled:opacity-60"
            >
              <span>{isSubmitting ? 'Đang gửi yêu cầu tới máy chủ...' : 'Xác Nhận Đặt Bàn & Giữ Chỗ VietQR'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-[11px] text-[#78716C] text-center space-y-1">
              <p className="flex items-center justify-center gap-1 text-[#3D7058] font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Hoàn cọc 100% nếu hủy trước 24 giờ</span>
              </p>
              <p>Mã đặt chỗ và hướng dẫn sẽ được gửi qua tin nhắn / Zalo.</p>
            </div>
          </div>
        </div>
      </div>

      {/* VietQR Payment Modal */}
      <QRPaymentModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        booking={currentBooking}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* UC-12: Vé Điện Tử Dynamic QR Code Check-in */}
      <ETicketModal
        isOpen={isETicketOpen}
        onClose={() => setIsETicketOpen(false)}
        bookingIdOrCode={backendBookingUUID || bookingSuccess?.bookingId}
        initialBookingDetails={bookingSuccess}
      />
    </div>
  );
};

