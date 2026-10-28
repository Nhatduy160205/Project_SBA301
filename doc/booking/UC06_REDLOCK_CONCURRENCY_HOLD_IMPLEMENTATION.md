# UC-06: KHÓA GIỮ BÀN 5 PHÚT & XỬ LÝ TRANH CHẤP (REDLOCK CONCURRENCY HOLD)
## TÀI LIỆU CHI TIẾT HIỆN THỰC, GIẢI THÍCH LUỒNG & HƯỚNG DẪN KIỂM THỬ

> **Dự án:** TableMaster - Hệ Thống Quản Lý Đặt Bàn & Điều Phối Mặt Bằng 2D/3D Nhà Hàng  
> **Module:** Module 3 - Booking & Dispatch Service (Cổng dịch vụ: `8083`, Gateway: `8080`)  
> **Quy tắc nghiệp vụ cốt lõi:** `BR-02` (Khóa Giữ chỗ Phân tán 300 giây) & `UC-A1` (Tiến trình Tự động Giải phóng Bàn Quá Hạn)  
> **Công nghệ:** Java 21, Spring Boot 3.3.4, Redis 7.2 (Redisson Redlock), Spring WebSocket STOMP, Apache Kafka, PostgreSQL 16, React 19, TypeScript, Tailwind CSS, Framer Motion.

---

## 1. TỔNG QUAN VỀ USE CASE UC-06

### 1.1. Bối cảnh & Vấn đề giải quyết
Trong các khung giờ cao điểm (ví dụ: mở cổng đặt bàn Giờ Vàng tối Valentine, Giáng Sinh hoặc Đêm Giao Thừa), hàng chục hoặc hàng trăm khách hàng có thể cùng truy cập sơ đồ bàn và bấm vào cùng **01 chiếc bàn góc cửa sổ đẹp nhất (ví dụ: `WIN-01`) trong cùng một phần nghìn giây (milli-second)**.
- **Nếu không có cơ chế khóa phân tán:** Hệ thống sẽ gặp lỗi **Race Condition / Double Booking** (nhiều khách cùng thấy bàn trống, cùng tiến hành thanh toán cọc, dẫn đến tranh chấp nghiêm trọng tại sảnh nhà hàng).
- **Nếu khóa trực tiếp bằng CSDL (Pessimistic Lock `SELECT FOR UPDATE` trên PostgreSQL):** Khi hàng ngàn request đồng thời chạm vào CSDL sẽ gây nghẽn kết nối (Connection Pool Exhaustion), treo server và làm giảm tốc độ phản hồi chung.

### 1.2. Giải pháp kỹ thuật của UC-06
- Áp dụng **Redis Redlock Distributed Lock** thông qua thư viện **Redisson**:
  - Đặt khóa định danh: `lock:table:{tableId}:{bookingDate}:{timeSlotId}`.
  - Sử dụng cơ chế `tryLock(waitTime = 200ms, leaseTime = 5000ms)`: Khách hàng nào gửi request tới trước đúng 1 mili-giây sẽ giành được khóa phân tán.
  - Người giành được khóa: Kiểm tra tính khả dụng, tạo phiên giữ chỗ tạm thời với **TTL đúng 300 giây (05:00)** lưu trong Redis key `table:hold:{tableId}`.
  - Người thất bại: Bị chặn ngay từ tầng cache, server trả về mã lỗi **`HTTP 409 Conflict`** kèm thông báo `"Bàn này vừa có người chọn trước, vui lòng chọn bàn khác!"`.
- **Đồng bộ thời gian thực qua WebSocket STOMP:**
  - Ngay khi giữ bàn thành công, backend bắn broadcast tới topic `/topic/tables/status` và `/topic/floor-plan`.
  - Toàn bộ các khách hàng khác đang mở trang sơ đồ bàn trên trình duyệt sẽ thấy bàn đổi sang **MÀU VÀNG NHẤP NHÁY (`HOLDING`)** kèm hiệu ứng `pulse-ring` và **bị vô hiệu hóa click**.
  - Khách hàng đang giữ bàn sẽ hiển thị **đồng hồ đếm ngược sống động 05:00**, thanh tiến trình phần trăm và sẵn sàng quét mã cọc VietQR.
- **Tiến trình tự động nhả bàn (UC-A1):**
  - Nếu sau 300 giây khách hàng không hoàn tất đặt cọc hoặc thoát phiên, Redis TTL tự hết hạn.
  - Worker ngầm `TableHoldExpirationWorker` quét định kỳ và bắn WebSocket đổi màu bàn về **XANH LÁ (`AVAILABLE`)** trên toàn bộ màn hình người dùng.

---

## 2. DANH SÁCH CHI TIẾT CÁC TỆP ĐÃ THÊM MỚI VÀ CHỈNH SỬA

### 2.1. Backend (`src/server/` & `infrastructure/`)

#### A. Hạ tầng & CSDL
1. **[infrastructure/db-init/01-init-databases.sh](file:///d:/File/KÌ%207/SBA301/Project/Project_SBA301/infrastructure/db-init/01-init-databases.sh)** *(Đã sửa)*
   - Bổ sung lệnh tự động tạo role `postgres_duy_dao` với mật khẩu `1234567` (SUPERUSER) và cấp toàn quyền trên database `tablemaster_booking`. Đảm bảo container Docker luôn tương thích tuyệt đối với cấu hình mặc định của service.

#### B. Tệp Cấu hình & Quản lý Thư viện
2. **[src/server/booking-service/pom.xml](file:///d:/File/KÌ%207/SBA301/Project/Project_SBA301/src/server/booking-service/pom.xml)** *(Đã sửa)*
   - Bổ sung `org.redisson:redisson:3.34.1`: Thư viện chuẩn công nghiệp cho Distributed Locking & Redlock trên Redis Cluster/Single Node.
   - Bổ sung `spring-boot-starter-websocket`: Hỗ trợ giao thức WebSocket STOMP Message Broker.
3. **[src/server/booking-service/src/main/java/com/tablemaster/booking/config/RedissonConfig.java](file:///d:/File/KÌ%207/SBA301/Project/Project_SBA301/src/server/booking-service/src/main/java/com/tablemaster/booking/config/RedissonConfig.java)** *(Thêm mới)*
   - Khởi tạo bean `RedissonClient` kết nối tới Redis (`localhost:6379`).
   - Cấu hình Connection Pool (`size = 64`, `minIdle = 10`, `timeout = 3000ms`, `retryAttempts = 3`).
4. **[src/server/booking-service/src/main/java/com/tablemaster/booking/config/WebSocketConfig.java](file:///d:/File/KÌ%207/SBA301/Project/Project_SBA301/src/server/booking-service/src/main/java/com/tablemaster/booking/config/WebSocketConfig.java)** *(Thêm mới)*
   - Bật `@EnableWebSocketMessageBroker`.
   - Đăng ký Simple Broker tiền tố `/topic` và Application prefix `/app`.
   - Cấu hình Stomp Endpoint `/ws` hỗ trợ cả kết nối WebSocket thuần và SockJS fallback, cho phép Cross-Origin (`allowedOriginPatterns = "*"`).
5. **[src/server/gateway-service/src/main/resources/application.yml](file:///d:/File/KÌ%207/SBA301/Project/Project_SBA301/src/server/gateway-service/src/main/resources/application.yml)** *(Đã sửa)*
   - Cập nhật định tuyến `booking-service` thêm mẫu đường dẫn `/ws/**` để các kết nối STOMP client từ Gateway (`8080`) được chuyển tiếp trong suốt về Booking Service (`8083`).

#### C. DTOs & Exception Handling
6. **[src/server/booking-service/src/main/java/com/tablemaster/booking/dto/request/HoldTableRequest.java](file:///d:/File/KÌ%207/SBA301/Project/Project_SBA301/src/server/booking-service/src/main/java/com/tablemaster/booking/dto/request/HoldTableRequest.java)** *(Thêm mới)*
   - Chứa `tableId`, `tableCode`, `bookingDate`, `timeSlotId`, `guestCount`, `floorNumber`, và `previousHoldToken`/`previousTableId` (hỗ trợ tự động nhả bàn cũ khi khách đổi bàn).
7. **[src/server/booking-service/src/main/java/com/tablemaster/booking/dto/response/HoldTableResponse.java](file:///d:/File/KÌ%207/SBA301/Project/Project_SBA301/src/server/booking-service/src/main/java/com/tablemaster/booking/dto/response/HoldTableResponse.java)** *(Thêm mới)*
   - Chứa `holdToken`, `tableId`, `tableCode`, `floorNumber`, `expiresAt`, `holdDurationSeconds` (300s), `status: "HOLDING"`, `color: "YELLOW"`.
8. **[src/server/booking-service/src/main/java/com/tablemaster/booking/dto/request/ReleaseHoldRequest.java](file:///d:/File/KÌ%207/SBA301/Project/Project_SBA301/src/server/booking-service/src/main/java/com/tablemaster/booking/dto/request/ReleaseHoldRequest.java)** *(Thêm mới)*
   - Dùng để gửi yêu cầu hủy giữ bàn thủ công khi khách đổi ý.
9. **[src/server/booking-service/src/main/java/com/tablemaster/booking/dto/response/TableStateUpdateDto.java](file:///d:/File/KÌ%207/SBA301/Project/Project_SBA301/src/server/booking-service/src/main/java/com/tablemaster/booking/dto/response/TableStateUpdateDto.java)** *(Thêm mới)*
   - Payload bắn qua STOMP WebSocket: `tableId`, `tableCode`, `floorNumber`, `status` (`AVAILABLE`/`HOLDING`/`CONFIRMED`), `color` (`GREEN`/`YELLOW`/`RED`), `expiresAt`, `remainingSeconds`.
10. **[src/server/booking-service/src/main/java/com/tablemaster/booking/exception/TableAlreadyLockedException.java](file:///d:/File/KÌ%207/SBA301/Project/Project_SBA301/src/server/booking-service/src/main/java/com/tablemaster/booking/exception/TableAlreadyLockedException.java)** *(Thêm mới)*
    - Ngoại lệ ném ra khi không acquire được Redlock hoặc bàn đang bị chiếm giữ.
11. **[src/server/booking-service/src/main/java/com/tablemaster/booking/exception/GlobalExceptionHandler.java](file:///d:/File/KÌ%207/SBA301/Project/Project_SBA301/src/server/booking-service/src/main/java/com/tablemaster/booking/exception/GlobalExceptionHandler.java)** *(Đã sửa)*
    - Bổ sung `@ExceptionHandler(TableAlreadyLockedException.class)` trả về mã lỗi chuẩn `HTTP 409 CONFLICT`.

#### D. Service, Worker & Controller
12. **[src/server/booking-service/src/main/java/com/tablemaster/booking/service/TableHoldService.java](file:///d:/File/KÌ%207/SBA301/Project/Project_SBA301/src/server/booking-service/src/main/java/com/tablemaster/booking/service/TableHoldService.java)** *(Thêm mới)*
    - Interface định nghĩa nghiệp vụ giữ bàn, giải phóng bàn, tra cứu hold status và auto-release.
13. **[src/server/booking-service/src/main/java/com/tablemaster/booking/service/TableHoldServiceImpl.java](file:///d:/File/KÌ%207/SBA301/Project/Project_SBA301/src/server/booking-service/src/main/java/com/tablemaster/booking/service/TableHoldServiceImpl.java)** *(Thêm mới)*
    - Trọng tâm xử lý của UC-06:
      - Sử dụng `RLock lock = redissonClient.getLock(...)`.
      - Chờ lock tối đa 200ms (`tryLock(200, 5000, TimeUnit.MILLISECONDS)`).
      - Kiểm tra PostgreSQL (`findBookedTableIds`) và Redis Cache (`table:hold:{tableId}`).
      - Thiết lập TTL 300 giây vào Redis thông qua `redisTemplate.opsForValue().set(..., 300, TimeUnit.SECONDS)`.
      - Luôn nhả distributed lock trong khối `finally { if (lock.isHeldByCurrentThread()) lock.unlock(); }`.
      - Phát tín hiệu STOMP qua `messagingTemplate.convertAndSend("/topic/tables/status", event)`.
      - Phát sự kiện Kafka `TABLE_HELD` / `TABLE_RELEASED`.
14. **[src/server/booking-service/src/main/java/com/tablemaster/booking/scheduler/TableHoldExpirationWorker.java](file:///d:/File/KÌ%207/SBA301/Project/Project_SBA301/src/server/booking-service/src/main/java/com/tablemaster/booking/scheduler/TableHoldExpirationWorker.java)** *(Thêm mới)*
    - Hiện thực `UC-A1`: Chạy định kỳ mỗi 5.000ms (`@Scheduled(fixedRate = 5000)`), tự động nhả bàn và phát tín hiệu `AVAILABLE` (Xanh lá) khi hết hạn 300s.
15. **[src/server/booking-service/src/main/java/com/tablemaster/booking/controller/TableHoldController.java](file:///d:/File/KÌ%207/SBA301/Project/Project_SBA301/src/server/booking-service/src/main/java/com/tablemaster/booking/controller/TableHoldController.java)** *(Thêm mới)*
    - `POST /api/v1/bookings/hold`: Kích hoạt giữ bàn 5 phút.
    - `POST /api/v1/bookings/release-hold`: Giải phóng khóa giữ bàn.
    - `GET /api/v1/bookings/hold-status/{tableId}`: Lấy thời gian còn lại của bàn.
16. **[src/server/booking-service/src/test/java/com/tablemaster/booking/service/TableHoldServiceTest.java](file:///d:/File/KÌ%207/SBA301/Project/Project_SBA301/src/server/booking-service/src/test/java/com/tablemaster/booking/service/TableHoldServiceTest.java)** *(Thêm mới)*
    - 5 bài kiểm thử đơn vị hoàn chỉnh kiểm chứng mọi nhánh nghiệp vụ của UC-06:
      - `holdTable_success`: Khóa thành công 300s, phát STOMP.
      - `holdTable_conflictWhenLockCannotBeAcquired`: Mô phỏng race condition không lấy được lock -> 409 Conflict.
      - `holdTable_conflictWhenAlreadyHeldInRedis`: Đã có người giữ trên Redis -> 409 Conflict.
      - `holdTable_conflictWhenBookedInDatabase`: Bàn đã có đơn đặt trong PostgreSQL -> Báo lỗi.
      - `releaseHold_success`: Giải phóng bàn -> xóa Redis, phát STOMP màu xanh.

---

### 2.2. Frontend (`src/client/tablemaster-ui/`)

1. **[src/client/tablemaster-ui/src/services/websocketService.ts](file:///d:/File/KÌ%207/SBA301/Project/Project_SBA301/src/client/tablemaster-ui/src/services/websocketService.ts)** *(Thêm mới)*
   - Service quản lý kết nối WebSocket STOMP Client thuần (kết nối tới `ws://localhost:8083/ws/websocket` hoặc Gateway `8080`).
   - Tự động gửi frame `CONNECT`, lắng nghe `CONNECTED`, đăng ký topic `/topic/tables/status` và `/topic/floor-plan`.
   - Cơ chế tự phục hồi kết nối (Auto-reconnect) sau mỗi 5 giây nếu mạng gián đoạn.
2. **[src/client/tablemaster-ui/src/services/bookingApi.ts](file:///d:/File/KÌ%207/SBA301/Project/Project_SBA301/src/client/tablemaster-ui/src/services/bookingApi.ts)** *(Đã sửa)*
   - Bổ sung interface `HoldTableRequestPayload`, `HoldTableResponsePayload`, `ReleaseHoldRequestPayload`, `TableStateUpdatePayload`.
   - Hiện thực phương thức `holdTable(payload)`: bắt lỗi `409 Conflict` có cờ `isConflict = true`, đồng thời cung cấp fallback mô phỏng 300s nếu chạy ở chế độ UI standalone.
   - Hiện thực phương thức `releaseHold(payload)` và `getHoldStatus(tableId)`.
   - **Bổ sung `TABLE_ID_MAP`:** Ánh xạ toàn bộ ID bàn mock từ Tầng 1 (`f1-t01` đến `f1-t12`), Tầng 2 (`f2-v01` đến `f2-v06`), Tầng 3 (`f3-sky01` đến `f3-sky05`) sang UUID chuẩn trong CSDL PostgreSQL.
   - **Bổ sung `ensureUUID()`:** Tự động kiểm tra regex và chuyển đổi an toàn mọi ID sang UUID hợp lệ.
3. **[src/client/tablemaster-ui/src/components/floor/TableNode.tsx](file:///d:/File/KÌ%207/SBA301/Project/Project_SBA301/src/client/tablemaster-ui/src/components/floor/TableNode.tsx)** *(Đã sửa)*
   - Nâng cấp trạng thái `HOLDING`:
     - Nếu là bàn do chính khách hàng đang giữ: Hiển thị viền vàng hổ phách phát sáng, gắn thẻ `Bạn Giữ: mm:ss`.
     - Nếu là bàn do khách khác giữ: Hiển thị màu vàng nhấp nháy (`animate-pulse`), vòng tròn sóng tỏa `pulse-ring`, gắn thẻ đếm ngược `Đang Giữ: mm:ss`, và **vô hiệu hóa click**.
4. **[src/client/tablemaster-ui/src/views/BookingPage.tsx](file:///d:/File/KÌ%207/SBA301/Project/Project_SBA301/src/client/tablemaster-ui/src/views/BookingPage.tsx)** *(Đã sửa)*
   - Quản lý các state: `holdToken`, `holdExpiresAt`, `holdRemainingSeconds`, `conflictError`, `isHoldingTable`.
   - Timer `setInterval` đếm ngược chính xác từng giây từ `300s` (05:00) về `00:00`.
   - Khi hết 5 phút: Tự động gọi API `releaseHold`, reset bàn về `AVAILABLE` và cảnh báo hết giờ.
   - Khi click chọn bàn trên sơ đồ 2D, 3D hoặc Smart Cards: Kích hoạt API Redlock `bookingApi.holdTable`.
   - Nếu gặp lỗi 409 Conflict: Hiển thị ngay Banner thông báo tranh chấp bàn màu đỏ/vàng nổi bật.
   - Tại thẻ **Spotlight Card (Mục 02)**: Hiển thị hộp đếm ngược 05:00 với icon đồng hồ chuyển động và nút Trash để hủy giữ bàn.
   - Tại **Thanh tóm tắt cọc bên phải**: Hiển thị thanh tiến trình phần trăm thời gian giữ bàn 300s.
   - Đăng ký lắng nghe WebSocket STOMP: Khi có client khác giữ bàn, sơ đồ bàn lập tức đổi màu vàng theo thời gian thực mà không cần tải lại trang.
   - **Chuẩn hóa UUID khi tạo đơn:** Sử dụng `ensureUUID()` cho `tableUUID` trong `createBooking` và `releaseHold`, giải quyết triệt để lỗi ép kiểu Jackson UUID của Spring Boot.

---

## 3. GIẢI THÍCH CHI TIẾT LUỒNG NGHIỆP VỤ (FLOW EXPLANATION)

### 3.1. Sơ đồ tuần tự xử lý (Sequence Diagram)

```
[Khách hàng 1]                    [Khách hàng 2]                     [Backend Booking Service]                 [Redis Cache & Redlock]
      |                                 |                                        |                                        |
      |--- 1. Click chọn bàn WIN-01 --->|                                        |                                        |
      |    (POST /hold)                 |                                        |                                        |
      |                                 |--- 2. Click cùng mili-giây ----------->|                                        |
      |                                 |    (POST /hold)                        |                                        |
      |                                 |                                        |--- 3. tryLock("lock:WIN-01", 200ms) -->|
      |                                 |                                        |<-- 4. Lock Acquired OK (Khách 1) ------|
      |                                 |                                        |                                        |
      |                                 |                                        |--- 5. Khách 2 thử tryLock ------------>|
      |                                 |                                        |<-- 6. Lock FAILED / Busy --------------|
      |                                 |<-- 7. Trả về HTTP 409 Conflict --------|                                        |
      |                                 |    (Bàn vừa có người chọn trước)       |                                        |
      |                                 |                                        |                                        |
      |                                 |                                        |--- 8. Ghi key `table:hold:WIN-01` ---->|
      |                                 |                                        |    (TTL = 300s, Token, User1)          |
      |                                 |                                        |--- 9. Giải phóng lock phân tán ------->|
      |                                 |                                        |                                        |
      |<-- 10. Trả về HTTP 200 OK ------|                                        |--- 11. Bắn STOMP /topic/tables/status -|
      |    {Token, 300s, 05:00}         |                                        |    {status: HOLDING, color: YELLOW}    |
      |                                 |                                        |                                        |
      |=== 12. Hiển thị đếm 05:00 ======|=== 13. Nhận STOMP -> Bàn WIN-01 đổi sang màu VÀNG nhấp nháy, bị khóa click =====|
```

### 3.2. Cơ chế Redlock Concurrency
1. **Khóa phân tán (Distributed Lock):**
   - Khóa được tạo theo định danh 3 cấp độ: `lock:table:{tableId}:{bookingDate}:{timeSlotId}`.
   - Nhờ Redisson `tryLock(200, 5000, TimeUnit.MILLISECONDS)`, tiến trình chỉ giữ CPU trong tối đa 200ms để tranh chấp khóa, không gây treo luồng (thread blocking) và tự động nhả lease sau 5s nếu server bị tắt đột ngột (tránh Deadlock).
2. **Khóa dữ liệu tạm thời (Hold State):**
   - Sau khi lấy được lock phân tán, hệ thống đặt trạng thái vào Redis với key `table:hold:{tableId}` có **TTL đúng 300 giây (5 phút)**.
   - Khóa này chứa token ngẫu nhiên `holdToken` đại diện cho quyền sở hữu tạm thời của khách hàng.
3. **Phát hiện tranh chấp (Conflict Resolution):**
   - Bất kỳ yêu cầu nào đến sau trong thời gian 300s này đều sẽ bị chặn ngay tại Redis Cache mà không cần query nặng tới PostgreSQL, đảm bảo khả năng chịu tải cao (High Throughput).
   - Response trả về chuẩn RESTful:
     ```json
     {
       "success": false,
       "message": "Bàn WIN-01 vừa có người chọn trước, vui lòng chọn bàn khác!"
     }
     ```

### 3.3. Cơ chế Giải phóng Bàn (Release Strategy)
Hệ thống có 3 kịch bản giải phóng bàn:
1. **Khách hàng đổi bàn / Hủy:** Frontend gửi kèm `previousHoldToken` và `previousTableId`, backend lập tức xóa key Redis cũ và phát STOMP chuyển bàn cũ về màu xanh lá (`AVAILABLE`).
2. **Khách hàng thanh toán cọc thành công:** Đơn chuyển sang `CONFIRMED`, khóa tạm thời 300s được xóa bỏ, bàn chuyển vĩnh viễn sang trạng thái màu đỏ (`CONFIRMED`).
3. **Quá hạn 5 phút (Auto-Release Worker):** Khi bộ đếm về `00:00`, `TableHoldExpirationWorker` (chạy mỗi 5s) phát hiện TTL đã hết, tự động gửi frame STOMP báo toàn bộ mạng lưới chuyển bàn về màu xanh lá.

### 3.4. Kiến trúc Phân tầng Dữ liệu (Storage Tiering)

| Trạng thái | Nơi lưu trữ | Key / Bảng | Đặc điểm |
| :--- | :--- | :--- | :--- |
| **Đang giữ 5 phút** | **Redis (In-Memory)** | Key `table:hold:{tableId}` & `lock:table:{tableId}` | Tốc độ nano-giây, tự động hết hạn sau 300s. **Không ghi rác vào PostgreSQL**. |
| **Đơn đặt bàn chính thức** | **PostgreSQL** | Database `tablemaster_booking`, Bảng `bookings` & `booking_tables` | Lưu trữ vĩnh viễn, ràng buộc toàn vẹn UUID, thông tin cọc `total_deposit`. |
| **Giao dịch thanh toán cọc** | **PostgreSQL** | Database `tablemaster_payment`, Bảng `payment_transactions` | Ghi nhận mã giao dịch `TXN-...`, số tiền cọc, cổng thanh toán (VietQR/MoMo). |

### 3.5. Quy ước Định dạng Mã Đơn (Booking Code Convention)
- **Mã Backend chuẩn (Đã lưu vào PostgreSQL):** Định dạng **`BK` + `YYMMDD` + `4 số thứ tự`** (Ví dụ: `BK2610200001`, không có dấu gạch ngang giữa chữ và số) hoặc mã seed `PB-20261024-001`.
- **Mã Client Fallback (Chỉ nằm trên RAM trình duyệt):** Định dạng **`BK-xxxx`** (Có dấu gạch ngang, ví dụ: `BK-1218`). Mã này chỉ xuất hiện khi Backend bị tắt hoặc payload gửi lên bị lỗi ép kiểu dữ liệu.

---

## 4. HƯỚNG DẪN CHẠY & KIỂM THỬ TỪNG BƯỚC (STEP-BY-STEP EXECUTION)

### Bước 1: Khởi động Cơ sở hạ tầng (PostgreSQL, Redis, Kafka)
Mở terminal tại thư mục gốc của dự án:
```powershell
docker-compose up -d
```
Đảm bảo Redis đang hoạt động tại cổng `6379`, PostgreSQL tại `5432` và Kafka tại `9092/9094`.

### Bước 2: Chạy Backend Booking Service
Mở terminal tại thư mục `src/server/booking-service` (hoặc nhấn nút **Run** [BookingServiceApplication.java](file:///d:/File/KÌ%207/SBA301/Project/Project_SBA301/src/server/booking-service/src/main/java/com/tablemaster/booking/BookingServiceApplication.java#L15) trên IDE):
```powershell
mvn spring-boot:run
```
*(Hoặc chạy song song cả `discovery-service` cổng 8761, `gateway-service` cổng 8080 và `booking-service` cổng 8083).*

### Bước 3: Chạy Kiểm thử Tự động (Unit Tests)
Để xác nhận tính toàn vẹn của Redlock Concurrency Hold:
```powershell
mvn test -Dtest=TableHoldServiceTest -pl booking-service
```
**Kết quả mong đợi:**
```text
[INFO] Running com.tablemaster.booking.service.TableHoldServiceTest
[INFO] Tests run: 5, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

### Bước 4: Chạy Giao diện Người dùng (Frontend)
Mở terminal tại thư mục `src/client/tablemaster-ui`:
```powershell
npm run dev
```
Truy cập trình duyệt tại địa chỉ: `http://localhost:5173`.

---

## 5. CÁC KỊCH BẢN KIỂM THỬ TRỰC QUAN TRÊN GIAO DIỆN

### Kịch bản 1: Chọn bàn bình thường (Happy Path)
1. Trên giao diện, cuộn tới **Mục 02: Sơ Đồ Bàn 2D / 3D Trực Quan**.
2. Click vào bàn xanh trống bất kỳ (ví dụ: `WIN-01` hoặc `VIP-01`).
3. **Quan sát kết quả:**
   - Bàn chuyển sang viền vàng hổ phách kèm hiệu ứng `Bạn Chọn`.
   - Xuất hiện thẻ Spotlight Card với đồng hồ đếm ngược **`Khóa giữ 5 phút: 05:00`** (giảm dần từng giây: `04:59`, `04:58`...).
   - Tại thanh tóm tắt cọc bên phải: Xuất hiện thanh tiến trình đếm ngược màu vàng và nhãn *`Giữ chỗ tạm thời (Redlock)`*.

### Kịch bản 2: Mô phỏng Tranh chấp 2 Khách hàng (Concurrency Race Condition)
1. Mở 2 cửa sổ trình duyệt:
   - Cửa sổ 1: Trình duyệt bình thường (`http://localhost:5173`).
   - Cửa sổ 2: Cửa sổ ẩn danh (Incognito) (`http://localhost:5173`).
2. Tại Cửa sổ 1, bấm chọn bàn `WIN-01`.
3. Nhìn sang Cửa sổ 2:
   - Nhờ WebSocket STOMP, bàn `WIN-01` tại Cửa sổ 2 **tự động chuyển sang màu Vàng nhấp nháy (`HOLDING`)** kèm thẻ `Đang Giữ: 04:58`.
   - Con trỏ chuột trên bàn `WIN-01` bị đổi thành biểu tượng cấm (`cursor-not-allowed`).
4. Tại Cửa sổ 2, cố tình click vào bàn `WIN-01`:
   - Giao diện Cửa sổ 2 lập tức hiển thị **Banner cảnh báo màu đỏ/vàng**:
     > ⚠️ **Thông Báo Tranh Chấp Bàn (Redlock 409 Conflict):** *Bàn WIN-01 hiện đang được khách hàng khác thao tác giữ chỗ 5 phút (BR-02). Vui lòng chọn bàn khác!*

### Kịch bản 3: Tự động Giải phóng Bàn Quá Hạn (Auto-Release sau 300s)
1. Tại Cửa sổ 1, chọn bàn và chờ đồng hồ đếm ngược về `00:00` (hoặc để kiểm thử nhanh, bấm nút Thùng rác bên cạnh bàn để hủy giữ bàn).
2. **Quan sát kết quả:**
   - Hệ thống phát thông báo hết hạn 5 phút.
   - Bàn lập tức được giải phóng và chuyển lại về **Màu Xanh Lá (`AVAILABLE`)** trên cả 2 trình duyệt.

### Kịch bản 4: Hoàn tất Đặt cọc VietQR & Kiểm tra Database
1. Khi bàn đang được giữ, nhập thông tin liên lạc và bấm **Xác Nhận Giữ Bàn & Quét Mã VietQR**.
2. Mô phỏng quét mã hoặc bấm xác nhận thanh toán thành công trong Modal.
3. Bàn lập tức chuyển sang trạng thái **Màu Đỏ (`CONFIRMED`)**, khóa giữ tạm 5 phút được giải phóng và vé điện tử QR được sinh thành công với mã chuẩn `BK2610xxxx`.
4. **Kiểm tra trực tiếp trong PostgreSQL:**
   ```powershell
   docker exec -it tablemaster_postgres psql -U postgres -d tablemaster_booking -c "SELECT booking_code, guest_name, total_deposit, status, created_at FROM bookings ORDER BY created_at DESC;"
   ```
   Bản ghi đơn đặt bàn mới sẽ hiển thị đầy đủ trong bảng `bookings`.

---

## 6. HƯỚNG DẪN XỬ LÝ SỰ CỐ THƯỜNG GẶP (TROUBLESHOOTING)

### 6.1. Lỗi `password authentication failed for user "postgres_duy_dao"`
- **Hiện tượng:** Service `booking-service` không khởi động được, văng lỗi `GenericJDBCException: Unable to open JDBC Connection`.
- **Nguyên nhân:** Container Docker PostgreSQL ban đầu chỉ có user mặc định `postgres`, chưa có role `postgres_duy_dao` tương ứng cấu hình trong `application.yml`.
- **Cách khắc phục:** Chạy lệnh tạo role và cấp quyền trong Docker PostgreSQL:
  ```powershell
  docker exec tablemaster_postgres psql -U postgres -c "CREATE ROLE postgres_duy_dao WITH LOGIN SUPERUSER PASSWORD '1234567'; GRANT ALL PRIVILEGES ON DATABASE tablemaster_booking TO postgres_duy_dao; GRANT ALL ON SCHEMA public TO postgres_duy_dao;"
  ```
  *(Đã được tự động hóa vĩnh viễn trong file [01-init-databases.sh](file:///d:/File/KÌ%207/SBA301/Project/Project_SBA301/infrastructure/db-init/01-init-databases.sh)).*

### 6.2. Lỗi Đơn hiển thị trên UI nhưng không có trong Database (Mã dạng `BK-xxxx`)
- **Hiện tượng:** Khách bấm đặt bàn, UI hiện thông báo thành công với mã dạng `BK-1218`, nhưng mở CSDL thì không thấy đơn.
- **Nguyên nhân:** 
  1. `booking-service` ở cổng `8083` chưa được bật.
  2. Hoặc ID bàn gửi lên không đúng định dạng UUID 36 ký tự (ví dụ gửi chuỗi `"f2-v01"` của Tầng 2 khiến Spring Boot báo lỗi 400). Khi đó Frontend kích hoạt cơ chế dự phòng `Client Standalone Mode` lưu tạm vào RAM.
- **Cách khắc phục:**
  - Bật `BookingServiceApplication` trên IDE (port `8083`).
  - Hàm `ensureUUID()` và `TABLE_ID_MAP` đã được tích hợp đầy đủ trong [bookingApi.ts](file:///d:/File/KÌ%207/SBA301/Project/Project_SBA301/src/client/tablemaster-ui/src/services/bookingApi.ts) để chuyển đổi mọi ID bàn sang UUID chuẩn của PostgreSQL.

---
*Tài liệu được cập nhật tự động vào hệ thống tài liệu TableMaster (`doc/booking/`).*
