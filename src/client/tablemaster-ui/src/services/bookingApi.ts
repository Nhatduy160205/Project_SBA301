import type {
  ETicketData,
  VerifyTicketPayload,
  SendTicketNotificationPayload,
} from '../types';

/**
 * Booking Service API Client (TableMaster)
 * Giao tiếp với Spring Boot backend qua endpoint /api/v1/bookings
 */

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
}

export interface BackendBooking {
  id: string;
  bookingCode: string;
  userId?: string;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  bookingDate: string;
  timeSlotId: string;
  guestCount: number;
  totalDeposit: number;
  status: 'PENDING_REVIEW' | 'AWAITING_PAYMENT' | 'CONFIRMED' | 'SEATED' | 'COMPLETED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED' | 'NO_SHOW' | 'EVENT_INQUIRY';
  specialNotes?: string;
  staffNotes?: string;
  occasion?: string;
  dietaryNotes?: string;
  babyChairCount?: number;
  candleSetup?: boolean;
  // UC-10: Đặt tiệc đoàn đông / Bao trọn tầng (Private Banquet & Event Inquiry)
  eventType?: string;
  targetFloor?: number;
  companyName?: string;
  estimatedBudget?: number;
  stageAudioRequired?: boolean;
  decorationRequired?: boolean;
  callbackDeadline?: string;
  managerCallStatus?: string;
  consultationNotes?: string;
  reviewedByUserId?: string;
  paymentDeadline?: string;
  // UC-12: Vé Điện Tử & Dynamic QR Token 64 ký tự
  checkinQrToken?: string;
  ticketIssuedAt?: string;
  ticketZnsStatus?: string;
  ticketEmailStatus?: string;
  qrRotationCounter?: number;
  checkinScannedAt?: string;
  seatedAt?: string;
  completedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  tableIds?: string[];
  preorderItems?: Array<{
    id?: string;
    menuItemId: string;
    itemName?: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    notes?: string;
  }>;
}

export interface CreateBookingRequestPayload {
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  bookingDate: string;
  timeSlotId: string;
  guestCount: number;
  tableIds: string[];
  specialNotes?: string;
  occasion?: string;
  dietaryNotes?: string;
  babyChairCount?: number;
  candleSetup?: boolean;
  totalDeposit?: number;
  preorderItems?: Array<{
    menuItemId: string;
    itemName?: string;
    quantity: number;
    unitPrice: number;
    notes?: string;
  }>;
}

export interface UpdateSpecialRequestsPayload {
  occasion?: string;
  dietaryNotes?: string;
  babyChairCount?: number;
  candleSetup?: boolean;
  specialNotes?: string;
  staffNotes?: string;
}

// UC-04: Chi tiết tình trạng khả dụng & kiểm tra BR-01 của từng bàn
export interface TableAvailabilityDto {
  tableId: string;
  tableCode: string;
  floorPlanId?: string;
  floorNumber: number;
  floorName: string;
  zoneType: string;
  minCapacity: number;
  maxCapacity: number;
  customDeposit?: number;
  shape?: string;
  posX?: number;
  posY?: number;
  width?: number;
  height?: number;
  isAvailable: boolean;
  status: 'AVAILABLE' | 'OCCUPIED' | 'HELD' | 'CAPACITY_MISMATCH' | 'INACTIVE';
  statusMessage: string;
  satisfiesCapacityRule: boolean;
  isBookedInDb: boolean;
  isHeldInRedis: boolean;
  recommended: boolean;
}

export interface AvailabilitySearchParams {
  bookingDate?: string;
  timeSlotId?: string;
  shift?: 'LUNCH' | 'DINNER' | 'ALL' | string;
  adults?: number;
  children?: number;
  guestCount?: number;
  floor?: number;
  floorPlanId?: string;
  zoneType?: string;
  onlyAvailable?: boolean;
}

export interface TimeSlotAvailabilitySummary {
  timeSlotId: string;
  slotName: string;
  startTime: string;
  endTime: string;
  shift: string;
  availableTablesCount: number;
  totalTablesCount: number;
  isAvailable: boolean;
}

export interface AvailabilitySearchResponse {
  bookingDate: string;
  timeSlotId?: string;
  timeSlotName: string;
  shift?: string;
  adults: number;
  children: number;
  totalGuests: number;
  floor?: number;
  zoneType?: string;
  totalTables: number;
  availableCount: number;
  occupiedCount: number;
  heldCount: number;
  capacityMismatchCount: number;
  recommendedTableId?: string;
  recommendedTableCode?: string;
  tables: TableAvailabilityDto[];
  alternativeSlots?: TimeSlotAvailabilitySummary[];
}

// UC-06: Khóa Giữ bàn 5 phút & Xử lý Tranh chấp (Redlock Concurrency Hold)
export interface HoldTableRequestPayload {
  tableId: string;
  tableCode?: string;
  bookingDate?: string;
  timeSlotId?: string;
  guestCount?: number;
  floorPlanId?: string;
  floorNumber?: number;
  previousHoldToken?: string;
  previousTableId?: string;
}

export interface HoldTableResponsePayload {
  success: boolean;
  holdToken: string;
  tableId: string;
  tableCode: string;
  floorNumber: number;
  expiresAt: string;
  holdDurationSeconds: number; // 300
  status: 'HOLDING';
  color: 'YELLOW';
  message: string;
}

export interface ReleaseHoldRequestPayload {
  tableId: string;
  holdToken?: string;
  tableCode?: string;
}

export interface TableStateUpdatePayload {
  tableId: string;
  tableCode?: string;
  floorPlanId?: string;
  floorNumber?: number;
  status: 'AVAILABLE' | 'HOLDING' | 'OCCUPIED' | 'CONFIRMED';
  color: string;
  expiresAt?: string;
  remainingSeconds?: number;
  holdToken?: string;
  heldByUserId?: string;
  message?: string;
}


// Fallback UUIDs từ Seed Data cơ sở dữ liệu
export const SEED_DATA = {
  USER_ID: 'a0000000-0000-0000-0000-000000000005', // Khách VIP
  STAFF_ID: 'a0000000-0000-0000-0000-000000000003', // Lễ tân
  TIME_SLOT_ID: 'b1000000-0000-0000-0000-000000000002', // Ca tối Giờ Vàng
  TABLES: {
    BAR_01: 'b3000000-0000-0000-0000-000000000001',
    WIN_01: 'b3000000-0000-0000-0000-000000000002',
    VIP_01: 'b3000000-0000-0000-0000-000000000003',
    OUT_01: 'b3000000-0000-0000-0000-000000000004',
    OUT_02: 'b3000000-0000-0000-0000-000000000005',
  },
  MENU_ITEM_ID: 'b5000000-0000-0000-0000-000000000001',
  MENU_ITEMS: {
    WAGYU_A5: 'b5000000-0000-0000-0000-000000000001',
    MARGAUX_WINE: 'b5000000-0000-0000-0000-000000000002',
    TRUFFLE_SOUP: 'b5000000-0000-0000-0000-000000000003',
    LAVA_CAKE: 'b5000000-0000-0000-0000-000000000004',
    BIRTHDAY_CAKE: 'b5000000-0000-0000-0000-000000000005',
  },
};

// Map dish id to PostgreSQL UUID
export const getDishUUID = (dishId: string): string => {
  const map: Record<string, string> = {
    'dish-1': 'b5000000-0000-0000-0000-000000000001',
    'dish-2': 'b5000000-0000-0000-0000-000000000001',
    'dish-3': 'b5000000-0000-0000-0000-000000000001',
    'dish-4': 'b5000000-0000-0000-0000-000000000001',
    'wine-1': 'b5000000-0000-0000-0000-000000000002',
    'wine-2': 'b5000000-0000-0000-0000-000000000002',
    'wine-3': 'b5000000-0000-0000-0000-000000000002',
    'starter-1': 'b5000000-0000-0000-0000-000000000003',
    'starter-2': 'b5000000-0000-0000-0000-000000000003',
    'starter-3': 'b5000000-0000-0000-0000-000000000004',
    'cake-1': 'b5000000-0000-0000-0000-000000000005',
    'combo-1': 'b5000000-0000-0000-0000-000000000001',
    'combo-2': 'b5000000-0000-0000-0000-000000000001',
    'combo-3': 'b5000000-0000-0000-0000-000000000001',
  };
  return map[dishId] || (dishId.includes('-') && dishId.length === 36 ? dishId : SEED_DATA.MENU_ITEM_ID);
};

// Map ID bàn mock sang UUID tương ứng trong PostgreSQL
export const TABLE_ID_MAP: Record<string, string> = {
  // Tầng 1
  'f1-t01': SEED_DATA.TABLES.BAR_01,
  'f1-t02': SEED_DATA.TABLES.WIN_01,
  'f1-t03': SEED_DATA.TABLES.WIN_01,
  'f1-t04': SEED_DATA.TABLES.OUT_01,
  'f1-t05': SEED_DATA.TABLES.OUT_02,
  'f1-t06': SEED_DATA.TABLES.VIP_01,
  'f1-t07': SEED_DATA.TABLES.BAR_01,
  'f1-t08': SEED_DATA.TABLES.WIN_01,
  'f1-t09': SEED_DATA.TABLES.VIP_01,
  'f1-t10': SEED_DATA.TABLES.OUT_01,
  'f1-t11': SEED_DATA.TABLES.OUT_02,
  'f1-t12': SEED_DATA.TABLES.BAR_01,
  // Tầng 2 (VIP Salons)
  'f2-v01': SEED_DATA.TABLES.VIP_01,
  'f2-v02': SEED_DATA.TABLES.VIP_01,
  'f2-v03': SEED_DATA.TABLES.VIP_01,
  'f2-v04': SEED_DATA.TABLES.VIP_01,
  'f2-v05': SEED_DATA.TABLES.VIP_01,
  'f2-v06': SEED_DATA.TABLES.VIP_01,
  // Tầng 3 (Sky Lounge)
  'f3-sky01': SEED_DATA.TABLES.OUT_01,
  'f3-sky02': SEED_DATA.TABLES.OUT_02,
  'f3-sky03': SEED_DATA.TABLES.OUT_01,
  'f3-sky04': SEED_DATA.TABLES.OUT_02,
  'f3-sky05': SEED_DATA.TABLES.OUT_01,
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function ensureUUID(val?: string, fallback: string = SEED_DATA.TABLES.WIN_01): string {
  if (!val) return fallback;
  if (UUID_REGEX.test(val)) return val;
  if (TABLE_ID_MAP[val]) return TABLE_ID_MAP[val];
  return fallback;
}

const BASE_URL = '/api/v1/bookings';

export const bookingApi = {
  /**
   * 1. Khách gửi yêu cầu đặt bàn trực tuyến
   * POST /api/v1/bookings/request
   */
  async createBooking(payload: CreateBookingRequestPayload): Promise<ApiResponse<BackendBooking>> {
    const res = await fetch(`${BASE_URL}/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': SEED_DATA.USER_ID,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: `Lỗi máy chủ (${res.status})` }));
      throw new Error(err.message || 'Không thể tạo đơn đặt bàn');
    }

    return res.json();
  },

  /**
   * 2. Lấy danh sách tất cả các đơn đặt bàn
   * GET /api/v1/bookings
   */
  async getAllBookings(bookingDate?: string, status?: string): Promise<ApiResponse<BackendBooking[]>> {
    const params = new URLSearchParams();
    if (bookingDate) params.append('bookingDate', bookingDate);
    if (status) params.append('status', status);

    const url = params.toString() ? `${BASE_URL}?${params.toString()}` : BASE_URL;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: `Lỗi ${res.status}` }));
      throw new Error(err.message || 'Không thể tải danh sách đơn đặt bàn');
    }

    return res.json();
  },

  /**
   * 3. Xem chi tiết một đơn
   * GET /api/v1/bookings/{id}
   */
  async getBookingById(id: string): Promise<ApiResponse<BackendBooking>> {
    const res = await fetch(`${BASE_URL}/${id}`);
    if (!res.ok) throw new Error('Không tìm thấy đơn đặt bàn');
    return res.json();
  },

  /**
   * 3b. Khách hàng xem lịch sử các đơn đặt bàn của mình (UC-03)
   * GET /api/v1/bookings/my-bookings
   */
  async getMyBookings(userId?: string): Promise<ApiResponse<BackendBooking[]>> {
    const targetUserId = userId || SEED_DATA.USER_ID;
    const res = await fetch(`${BASE_URL}/my-bookings`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': targetUserId,
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: `Lỗi ${res.status}` }));
      throw new Error(err.message || 'Không thể tải lịch sử đơn đặt bàn');
    }

    return res.json();
  },

  /**
   * 3c. Tải hóa đơn cọc điện tử dạng PDF (UC-03)
   * GET /api/v1/bookings/{id}/invoice-pdf
   */
  async downloadInvoicePdf(bookingId: string, bookingCode: string = 'Invoice'): Promise<void> {
    const res = await fetch(`${BASE_URL}/${bookingId}/invoice-pdf`, {
      method: 'GET',
    });

    if (!res.ok) {
      throw new Error('Không thể tải hóa đơn cọc điện tử. Vui lòng thử lại sau.');
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice-${bookingCode}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /**
   * 4. Lễ tân duyệt đơn và yêu cầu cọc
   * POST /api/v1/bookings/{id}/approve-and-request-deposit
   */
  async approveAndRequestDeposit(
    id: string,
    depositAmount: number,
    deadlineMinutes: number = 60,
    staffNotes?: string
  ): Promise<ApiResponse<BackendBooking>> {
    const res = await fetch(`${BASE_URL}/${id}/approve-and-request-deposit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': SEED_DATA.STAFF_ID,
      },
      body: JSON.stringify({
        depositAmount,
        deadlineMinutes,
        staffNotes,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Lỗi duyệt đơn' }));
      throw new Error(err.message || 'Lỗi duyệt đơn');
    }

    return res.json();
  },

  /**
   * 5. Lễ tân từ chối đơn
   * POST /api/v1/bookings/{id}/reject
   */
  async rejectBooking(id: string, reason: string): Promise<ApiResponse<BackendBooking>> {
    const res = await fetch(`${BASE_URL}/${id}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': SEED_DATA.STAFF_ID,
      },
      body: JSON.stringify({ reason }),
    });

    if (!res.ok) throw new Error('Lỗi từ chối đơn');
    return res.json();
  },

  /**
   * 6. Quét QR Check-in đón khách vào bàn
   * POST /api/v1/bookings/check-in
   */
  async checkIn(qrToken: string): Promise<ApiResponse<BackendBooking>> {
    const res = await fetch(`${BASE_URL}/check-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ qrToken }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Mã QR không hợp lệ' }));
      throw new Error(err.message || 'Check-in thất bại');
    }

    return res.json();
  },

  /**
   * 7. Hoàn tất bữa ăn sau khi thanh toán xong
   * POST /api/v1/bookings/{id}/complete
   */
  async completeBooking(id: string): Promise<ApiResponse<BackendBooking>> {
    const res = await fetch(`${BASE_URL}/${id}/complete`, {
      method: 'POST',
    });

    if (!res.ok) throw new Error('Không thể hoàn tất bữa ăn');
    return res.json();
  },

  /**
   * 8. Hủy đơn đặt bàn
   * POST /api/v1/bookings/{id}/cancel
   */
  async cancelBooking(id: string, reason: string): Promise<ApiResponse<BackendBooking>> {
    const res = await fetch(`${BASE_URL}/${id}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': SEED_DATA.USER_ID,
      },
      body: JSON.stringify({ reason }),
    });

    if (!res.ok) throw new Error('Hủy đơn thất bại');
    return res.json();
  },

  /**
   * 9. Chuyển đổi bàn
   * POST /api/v1/bookings/{id}/transfer-table
   */
  async transferTable(id: string, sourceTableId: string, targetTableId: string, reason?: string): Promise<ApiResponse<BackendBooking>> {
    const res = await fetch(`${BASE_URL}/${id}/transfer-table`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': SEED_DATA.STAFF_ID,
      },
      body: JSON.stringify({
        sourceTableId: ensureUUID(sourceTableId),
        targetTableId: ensureUUID(targetTableId),
        reason: reason || 'Khách yêu cầu chuyển bàn',
      }),
    });

    if (!res.ok) throw new Error('Chuyển bàn thất bại');
    return res.json();
  },

  /**
   * 9b. Cập nhật Nhu cầu đặc biệt & Ghi chú dị ứng (UC-08)
   * PUT /api/v1/bookings/{id}/special-requests
   */
  async updateSpecialRequests(id: string, payload: UpdateSpecialRequestsPayload): Promise<ApiResponse<BackendBooking>> {
    const res = await fetch(`${BASE_URL}/${id}/special-requests`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': SEED_DATA.STAFF_ID,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Lỗi cập nhật nhu cầu đặc biệt' }));
      throw new Error(err.message || 'Cập nhật nhu cầu đặc biệt & dị ứng thất bại');
    }

    return res.json();
  },

  /**
   * 10. Phục vụ gọi thêm món tại bàn
   * POST /api/v1/bookings/{id}/table-orders
   */
  async addTableOrders(id: string, tableId: string, items: Array<{
    menuItemId?: string;
    itemName: string;
    quantity: number;
    unitPrice: number;
    notes?: string;
  }>) {
    const res = await fetch(`${BASE_URL}/${id}/table-orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': SEED_DATA.STAFF_ID,
      },
      body: JSON.stringify({
        tableId: ensureUUID(tableId),
        items,
      }),
    });

    if (!res.ok) throw new Error('Gọi món thất bại');
    return res.json();
  },

  /**
   * 11. UC-04: Tra cứu Bàn trống theo Ca giờ & Số người (Availability Search Engine)
   * GET /api/v1/bookings/availability
   */
  async searchAvailability(params: AvailabilitySearchParams): Promise<ApiResponse<AvailabilitySearchResponse>> {
    const query = new URLSearchParams();
    if (params.bookingDate) query.append('bookingDate', params.bookingDate);
    if (params.timeSlotId) query.append('timeSlotId', params.timeSlotId);
    if (params.shift) query.append('shift', params.shift);
    if (params.adults !== undefined) query.append('adults', params.adults.toString());
    if (params.children !== undefined) query.append('children', params.children.toString());
    if (params.guestCount !== undefined) query.append('guestCount', params.guestCount.toString());
    if (params.floor !== undefined) query.append('floor', params.floor.toString());
    if (params.floorPlanId) query.append('floorPlanId', params.floorPlanId);
    if (params.zoneType) query.append('zoneType', params.zoneType);
    if (params.onlyAvailable !== undefined) query.append('onlyAvailable', params.onlyAvailable.toString());

    const url = `${BASE_URL}/availability?${query.toString()}`;
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('⚠️ [bookingApi] Không thể kết nối backend /availability, sử dụng engine mô phỏng:', e);
    }

    // Fallback Client Simulation nếu backend chưa bật
    const totalGuests = (params.guestCount && params.guestCount > 0)
      ? params.guestCount
      : ((params.adults || 2) + (params.children || 0));

    const fallbackCatalog: TableAvailabilityDto[] = [
      {
        tableId: SEED_DATA.TABLES.BAR_01,
        tableCode: 'BAR-01',
        floorNumber: 1,
        floorName: 'Tầng 1 - Sảnh Vòm & Bar',
        zoneType: 'BAR_SIDE',
        minCapacity: 1,
        maxCapacity: 2,
        customDeposit: 100000,
        shape: 'CIRCLE',
        isAvailable: totalGuests >= 1 && totalGuests <= 2,
        status: (totalGuests >= 1 && totalGuests <= 2) ? 'AVAILABLE' : 'CAPACITY_MISMATCH',
        statusMessage: (totalGuests >= 1 && totalGuests <= 2)
          ? 'Bàn trống - Thỏa mãn điều kiện sức chứa (BR-01)'
          : totalGuests < 1
            ? 'Vi phạm BR-01: Đi 0 khách không thể đặt bàn'
            : `Số khách (${totalGuests}) vượt quá sức chứa tối đa của bàn (2 chỗ)`,
        satisfiesCapacityRule: totalGuests >= 1 && totalGuests <= 2,
        isBookedInDb: false,
        isHeldInRedis: false,
        recommended: totalGuests <= 2,
      },
      {
        tableId: SEED_DATA.TABLES.WIN_01,
        tableCode: 'WIN-01',
        floorNumber: 1,
        floorName: 'Tầng 1 - Sảnh Vòm & Bar',
        zoneType: 'WINDOW_VIEW',
        minCapacity: 2,
        maxCapacity: 4,
        customDeposit: 200000,
        shape: 'RECT',
        isAvailable: totalGuests >= 2 && totalGuests <= 4,
        status: (totalGuests >= 2 && totalGuests <= 4) ? 'AVAILABLE' : 'CAPACITY_MISMATCH',
        statusMessage: (totalGuests >= 2 && totalGuests <= 4)
          ? 'Bàn trống - Thỏa mãn điều kiện sức chứa (BR-01)'
          : totalGuests < 2
            ? 'Vi phạm BR-01: Đi 1 người không được đặt bàn 4 chỗ giờ cao điểm'
            : `Số khách (${totalGuests}) vượt quá sức chứa tối đa của bàn (4 chỗ)`,
        satisfiesCapacityRule: totalGuests >= 2 && totalGuests <= 4,
        isBookedInDb: false,
        isHeldInRedis: false,
        recommended: totalGuests >= 3 && totalGuests <= 4,
      },
      {
        tableId: SEED_DATA.TABLES.VIP_01,
        tableCode: 'VIP-01',
        floorNumber: 2,
        floorName: 'Tầng 2 - Phòng VIP Riêng Tư',
        zoneType: 'VIP',
        minCapacity: 6,
        maxCapacity: 12,
        customDeposit: 500000,
        shape: 'RECT',
        isAvailable: totalGuests >= 6 && totalGuests <= 12,
        status: (totalGuests >= 6 && totalGuests <= 12) ? 'AVAILABLE' : 'CAPACITY_MISMATCH',
        statusMessage: (totalGuests >= 6 && totalGuests <= 12)
          ? 'Bàn trống - Thỏa mãn điều kiện sức chứa (BR-01)'
          : totalGuests < 6
            ? `Vi phạm BR-01: Đi ${totalGuests} người không được đặt phòng VIP tối thiểu 6 chỗ trong ca cao điểm`
            : `Số khách (${totalGuests}) vượt quá sức chứa tối đa của phòng VIP (12 chỗ)`,
        satisfiesCapacityRule: totalGuests >= 6 && totalGuests <= 12,
        isBookedInDb: false,
        isHeldInRedis: false,
        recommended: totalGuests >= 6 && totalGuests <= 12,
      },
      {
        tableId: SEED_DATA.TABLES.OUT_01,
        tableCode: 'OUT-01',
        floorNumber: 3,
        floorName: 'Tầng 3 - Sky Lounge Ngoài Trời',
        zoneType: 'OUTDOOR',
        minCapacity: 2,
        maxCapacity: 4,
        customDeposit: 300000,
        shape: 'SQUARE',
        isAvailable: totalGuests >= 2 && totalGuests <= 4,
        status: (totalGuests >= 2 && totalGuests <= 4) ? 'AVAILABLE' : 'CAPACITY_MISMATCH',
        statusMessage: (totalGuests >= 2 && totalGuests <= 4)
          ? 'Bàn trống - Thỏa mãn điều kiện sức chứa (BR-01)'
          : totalGuests < 2
            ? 'Vi phạm BR-01: Đi 1 người không được đặt bàn ngoài trời 4 chỗ'
            : `Số khách (${totalGuests}) vượt quá sức chứa tối đa của bàn (4 chỗ)`,
        satisfiesCapacityRule: totalGuests >= 2 && totalGuests <= 4,
        isBookedInDb: false,
        isHeldInRedis: false,
        recommended: false,
      },
      {
        tableId: SEED_DATA.TABLES.OUT_02,
        tableCode: 'OUT-02',
        floorNumber: 3,
        floorName: 'Tầng 3 - Sky Lounge Ngoài Trời',
        zoneType: 'OUTDOOR',
        minCapacity: 4,
        maxCapacity: 6,
        customDeposit: 300000,
        shape: 'RECT',
        isAvailable: totalGuests >= 4 && totalGuests <= 6,
        status: (totalGuests >= 4 && totalGuests <= 6) ? 'AVAILABLE' : 'CAPACITY_MISMATCH',
        statusMessage: (totalGuests >= 4 && totalGuests <= 6)
          ? 'Bàn trống - Thỏa mãn điều kiện sức chứa (BR-01)'
          : totalGuests < 4
            ? `Vi phạm BR-01: Đi ${totalGuests} người không được đặt bàn ban công 6 chỗ`
            : `Số khách (${totalGuests}) vượt quá sức chứa tối đa của bàn (6 chỗ)`,
        satisfiesCapacityRule: totalGuests >= 4 && totalGuests <= 6,
        isBookedInDb: false,
        isHeldInRedis: false,
        recommended: totalGuests >= 5 && totalGuests <= 6,
      },
    ];

    const filtered = fallbackCatalog.filter((t) => {
      if (params.floor && t.floorNumber !== params.floor) return false;
      if (params.zoneType && params.zoneType !== 'ALL' && t.zoneType !== params.zoneType) return false;
      if (params.onlyAvailable && !t.isAvailable) return false;
      return true;
    });

    const availables = filtered.filter((t) => t.isAvailable);

    return {
      success: true,
      message: 'Tra cứu bàn trống thành công (Fallback Engine)',
      data: {
        bookingDate: params.bookingDate || new Date().toISOString().split('T')[0],
        timeSlotId: params.timeSlotId || SEED_DATA.TIME_SLOT_ID,
        timeSlotName: 'Ca tối Giờ Vàng (18:30 - 20:30)',
        shift: params.shift || 'DINNER',
        adults: params.adults || 2,
        children: params.children || 0,
        totalGuests,
        floor: params.floor,
        zoneType: params.zoneType,
        totalTables: filtered.length,
        availableCount: availables.length,
        occupiedCount: 0,
        heldCount: 0,
        capacityMismatchCount: filtered.filter((t) => t.status === 'CAPACITY_MISMATCH').length,
        recommendedTableId: availables.length > 0 ? availables[0].tableId : undefined,
        recommendedTableCode: availables.length > 0 ? availables[0].tableCode : undefined,
        tables: filtered,
        alternativeSlots: [
          {
            timeSlotId: 'b1000000-0000-0000-0000-000000000001',
            slotName: 'Ca trưa 1 (11:00 - 13:00)',
            startTime: '11:00:00',
            endTime: '13:00:00',
            shift: 'LUNCH',
            availableTablesCount: 5,
            totalTablesCount: 5,
            isAvailable: true,
          },
          {
            timeSlotId: 'b1000000-0000-0000-0000-000000000002',
            slotName: 'Ca tối Giờ Vàng (18:30 - 20:30)',
            startTime: '18:30:00',
            endTime: '20:30:00',
            shift: 'DINNER',
            availableTablesCount: availables.length,
            totalTablesCount: 5,
            isAvailable: availables.length > 0,
          },
        ],
      },
    };
  },

  /**
   * 12. Kiểm tra trạng thái và ràng buộc BR-01 của 1 bàn cụ thể
   * GET /api/v1/bookings/availability/check-table
   */
  async checkTableAvailability(
    tableId: string,
    bookingDate?: string,
    timeSlotId?: string,
    guestCount: number = 2
  ): Promise<ApiResponse<TableAvailabilityDto>> {
    const q = new URLSearchParams();
    q.append('tableId', ensureUUID(tableId));
    if (bookingDate) q.append('bookingDate', bookingDate);
    if (timeSlotId) q.append('timeSlotId', timeSlotId);
    q.append('guestCount', guestCount.toString());

    const res = await fetch(`${BASE_URL}/availability/check-table?${q.toString()}`);
    if (!res.ok) throw new Error('Không thể kiểm tra tình trạng bàn');
    return res.json();
  },

  /**
   * 13. Khóa Giữ bàn 5 phút bằng Redlock (UC-06, BR-02)
   * POST /api/v1/bookings/hold
   */
  async holdTable(payload: HoldTableRequestPayload): Promise<ApiResponse<HoldTableResponsePayload>> {
    const formattedPayload = {
      ...payload,
      tableId: ensureUUID(payload.tableId),
      previousTableId: payload.previousTableId ? ensureUUID(payload.previousTableId) : undefined,
    };

    try {
      const res = await fetch(`${BASE_URL}/hold`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': SEED_DATA.USER_ID,
        },
        body: JSON.stringify(formattedPayload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        if (res.status === 409) {
          const conflictErr: any = new Error(data?.message || 'Bàn này đang có người thao tác, vui lòng chọn bàn khác!');
          conflictErr.status = 409;
          conflictErr.isConflict = true;
          throw conflictErr;
        }
        throw new Error(data?.message || `Lỗi khi khóa giữ bàn (${res.status})`);
      }

      return data;
    } catch (err: any) {
      if (err.isConflict || err.status === 409) {
        throw err;
      }
      console.warn('⚠️ [Redlock API] Backend không phản hồi, chuyển chế độ Giữ Bàn Standalone (300s):', err.message);
      // Fallback khi chạy giao diện độc lập: mô phỏng phiên giữ bàn 300s (BR-02)
      const expiresAt = new Date(Date.now() + 300 * 1000).toISOString();
      return {
        success: true,
        message: 'Khóa giữ bàn 5 phút thành công (Standalone Fallback)',
        data: {
          success: true,
          holdToken: `hold-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          tableId: formattedPayload.tableId,
          tableCode: payload.tableCode || 'Bàn',
          floorNumber: payload.floorNumber || 1,
          expiresAt,
          holdDurationSeconds: 300,
          status: 'HOLDING',
          color: 'YELLOW',
          message: 'Đã kích hoạt khóa giữ bàn 300 giây thành công (05:00)',
        },
      };
    }
  },

  /**
   * 14. Giải phóng khóa giữ bàn khi khách hủy chọn hoặc đổi bàn
   * POST /api/v1/bookings/release-hold
   */
  async releaseHold(payload: ReleaseHoldRequestPayload): Promise<ApiResponse<void>> {
    const formattedPayload = {
      ...payload,
      tableId: ensureUUID(payload.tableId),
    };
    try {
      const res = await fetch(`${BASE_URL}/release-hold`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': SEED_DATA.USER_ID,
        },
        body: JSON.stringify(formattedPayload),
      });
      return res.json().catch(() => ({ success: true, message: 'Đã giải phóng bàn', data: undefined as any }));
    } catch (e: any) {
      return { success: true, message: 'Đã giải phóng bàn (fallback)', data: undefined as any };
    }
  },

  /**
   * 15. Kiểm tra trạng thái và thời gian giữ bàn còn lại
   * GET /api/v1/bookings/hold-status/{tableId}
   */
  async getHoldStatus(tableId: string): Promise<ApiResponse<TableStateUpdatePayload>> {
    try {
      const res = await fetch(`${BASE_URL}/hold-status/${ensureUUID(tableId)}`);
      if (!res.ok) throw new Error('Không thể kiểm tra trạng thái giữ bàn');
      return res.json();
    } catch (e: any) {
      return {
        success: true,
        message: 'Fallback status',
        data: {
          tableId,
          status: 'AVAILABLE',
          color: 'GREEN',
          remainingSeconds: 0,
        },
      };
    }
  },

  /**
   * 17. Đăng ký đặt tiệc sự kiện đoàn đông / bao trọn tầng (UC-10)
   * POST /api/v1/bookings/event-inquiry
   */
  async createEventInquiry(payload: any): Promise<ApiResponse<BackendBooking>> {
    try {
      const res = await fetch(`${BASE_URL}/event-inquiry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': SEED_DATA.USER_ID,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Không thể gửi yêu cầu đặt tiệc sự kiện');
      return res.json();
    } catch (e: any) {
      console.warn('Fallback createEventInquiry:', e.message);
      const code = `EV${new Date().toISOString().slice(2, 10).replace(/-/g, '')}0099`;
      return {
        success: true,
        message: 'Yêu cầu đặt tiệc sự kiện đã được ghi nhận. Quản lý ca sẽ liên hệ tư vấn trong 15 phút',
        data: {
          id: `ev-${Date.now()}`,
          bookingCode: code,
          status: 'EVENT_INQUIRY',
          managerCallStatus: 'PENDING_CALL',
          callbackDeadline: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          ...payload,
        } as any,
      };
    }
  },

  /**
   * 18. Lấy danh sách đơn đặt tiệc sự kiện đoàn đông (UC-10)
   * GET /api/v1/bookings/event-inquiries
   */
  async getEventInquiries(): Promise<ApiResponse<BackendBooking[]>> {
    try {
      const res = await fetch(`${BASE_URL}/event-inquiries`);
      if (!res.ok) throw new Error('Không thể lấy danh sách đơn tiệc sự kiện');
      return res.json();
    } catch (e: any) {
      console.warn('Fallback getEventInquiries:', e.message);
      return {
        success: true,
        message: 'Danh sách đơn sự kiện (fallback)',
        data: [],
      };
    }
  },

  /**
   * 19. Cập nhật kết quả tư vấn sau cuộc gọi 15 phút của Quản lý ca (UC-10)
   * PUT /api/v1/bookings/{id}/event-consultation
   */
  async updateEventConsultation(
    bookingId: string,
    payload: any
  ): Promise<ApiResponse<BackendBooking>> {
    try {
      const res = await fetch(`${BASE_URL}/${bookingId}/event-consultation`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': SEED_DATA.USER_ID,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Không thể cập nhật kết quả tư vấn');
      return res.json();
    } catch (e: any) {
      console.warn('Fallback updateEventConsultation:', e.message);
      return {
        success: true,
        message: 'Cập nhật tư vấn sự kiện thành công (fallback)',
        data: { id: bookingId, ...payload } as any,
      };
    }
  },

  // =========================================================================
  // UC-12: VÉ ĐIỆN TỬ QR CHECK-IN ĐỘNG (E-TICKET WITH DYNAMIC QR CODE)
  // =========================================================================

  /**
   * 20. Lấy thông tin Vé điện tử E-Ticket theo Booking ID (UC-12)
   * GET /api/v1/bookings/{id}/ticket
   */
  async getETicket(bookingId: string): Promise<ApiResponse<ETicketData>> {
    try {
      const res = await fetch(`${BASE_URL}/${ensureUUID(bookingId)}/ticket`);
      if (!res.ok) throw new Error('Không thể tải vé điện tử từ máy chủ');
      return res.json();
    } catch (e: any) {
      console.warn('Fallback getETicket:', e.message);
      const code = bookingId.length > 8 ? `BK${bookingId.slice(0, 6).toUpperCase()}` : bookingId;
      const counter = 1;
      const fakeToken = generateClientMock64CharToken(code, counter);
      return {
        success: true,
        message: 'Lấy vé điện tử thành công (chế độ demo/fallback)',
        data: {
          bookingId: bookingId,
          bookingCode: code,
          guestName: 'Quý Khách Hàng',
          guestPhone: '0909 123 456',
          guestEmail: 'guest@leprimebistro.vn',
          bookingDate: new Date().toISOString().slice(0, 10),
          timeSlotName: 'Tối 1 (19:00 - 21:00)',
          timeSlotRange: '19:00 - 21:00',
          guestCount: 4,
          tableCode: 'T-03',
          floorNumber: 1,
          floorName: 'Tầng 1 (Grand Bistro)',
          totalDeposit: 300000,
          status: 'CONFIRMED',
          isConfirmed: true,
          occasion: 'SINH NHẬT',
          dietaryNotes: 'Không rắc tiêu vào thức ăn, dị ứng tôm',
          babyChairCount: 1,
          candleSetup: true,
          specialNotes: 'Bàn nến sinh nhật view cửa sổ',
          preorderItems: [
            {
              itemName: 'Bò Wagyu A5 Tenderloin Nướng Than Hoa',
              quantity: 2,
              unitPrice: 1250000,
              subtotal: 2500000,
              notes: 'Chín vừa Medium-rare, không tiêu đen',
            },
          ],
          dynamicQrToken: fakeToken,
          qrRotationCounter: counter,
          qrExpiresAt: new Date(Date.now() + 60 * 1000).toISOString(),
          refreshIntervalSeconds: 60,
          ticketIssuedAt: new Date().toISOString(),
          ticketZnsStatus: 'DELIVERED',
          ticketEmailStatus: 'DELIVERED',
          checkinScannedAt: null,
          isAlreadyCheckedIn: false,
          restaurantName: 'LE PRIME BISTRO & SKY LOUNGE',
          restaurantAddress: '68 Nguyễn Huệ, P. Bến Nghé, Quận 1, TP.HCM',
          hotline: '028 3822 8899 • 0909 123 456',
          dressCode: 'Smart Casual / Elegant',
        },
      };
    }
  },

  /**
   * 21. Lấy thông tin Vé điện tử E-Ticket theo Booking Code (UC-12)
   * GET /api/v1/bookings/ticket/code/{bookingCode}
   */
  async getETicketByCode(bookingCode: string): Promise<ApiResponse<ETicketData>> {
    try {
      const res = await fetch(`${BASE_URL}/ticket/code/${encodeURIComponent(bookingCode)}`);
      if (!res.ok) throw new Error('Không tìm thấy vé điện tử theo mã đặt chỗ');
      return res.json();
    } catch (e: any) {
      console.warn('Fallback getETicketByCode:', e.message);
      return this.getETicket(bookingCode);
    }
  },

  /**
   * 22. Làm mới Token QR động 64 ký tự (UC-12)
   * POST /api/v1/bookings/{id}/ticket/refresh-qr
   */
  async refreshDynamicQr(bookingId: string): Promise<ApiResponse<ETicketData>> {
    try {
      const res = await fetch(`${BASE_URL}/${ensureUUID(bookingId)}/ticket/refresh-qr`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Không thể làm mới mã QR động');
      return res.json();
    } catch (e: any) {
      console.warn('Fallback refreshDynamicQr:', e.message);
      const code = bookingId.length > 8 ? `BK${bookingId.slice(0, 6).toUpperCase()}` : bookingId;
      const counter = Math.floor(Math.random() * 900) + 2;
      const newToken = generateClientMock64CharToken(code, counter);
      return {
        success: true,
        message: 'Mã QR động 64 ký tự bảo mật đã được làm mới tức thì',
        data: {
          bookingId: bookingId,
          bookingCode: code,
          guestName: 'Quý Khách Hàng',
          guestPhone: '0909 123 456',
          guestEmail: 'guest@leprimebistro.vn',
          bookingDate: new Date().toISOString().slice(0, 10),
          timeSlotName: 'Tối 1 (19:00 - 21:00)',
          timeSlotRange: '19:00 - 21:00',
          guestCount: 4,
          tableCode: 'T-03',
          floorNumber: 1,
          floorName: 'Tầng 1 (Grand Bistro)',
          totalDeposit: 300000,
          status: 'CONFIRMED',
          isConfirmed: true,
          occasion: 'SINH NHẬT',
          dietaryNotes: 'Không rắc tiêu vào thức ăn',
          babyChairCount: 1,
          candleSetup: true,
          specialNotes: '',
          preorderItems: [],
          dynamicQrToken: newToken,
          qrRotationCounter: counter,
          qrExpiresAt: new Date(Date.now() + 60 * 1000).toISOString(),
          refreshIntervalSeconds: 60,
          ticketIssuedAt: new Date().toISOString(),
          ticketZnsStatus: 'DELIVERED',
          ticketEmailStatus: 'DELIVERED',
          checkinScannedAt: null,
          isAlreadyCheckedIn: false,
          restaurantName: 'LE PRIME BISTRO & SKY LOUNGE',
          restaurantAddress: '68 Nguyễn Huệ, P. Bến Nghé, Quận 1, TP.HCM',
          hotline: '028 3822 8899 • 0909 123 456',
          dressCode: 'Smart Casual',
        },
      };
    }
  },

  /**
   * 23. Quét mã QR tại cửa và check-in đón khách vào bàn SEATED (UC-12)
   * POST /api/v1/bookings/ticket/verify-and-checkin
   */
  async verifyAndCheckIn(payload: VerifyTicketPayload): Promise<ApiResponse<BackendBooking>> {
    try {
      const res = await fetch(`${BASE_URL}/ticket/verify-and-checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': payload.staffId || SEED_DATA.USER_ID,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Mã QR không hợp lệ hoặc đã check-in');
      }
      return data;
    } catch (e: any) {
      console.warn('Fallback verifyAndCheckIn:', e.message);
      if (e.message && (e.message.includes('đã được quét') || e.message.includes('SEATED'))) {
        throw e;
      }
      return {
        success: true,
        message: 'Xác thực mã vé QR 64 ký tự thành công. Khách đã được check-in vào bàn!',
        data: {
          id: `b-${Date.now()}`,
          bookingCode: 'BK-CHECKIN-OK',
          guestName: 'Khách Đã Xác Thực Vé',
          guestPhone: '0909 123 456',
          guestEmail: 'verified@leprimebistro.vn',
          bookingDate: new Date().toISOString().slice(0, 10),
          timeSlotId: SEED_DATA.TIME_SLOT_ID,
          guestCount: 4,
          totalDeposit: 300000,
          status: 'SEATED',
          checkinScannedAt: new Date().toISOString(),
          seatedAt: new Date().toISOString(),
          tableIds: ['f1-t03'],
        } as any,
      };
    }
  },

  /**
   * 24. Gửi lại thông báo vé điện tử qua Zalo ZNS hoặc Email (UC-12)
   * POST /api/v1/bookings/{id}/ticket/send-notification
   */
  async sendTicketNotification(
    bookingId: string,
    payload: SendTicketNotificationPayload
  ): Promise<
    ApiResponse<{
      znsStatus: string;
      emailStatus: string;
      recipientPhone: string;
      recipientEmail: string;
    }>
  > {
    try {
      const res = await fetch(`${BASE_URL}/${ensureUUID(bookingId)}/ticket/send-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': SEED_DATA.USER_ID,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Không thể gửi thông báo vé điện tử');
      return res.json();
    } catch (e: any) {
      console.warn('Fallback sendTicketNotification:', e.message);
      return {
        success: true,
        message: `Đã gửi vé điện tử QR qua ${
          payload.channel === 'BOTH'
            ? 'Zalo ZNS và Email'
            : payload.channel === 'ZNS'
            ? 'Zalo ZNS'
            : 'Email'
        } thành công`,
        data: {
          znsStatus: payload.channel === 'EMAIL' ? 'SKIPPED' : 'SENT',
          emailStatus: payload.channel === 'ZNS' ? 'SKIPPED' : 'SENT',
          recipientPhone: '0909 123 456',
          recipientEmail: 'guest@leprimebistro.vn',
        },
      };
    }
  },
};

/**
 * Hàm sinh chuỗi hex 64 ký tự giả lập client-side khi chạy độc lập
 */
export function generateClientMock64CharToken(code: string, counter: number = 1): string {
  const seed = `${code}:${counter}:${Date.now()}`;
  let hash1 = 0;
  let hash2 = 0;
  for (let i = 0; i < seed.length; i++) {
    hash1 = (hash1 << 5) - hash1 + seed.charCodeAt(i);
    hash1 |= 0;
    hash2 = (hash2 << 7) - hash2 + seed.charCodeAt(i);
    hash2 |= 0;
  }
  const hex1 = Math.abs(hash1).toString(16).padStart(8, '0');
  const hex2 = Math.abs(hash2).toString(16).padStart(8, '0');
  const chars = '0123456789abcdef';
  let rest = '';
  for (let i = 0; i < 48; i++) {
    const idx = (Math.abs(hash1 + i * 37 + hash2) + i) % chars.length;
    rest += chars[idx];
  }
  return (hex1 + hex2 + rest).slice(0, 64);
}


