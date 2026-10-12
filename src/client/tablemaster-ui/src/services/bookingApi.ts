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
  status: 'PENDING_REVIEW' | 'AWAITING_PAYMENT' | 'CONFIRMED' | 'SEATED' | 'COMPLETED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED' | 'NO_SHOW';
  specialNotes?: string;
  staffNotes?: string;
  reviewedByUserId?: string;
  paymentDeadline?: string;
  checkinQrToken?: string;
  seatedAt?: string;
  completedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  tableIds?: string[];
  preorderItems?: Array<{
    id?: string;
    menuItemId: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
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
  totalDeposit?: number;
  preorderItems?: Array<{
    menuItemId: string;
    quantity: number;
    unitPrice: number;
  }>;
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
};

// Map ID bàn mock sang UUID tương ứng trong PostgreSQL
export const TABLE_ID_MAP: Record<string, string> = {
  'f1-t01': SEED_DATA.TABLES.BAR_01,
  'f1-t02': SEED_DATA.TABLES.WIN_01,
  'f1-t03': SEED_DATA.TABLES.VIP_01,
  'f1-t04': SEED_DATA.TABLES.OUT_01,
  'f1-t05': SEED_DATA.TABLES.OUT_02,
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
};
