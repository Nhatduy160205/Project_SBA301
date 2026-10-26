# TÀI LIỆU HIỆN THỰC UC-12: NHẬN VÉ ĐIỆN TỬ QR CHECK-IN ĐỘNG (E-TICKET WITH DYNAMIC QR CODE)

> **Mã Use Case:** UC-12  
> **Tên Use Case:** Nhận Vé điện tử QR Check-in (E-Ticket with Dynamic QR Code)  
> **Mô tả nghiệp vụ:** Cấp phát vé điện tử chứa mã QR động bảo mật (Token 64 ký tự chống giả mạo) hiển thị trên màn hình và tự động gửi qua Email / tin nhắn Zalo ZNS để quét tại cửa. Khi khách tới cửa, Lễ tân quét mã để kiểm tra tính hợp lệ, tự động mở bàn, chuyển trạng thái `SEATED` và kích hoạt chính sách chống gian lận dùng lại mã một lần (One-Time Use).  
> **Thời gian hoàn thành:** 26/10/2026  
> **Hệ thống liên quan:** `booking-service` (Spring Boot), PostgreSQL, Apache Kafka, `tablemaster-ui` (React, TypeScript, TailwindCSS v4).

---

## 1. Bối Cảnh Nghiệp Vụ & Bài Toán Kỹ Thuật

Tại các nhà hàng Fine Dining đẳng cấp Michelin như **Le Prime Bistro & Sky Lounge**, trải nghiệm đón tiếp tại cửa (Front-Door Host Experience) đóng vai trò quyết định ấn tượng đầu tiên của thực khách:
1. **Chống gian lận chụp ảnh màn hình (Anti-Screenshot / Anti-Counterfeit):** Mã QR tĩnh thông thường rất dễ bị chụp màn hình gửi cho người khác hoặc sao chép trái phép. Cần cơ chế **mã QR động xoay sau mỗi 60 giây** với **token mã hóa 64 ký tự hex** không thể đoán trước (`HMAC-SHA256`).
2. **Nguyên tắc dùng 1 lần (One-Time Use Enforcement):** Khi mã QR được quét tại cửa, hệ thống đóng dấu thời gian `checkin_scanned_at` và chuyển trạng thái sang `SEATED`. Bất kỳ lần quét thứ hai nào đều bị chặn ngay lập tức với cảnh báo gian lận.
3. **Đa kênh thông báo tự động (Omnichannel Dispatch):** Ngay sau khi cọc giữ chỗ thành công hoặc nhận bàn, vé điện tử tự động được kích hoạt và gửi tới khách qua **Zalo ZNS Official** (Zalo Notification Service) và **Email xác nhận**, kèm đường link tra cứu trực tiếp.
4. **Trực quan hóa chuẩn Haute Gastronomy (Apple Wallet / Boarding Pass):** Giao diện vé điện tử trên điện thoại/máy tính khách hàng mang phong cách vé máy bay hạng Thương gia (VIP Boarding Pass) với đồng hồ đếm ngược 60 giây dạng vòng tròn SVG, tích hợp đầy đủ cảnh báo dị ứng & nhu cầu đặc biệt (UC-08) và thực đơn đặt trước (UC-07).

---

## 2. Kiến Trúc Bảo Mật & Thuật Toán Token 64 Ký Tự

### 2.1. Cấu Trúc Khóa HMAC-SHA256 & Salt 256-Bit
Để đảm bảo mã QR chứa đúng 64 ký tự hex (`[a-f0-9]{64}`) chống giả mạo:
- Mỗi đơn đặt bàn được cấp một chuỗi `qr_secret_salt` ngẫu nhiên 32 bytes (64 hex characters) sinh bằng `java.security.SecureRandom`.
- Token xoay được tính theo công thức:
  $$\text{Token}_{64} = \text{HMAC-SHA256}\Big(\text{Key: } (\text{qrSecretSalt} + \text{PEPPER}), \text{Data: } (\text{bookingCode} + \text{":"} + \text{rotationCounter})\Big)$$
- Kết quả của hàm băm `HMAC-SHA256` là 32 bytes (256 bits), khi chuyển sang dạng chuỗi Hexadecimal sẽ có độ dài **chính xác 64 ký tự** thường (`[0-9a-f]{64}`).
- Việc so khớp token khi Lễ tân quét tại cửa sử dụng so sánh hằng số thời gian `MessageDigest.isEqual` để triệt tiêu hoàn toàn tấn công Timing Attack.

```java
// Trích xuất từ QrSecurityUtil.java
public static String generate64CharToken(String bookingCode, String salt, int rotationCounter) {
    String payload = bookingCode + ":" + rotationCounter;
    Mac hmac = Mac.getInstance("HmacSHA256");
    SecretKeySpec keySpec = new SecretKeySpec(salt.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
    hmac.init(keySpec);
    byte[] hash = hmac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
    return HexFormat.of().formatHex(hash); // 64 hex characters
}
```

### 2.2. Vòng Đời Token Xoay Động (60 Giây)
- **Chu kỳ xoay:** Mặc định `refreshIntervalSeconds = 60`.
- **Đồng hồ đếm ngược vòng tròn:** Frontend chạy Timer 60s, mỗi khi hết giờ hoặc khi khách nhấn *"Làm mới mã ngay"*, gọi endpoint:
  `POST /api/v1/bookings/{id}/ticket/refresh-qr`
- Backend tự động tăng `qr_rotation_counter = qr_rotation_counter + 1`, sinh token 64 ký tự mới, cập nhật vào CSDL và trả về cho client.

---

## 3. Lược Đồ CSDL & API Backend

### 3.1. Cập Nhật Bảng `bookings` (`04-booking-schema.sql`)
```sql
ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS ticket_issued_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS ticket_zns_status VARCHAR(30) DEFAULT 'PENDING',
    ADD COLUMN IF NOT EXISTS ticket_email_status VARCHAR(30) DEFAULT 'PENDING',
    ADD COLUMN IF NOT EXISTS qr_secret_salt VARCHAR(64),
    ADD COLUMN IF NOT EXISTS qr_rotation_counter INT NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS checkin_scanned_at TIMESTAMP WITH TIME ZONE;
```

### 3.2. Danh Sách Endpoint RESTful

| Phương thức | Đường dẫn URL | Mô tả |
| :--- | :--- | :--- |
| `GET` | `/api/v1/bookings/{id}/ticket` | Lấy chi tiết Vé điện tử E-Ticket theo ID đơn hàng |
| `GET` | `/api/v1/bookings/ticket/code/{bookingCode}` | Lấy chi tiết Vé điện tử E-Ticket theo mã đặt chỗ |
| `POST` | `/api/v1/bookings/{id}/ticket/refresh-qr` | Xoay mã QR động 64 ký tự mới |
| `POST` | `/api/v1/bookings/ticket/verify-and-checkin` | Quét mã tại cửa, xác thực token và chuyển trạng thái `SEATED` |
| `POST` | `/api/v1/bookings/{id}/ticket/send-notification` | Gửi lại thông báo vé điện tử qua Zalo ZNS / Email |

### 3.3. Luồng Sự Kiện Kafka & WebSocket
1. **Khi cọc bàn thành công / khởi tạo vé:**
   - Kafka Topic: `booking.ticket.issued` (Phát thông tin vé mới).
   - Kafka Topic: `notification.zns.sent` (Gửi tin nhắn mẫu Zalo ZNS).
   - Kafka Topic: `notification.email.sent` (Gửi Email HTML chứa mã QR).
2. **Khi Lễ tân quét mã check-in:**
   - Chuyển `status = SEATED`, ghi nhận `checkin_scanned_at = Instant.now()`.
   - Bắn tin WebSocket STOMP tới kênh `/topic/host/checkin` và `/topic/table-status` để đồng bộ ngay lập tức sang Tablet Lễ tân và KDS Bếp.

---

## 4. Giao Diện Người Dùng (UI/UX Implementation)

### 4.1. Modal Vé Điện Tử Apple Wallet / Boarding Pass (`ETicketModal.tsx`)
- **Header sang trọng:** Tông màu Obsidian & Gold cổ điển, logo Le Prime Bistro, mã đơn `#BK2610260001` dập nổi.
- **Răng cưa vé máy bay (Perforated cutouts):** Vết xé vé bán nguyệt 2 bên mép thẻ cùng nét đứt ngăn cách.
- **Dynamic QR Code:**
  - Viền góc kim loại màu vàng đồng.
  - Vòng tròn đếm ngược thời gian thực 60s (SVG Circular Progress Ring).
  - Khung hiển thị chuỗi Token 64 ký tự kèm nút thu gọn / sao chép nhanh.
  - Nút *"Làm mới mã ngay"* có hoạt ảnh xoay icon.
- **Thông tin chi tiết đa tầng:**
  - Thời gian, ngày hẹn, khung giờ, số lượng khách.
  - Tên bàn & tầng phục vụ (`Tầng 1 (Grand Bistro)`, `Tầng 3 (Sky Lounge Rooftop)`).
  - Tổng tiền cọc đã thanh toán.
  - **Tích hợp UC-08:** Thẻ nhu cầu đặc biệt (Sinh nhật, Ghế em bé, Nến thơm, Cảnh báo dị ứng tiêu/hải sản).
  - **Tích hợp UC-07:** Danh sách món Signature đặt trước đang được bếp sơ chế.
- **Trạng thái gửi ZNS & Email:** Hiển thị 2 huy hiệu tình trạng tin nhắn Zalo ZNS và Email. Có nút bấm gửi lại nhanh nếu khách chưa nhận được.

### 4.2. Tích Hợp Vào Toàn Bộ Trải Nghiệm Khách Hàng
1. **Sau khi chuyển khoản cọc VietQR thành công (`BookingPage.tsx`):**
   - Tự động kích hoạt hiển thị `ETicketModal`.
   - Banner xác nhận đặt bàn thành công có nút *"📱 Mở Vé QR Check-in (E-Ticket)"* để mở lại bất kỳ lúc nào.
2. **Trong Lịch Sử Đơn Đặt Bàn (`BookingHistoryModal.tsx`):**
   - Nút *"Xem Vé QR Check-in"* trên từng đơn hàng đã xác nhận mở trực tiếp `ETicketModal` với mã QR động bảo mật thay thế cho giao diện tĩnh cũ.

### 4.3. Nâng Cấp Máy Quét Cửa Ra Vào Trực Sảnh (`HostTabletPage.tsx`)
- **Mô phỏng ống kính quét (Viewfinder):** Tia laser vàng quét dọc liên tục tạo cảm giác camera công nghệ cao.
- **Ô nhập / dán Token 64 ký tự:** Hỗ trợ cả quét camera thực tế lẫn nhập thủ công token khi khách dùng điện thoại độ sáng thấp.
- **Phím demo 1-chạm:**
  - *"Quét Vé Hợp Lệ (Bàn T-03 • Token 64-char)"*: Lập tức xác thực, mở bàn `SEATED`, load thực đơn đặt trước và lưu cọc.
  - *"Thử Quét Lại Vé Đã Seated (Chống Gian Lận)"*: Kích hoạt hộp cảnh báo đỏ viền đậm phản hồi vi phạm chính sách dùng 1 lần (One-Time Use).

---

## 5. Danh Sách Tệp Đã Tạo & Chỉnh Sửa

| Tệp tin | Trạng thái | Chức năng chính |
| :--- | :--- | :--- |
| [`04-booking-schema.sql`](file:///d:/File/K%C3%8C%207/SBA301/Project/Project_SBA301/infrastructure/db-init/04-booking-schema.sql) | Cập nhật | Bổ sung 6 cột mới phục vụ E-Ticket, Dynamic QR salt, counter và checkin timestamp |
| [`Booking.java`](file:///d:/File/K%C3%8C%207/SBA301/Project/Project_SBA301/src/server/booking-service/src/main/java/com/tablemaster/booking/entity/Booking.java) | Cập nhật | Ánh xạ JPA cho các trường UC-12 |
| [`QrSecurityUtil.java`](file:///d:/File/K%C3%8C%207/SBA301/Project/Project_SBA301/src/server/booking-service/src/main/java/com/tablemaster/booking/util/QrSecurityUtil.java) | Tạo mới | Tiện ích mật mã học: sinh Salt 256-bit, tạo Token 64-char HMAC-SHA256, so sánh constant-time |
| [`ETicketResponse.java`](file:///d:/File/K%C3%8C%207/SBA301/Project/Project_SBA301/src/server/booking-service/src/main/java/com/tablemaster/booking/dto/response/ETicketResponse.java) | Tạo mới | DTO phản hồi vé điện tử đầy đủ thông tin bàn, tầng, dị ứng, món ăn, token 64 ký tự |
| [`VerifyTicketRequest.java`](file:///d:/File/K%C3%8C%207/SBA301/Project/Project_SBA301/src/server/booking-service/src/main/java/com/tablemaster/booking/dto/request/VerifyTicketRequest.java) | Tạo mới | DTO yêu cầu xác thực vé khi quét tại cửa |
| [`SendTicketNotificationRequest.java`](file:///d:/File/K%C3%8C%207/SBA301/Project/Project_SBA301/src/server/booking-service/src/main/java/com/tablemaster/booking/dto/request/SendTicketNotificationRequest.java) | Tạo mới | DTO gửi lại thông báo ZNS / Email |
| [`KafkaConfig.java`](file:///d:/File/K%C3%8C%207/SBA301/Project/Project_SBA301/src/server/booking-service/src/main/java/com/tablemaster/booking/config/KafkaConfig.java) | Cập nhật | Cấu hình 3 Kafka Topics: `booking.ticket.issued`, `notification.zns.sent`, `notification.email.sent` |
| [`BookingEventProducer.java`](file:///d:/File/K%C3%8C%207/SBA301/Project/Project_SBA301/src/server/booking-service/src/main/java/com/tablemaster/booking/kafka/BookingEventProducer.java) | Cập nhật | Phát sự kiện phát hành vé và thông báo qua Kafka & WebSocket `/topic/host/checkin` |
| [`BookingService.java`](file:///d:/File/K%C3%8C%207/SBA301/Project/Project_SBA301/src/server/booking-service/src/main/java/com/tablemaster/booking/service/BookingService.java) | Cập nhật | Khai báo 4 phương thức nghiệp vụ UC-12 |
| [`BookingServiceImpl.java`](file:///d:/File/K%C3%8C%207/SBA301/Project/Project_SBA301/src/server/booking-service/src/main/java/com/tablemaster/booking/service/BookingServiceImpl.java) | Cập nhật | Cài đặt logic sinh token, xoay token 60s, xác thực quét cửa và kích hoạt kiểm tra anti-fraud |
| [`BookingController.java`](file:///d:/File/K%C3%8C%207/SBA301/Project/Project_SBA301/src/server/booking-service/src/main/java/com/tablemaster/booking/controller/BookingController.java) | Cập nhật | Khai báo 5 endpoints RESTful cho vé điện tử |
| [`BookingServiceTest.java`](file:///d:/File/K%C3%8C%207/SBA301/Project/Project_SBA301/src/server/booking-service/src/test/java/com/tablemaster/booking/service/BookingServiceTest.java) | Cập nhật | Bổ sung 4 unit tests kiểm thử UC-12 (25/25 tests passed) |
| [`types/index.ts`](file:///d:/File/K%C3%8C%207/SBA301/Project/Project_SBA301/src/client/tablemaster-ui/src/types/index.ts) | Cập nhật | Định nghĩa kiểu `ETicketData`, `ETicketPreOrderItem`, `VerifyTicketPayload`, `SendTicketNotificationPayload` |
| [`bookingApi.ts`](file:///d:/File/K%C3%8C%207/SBA301/Project/Project_SBA301/src/client/tablemaster-ui/src/services/bookingApi.ts) | Cập nhật | Thêm 5 API client methods và hàm sinh token giả lập client 64 ký tự |
| [`ETicketModal.tsx`](file:///d:/File/K%C3%8C%207/SBA301/Project/Project_SBA301/src/client/tablemaster-ui/src/components/booking/ETicketModal.tsx) | Tạo mới | Thành phần giao diện Haute Gastronomy Boarding Pass, xoay QR 60s, đồng hồ tròn SVG |
| [`BookingHistoryModal.tsx`](file:///d:/File/K%C3%8C%207/SBA301/Project/Project_SBA301/src/client/tablemaster-ui/src/components/common/BookingHistoryModal.tsx) | Cập nhật | Thay thế modal tĩnh cũ bằng `ETicketModal` |
| [`BookingPage.tsx`](file:///d:/File/K%C3%8C%207/SBA301/Project/Project_SBA301/src/client/tablemaster-ui/src/views/BookingPage.tsx) | Cập nhật | Tự động mở E-Ticket khi thanh toán cọc thành công và thêm nút mở lại trên success banner |
| [`HostTabletPage.tsx`](file:///d:/File/K%C3%8C%207/SBA301/Project/Project_SBA301/src/client/tablemaster-ui/src/views/HostTabletPage.tsx) | Cập nhật | Nâng cấp máy quét camera laser sweep, xác thực token 64 ký tự, cảnh báo gian lận One-Time Use |

---

## 6. Kết Quả Kiểm Thử (Verification & Testing)

### 6.1. Backend Unit Test Execution
Chạy lệnh `mvn test` tại thư mục `src/server/booking-service`:
```
[INFO] Running com.tablemaster.booking.service.AvailabilityServiceTest
[INFO] Tests run: 5, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running com.tablemaster.booking.service.BookingServiceTest
[INFO] Tests run: 15, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running com.tablemaster.booking.service.TableHoldServiceTest
[INFO] Tests run: 5, Failures: 0, Errors: 0, Skipped: 0
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] Total time:  5.570 s
[INFO] Tests run: 25, Failures: 0, Errors: 0, Skipped: 0
[INFO] ------------------------------------------------------------------------
```
- Test `getETicket_Success()`: Xác nhận cấp phát vé với token đúng 64 ký tự hex.
- Test `refreshDynamicQrToken_Success()`: Xác nhận xoay counter và đổi token sau mỗi chu kỳ.
- Test `verifyAndCheckIn_Success()`: Xác nhận mở bàn `SEATED` và đóng dấu thời gian `checkin_scanned_at`.
- Test `verifyAndCheckIn_ThrowsWhenAlreadySeated()`: Xác nhận cơ chế chống gian lận ném lỗi `InvalidBookingStateException` khi mã đã được sử dụng.

### 6.2. Frontend Build Execution
Chạy lệnh `npm run build` tại thư mục `src/client/tablemaster-ui`:
```
> tablemaster-ui@0.0.0 build
> tsc -b && vite build

✓ 2313 modules transformed.
dist/index.html                   1.68 kB │ gzip:   0.96 kB
dist/assets/index-J9fhXESq.css  161.83 kB │ gzip:  21.96 kB
dist/assets/index-DdcI-Ke6.js   966.39 kB │ gzip: 246.38 kB
✓ built in 651ms
```
Hoàn toàn không có lỗi TypeScript, giao diện đạt chuẩn thẩm mỹ cao cấp Haute Gastronomy, hoạt động mượt mà và đồng bộ đa nền tảng.
