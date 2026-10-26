# BÁO CÁO PHÂN TÍCH KỸ THUẬT & CODE WALKTHROUGH
## USE CASE UC-07: CHỌN MÓN ĂN SIGNATURE ĐẶT TRƯỚC (PRE-ORDER SIGNATURE MENU)
### HỆ THỐNG: TABLEMASTER – NỀN TẢNG ĐẶT BÀN & QUẢN TRỊ SẢNH NHÀ HÀNG

> **Mã Use Case:** UC-07  
> **Tên chức năng:** Chọn Món ăn Signature Đặt trước (Pre-order Signature Menu)  
> **Phân hệ phụ trách:** Module 3 (`booking-service` - Port 8083), Module 2 (`restaurant-service` - Port 8082) & Frontend Client (`tablemaster-ui`)  
> **Phiên bản:** 1.0.0 (Release-Ready)  
> **Tác giả:** Đội ngũ Kỹ sư Phát triển Hệ thống TableMaster  

---

## MỤC LỤC
1. [Tổng Quan Nghiệp Vụ & Bối Cảnh Kiến Trúc](#1-tổng-quan-nghiệp-vụ--bối-cảnh-kiến-trúc)
2. [Sơ Đồ & Giải Thích Luồng Đi Toàn Diện (End-to-End Flow)](#2-sơ-đồ--giải-thích-luồng-đi-toàn-diện-end-to-end-flow)
3. [Phân Tích Chi Tiết Từng Dòng Code Đã Viết Trong Hệ Thống](#3-phân-tích-chi-tiết-từng-dòng-code-đã-viết-trong-hệ-thống)
   - [3.1. Cấu Trúc Cơ Sở Dữ Liệu (Database Schema Initializers)](#31-cấu-trúc-cơ-sở-dữ-liệu-database-schema-initializers)
   - [3.2. Lớp Thực Thể & DTO Backend (Spring Boot 3)](#32-lớp-thực-thể--dto-backend-spring-boot-3)
   - [3.3. Xử Lý Nghiệp Vụ Cốt Lõi Tại Service (BookingServiceImpl.java)](#33-xử-lý-nghiệp-vụ-cốt-lõi-tại-service-bookingserviceimpljava)
   - [3.4. Kiến Trúc Hướng Sự Kiện Kafka Outbox (BookingEventProducer.java)](#34-kiến-trúc-hướng-sự-kiện-kafka-outbox-bookingeventproducerjava)
   - [3.5. Xuất Hóa Đơn Điện Tử PDF A4 (InvoicePdfService.java)](#35-xuất-hóa-đơn-điện-tử-pdf-a4-invoicepdfservicejava)
   - [3.6. Kiểm Thử Đơn Vị Tự Động (BookingServiceTest.java)](#36-kiểm-thử-đơn-vị-tự-động-bookingservicetestjava)
   - [3.7. Giao Diện Người Dùng & Tích Hợp Client (Frontend React/Vite)](#37-giao-diện-người-dùng--tích-hợp-client-frontend-reactvite)
4. [Đánh Giá Chất Lượng & Kết Quả Kiểm Thử Hệ Thống](#4-đánh-giá-chất-lượng--kết-quả-kiểm-thử-hệ-thống)
5. [Ý Kiến & Đề Xuất Phát Triển Mở Rộng (Future Roadmap)](#5-ý-kiến--đề-xuất-phát-triển-mở-rộng-future-roadmap)

---

## 1. TỔNG QUAN NGHIỆP VỤ & BỐI CẢNH KIẾN TRÚC

### 1.1. Tại sao cần đặt trước món Signature trong nhà hàng cao cấp?
Trong mô hình Fine Dining và Bistro cao cấp (*Le Prime Bistro & Lounge*), các món ăn đỉnh cao độc quyền (Signature Dishes) không thể chuẩn bị tức thì như các món thông thường:
- **Thịt Bò Wagyu A5 Miyazaki:** Cần thời gian đưa về nhiệt độ phòng lý tưởng, sau đó ủ nhiệt chân không (Sous-vide) chuẩn 54°C trong 45 phút và áp chảo bơ thảo mộc trên than hồng ngay trước giờ khách dùng bữa.
- **Rượu Vang Đỏ Château Margaux Grand Cru:** Rượu vang danh giá cần được chiết ra bình thở pha lê (Decanter) trước 30–45 phút để oxy hóa, làm mềm tanin và bung tỏa hương vị quả mọng phức hợp, kèm ướp nhiệt độ chuẩn 16°C.
- **Bánh Kem Sinh Nhật Thiết Kế Riêng:** Đòi hỏi nghệ nhân làm bánh viết tay thông điệp riêng theo tên chủ tiệc và chuẩn bị nến trước giờ khai tiệc.

### 1.2. Nghiệp vụ cộng dồn tiền cọc chống No-Show (Deposit Accumulation)
Nếu khách hàng đặt trước các món nguyên liệu đắt đỏ này nhưng không đến (No-show), nhà hàng sẽ chịu tổn thất tài chính cực lớn (hỏng thịt Wagyu rã đông, lãng phí chai vang đắt tiền, bánh kem bị hủy). Do đó:
$$\mathbf{Total\ Deposit\ (Tổng\ Cọc\ VietQR)} = \mathbf{Base\ Table\ Deposit\ (Cọc\ Bàn)} + \sum (\mathbf{UnitPrice}_i \times \mathbf{Quantity}_i)$$
- **Tiền cọc giữ bàn tiêu chuẩn:** 200.000 đ (hoặc cọc tùy chỉnh của phòng VIP).
- **Tiền cọc món ăn Signature:** Bắt buộc thu **100% giá trị món** để bảo hiểm nguyên liệu.
- Khoản cọc này được **khấu trừ 100% vào hóa đơn tổng** khi khách dùng bữa tại nhà hàng.

### 1.3. Thiết kế kiến trúc Microservices Autonomous & Snapshot Pattern
- `booking-service` (quản lý đơn đặt bàn, DB `tablemaster_booking`) và `restaurant-service` (quản lý thực đơn nhà hàng, DB `tablemaster_restaurant`) là 2 microservices độc lập chạy ở 2 cơ sở dữ liệu riêng biệt.
- **Quyết định thiết kế:** Thay vì thực hiện HTTP Call đồng bộ sang `restaurant-service` mỗi lần xem lịch sử đơn hay in hóa đơn, chúng ta áp dụng **Snapshot Pattern**: denormalize `item_name` và `notes` lưu trực tiếp trên bảng `booking_preorder_items`.
- **Lợi ích:** Đảm bảo tính tự chủ (Autonomous), tăng tốc độ truy vấn, và bảo toàn lịch sử đặt món ngay cả khi giá thực đơn hoặc tên món trong `restaurant-service` bị thay đổi trong tương lai.

---

## 2. SƠ ĐỒ & GIẢI THÍCH LUỒNG ĐI TOÀN DIỆN (END-TO-END FLOW)

### 2.1. Sơ đồ tuần tự (Sequence Diagram)

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Thực Khách (Customer)
    participant UI as Giao Diện Đặt Bàn (BookingPage.tsx)
    participant API as bookingApi.ts (Client Service)
    participant Controller as BookingController (8083)
    participant Service as BookingServiceImpl
    participant DB as PostgreSQL (tablemaster_booking)
    participant Kafka as Outbox Kafka (BOOKING_CREATED)
    participant VietQR as Modal VietQR (QRPaymentModal.tsx)
    participant PDF as InvoicePdfService (iText 7)

    %% Giai đoạn 1: Lựa chọn
    Note over Customer, UI: GIAI ĐOẠN 1: CHỌN MÓN SIGNATURE & TÙY BIẾN CÔNG PHU
    Customer->>UI: Chọn bàn, giờ & tick chọn món Signature (Wagyu A5, Château Margaux, Bánh sinh nhật)
    Customer->>UI: Chọn độ chín Steak (Medium-Rare), Decant 45p, Nhập lời chúc bánh kem
    UI->>UI: Tự động cộng dồn: GrandTotal = Cọc bàn (200k) + Món ăn (8.550.000) = 8.750.000 đ
    
    %% Giai đoạn 2: Tiếp nhận & Lưu trữ
    Note over Customer, DB: GIAI ĐOẠN 2: TIẾP NHẬN ĐƠN & TÍNH TOÁN CỌC TẠI BACKEND
    Customer->>UI: Bấm "Xác Nhận & Thanh Toán Cọc"
    UI->>API: createBooking(payload kèm preorderItems, itemName, notes, totalDeposit)
    API->>Controller: POST /api/v1/bookings
    Controller->>Service: createBooking(request)
    Service->>Service: Tính preorderTotal = sum(unitPrice * quantity)
    Service->>Service: accumulatedTotalDeposit = tableDeposit + preorderTotal (8.750.000 đ)
    Service->>DB: INSERT INTO bookings (total_deposit = 8750000)
    Service->>DB: INSERT INTO booking_preorder_items (item_name, unit_price, subtotal, notes)
    Service->>DB: INSERT INTO outbox_events (BOOKING_CREATED mang danh sách món Signature)
    Service-->>Controller: BookingResponse
    Controller-->>API: 201 Created
    API-->>UI: Trả về bookingCode & grandTotal = 8.750.000 đ

    %% Giai đoạn 3: Thanh toán VietQR
    Note over Customer, VietQR: GIAI ĐOẠN 3: THANH TOÁN VIETQR CỘNG DỒN
    UI->>VietQR: Mở QRPaymentModal với số tiền VietQR = 8.750.000 đ
    Customer->>VietQR: Quét mã QR chuyển khoản ngân hàng
    Customer->>VietQR: Bấm "Tôi đã chuyển khoản thành công"
    VietQR->>API: approveBookingDeposit(id, grandTotal=8750000)
    API->>Controller: POST /api/v1/bookings/{id}/approve-deposit
    Controller->>Service: approveAndRequestDeposit(id, 8750000)
    Service->>DB: UPDATE bookings SET status = 'CONFIRMED'
    
    %% Giai đoạn 4: Hậu xử lý & Hóa đơn
    Note over Customer, PDF: GIAI ĐOẠN 4: THÔNG BÁO BẾP & XUẤT HÓA ĐƠN PDF ĐIỆN TỬ
    Kafka-->>Kitchen: Bếp nhận sự kiện BOOKING_CREATED: Bắt đầu ủ nhiệt Wagyu & Decant rượu
    Customer->>UI: Bấm "Tải Hóa Đơn Cọc (PDF)"
    UI->>API: downloadInvoicePdf(bookingId)
    API->>Controller: GET /api/v1/bookings/{id}/invoice-pdf
    Controller->>Service: generateDepositInvoicePdf(bookingId)
    Service->>PDF: generatePdf(booking)
    Note over PDF: iText 7 sinh bảng chi tiết phân tách:<br/>1. Cọc giữ bàn (200.000 đ)<br/>2. Từng dòng món ăn + [Yêu cầu công phu]<br/>3. Tổng cọc: 8.750.000 đ
    PDF-->>Controller: byte[] PDF
    Controller-->>Customer: Trình duyệt tải về hóa đơn PDF A4 cao cấp
```

---

## 3. PHÂN TÍCH CHI TIẾT TỪNG DÒNG CODE ĐÃ VIẾT TRONG HỆ THỐNG

### 3.1. Cấu Trúc Cơ Sở Dữ Liệu (Database Schema Initializers)

#### File: `infrastructure/db-init/04-booking-schema.sql`
```sql
CREATE TABLE booking_preorder_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL, -- Ref tablemaster_restaurant.menu_items(id)
    item_name VARCHAR(150),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
    subtotal NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0),
    notes TEXT
);
```
- **Dòng code làm gì:**
  - `item_name VARCHAR(150)`: Lưu tên món ăn tại thời điểm khách đặt hàng (Snapshot). Tránh việc sau này nhà hàng đổi tên món làm sai lệch lịch sử đơn cũ.
  - `notes TEXT`: Lưu toàn bộ ghi chú chuẩn bị công phu (ví dụ: *"Độ chín: Medium-Rare, Ủ nhiệt 45 phút Sous-vide & áp chảo gang"* hoặc *"Ghi chữ bánh: Happy Birthday Minh Anh"*).
  - `unit_price` & `subtotal`: Lưu trữ giá tại thời điểm đặt, bảo toàn số tiền đã cọc.

#### File: `infrastructure/db-init/03-restaurant-schema.sql`
```sql
('b5000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', 
 'Bánh Kem Sinh Nhật Thiết Kế Riêng', 
 'Bánh kem tươi cao cấp được thiết kế riêng theo yêu cầu, ghi chữ và thông điệp sinh nhật theo tên chủ tiệc kèm nến sinh nhật', 
 900000, 
 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80', 
 'DESSERT', true, 120, true, 5)
```
- **Dòng code làm gì:** Seed món ăn thứ 5 vào thực đơn nhà hàng với UUID cố định `b5000000-0000-0000-0000-000000000005`, đơn giá 900.000 đ, thời gian chuẩn bị 120 phút (`prep_time_minutes`), cờ `is_signature = true` để hệ thống nhận diện đây là món đặc biệt cần cọc.

---

### 3.2. Lớp Thực Thể & DTO Backend (Spring Boot 3)

#### File: `src/server/booking-service/.../entity/BookingPreorderItem.java`
```java
@Column(name = "item_name", length = 150)
private String itemName;

@Column(name = "notes", columnDefinition = "TEXT")
private String notes;
```
- **Dòng code làm gì:** Khai báo ánh xạ JPA/Hibernate cho 2 cột mới. Thuộc tính `notes` sử dụng `columnDefinition = "TEXT"` cho phép chứa văn bản dài linh hoạt mà không bị giới hạn 255 ký tự của `VARCHAR`.

#### File: `src/server/booking-service/.../dto/request/PreorderItemRequest.java`
```java
@NotBlank(message = "Item name is required for snapshot")
private String itemName;

private String notes;
```
- **Dòng code làm gì:** Tiếp nhận dữ liệu món ăn và ghi chú công phu từ client thông qua API request JSON.

#### File: `src/server/booking-service/.../dto/response/BookingResponse.java`
```java
public static PreorderItemResponse fromEntity(BookingPreorderItem item) {
    return PreorderItemResponse.builder()
            .id(item.getId())
            .menuItemId(item.getMenuItemId())
            .itemName(item.getItemName())
            .quantity(item.getQuantity())
            .unitPrice(item.getUnitPrice())
            .subtotal(item.getSubtotal())
            .notes(item.getNotes())
            .build();
}
```
- **Dòng code làm gì:** Mapper chuyển đổi từ Entity sang DTO trả về cho client. Đảm bảo client nhận được `itemName` và `notes` để hiển thị trong lịch sử và chi tiết đơn.

---

### 3.3. Xử Lý Nghiệp Vụ Cốt Lõi Tại Service (BookingServiceImpl.java)

Toàn bộ logic tính toán tiền cọc cộng dồn và lưu snapshot được tập trung tại `createBooking`:

```java
// 5. Lưu món ăn đặt trước và tính cộng dồn tiền cọc món ăn vào tổng hóa đơn cọc (UC-07)
BigDecimal preorderTotal = BigDecimal.ZERO;
if (request.getPreorderItems() != null && !request.getPreorderItems().isEmpty()) {
    for (PreorderItemRequest itemReq : request.getPreorderItems()) {
        BigDecimal subtotal = itemReq.getUnitPrice().multiply(BigDecimal.valueOf(itemReq.getQuantity()));
        preorderTotal = preorderTotal.add(subtotal);

        BookingPreorderItem item = BookingPreorderItem.builder()
                .booking(savedBooking)
                .menuItemId(itemReq.getMenuItemId())
                .itemName(itemReq.getItemName())
                .quantity(itemReq.getQuantity())
                .unitPrice(itemReq.getUnitPrice())
                .subtotal(subtotal)
                .notes(itemReq.getNotes())
                .build();
        savedBooking.getPreorderItems().add(item);
    }
}

// Tính tổng tiền cọc cộng dồn: Tiền cọc giữ bàn + Tiền cọc các món Signature đặt trước (UC-07)
BigDecimal tableDeposit;
if (request.getTotalDeposit() != null && request.getTotalDeposit().compareTo(BigDecimal.ZERO) > 0) {
    if (request.getTotalDeposit().compareTo(preorderTotal) >= 0) {
        // Client đã gửi tổng cọc (gồm cọc bàn + cọc món) -> tách riêng phần cọc bàn
        tableDeposit = request.getTotalDeposit().subtract(preorderTotal);
    } else {
        // Client gửi riêng khoản cọc bàn
        tableDeposit = request.getTotalDeposit();
    }
} else {
    // Mức cọc bàn tiêu chuẩn Le Prime Bistro mặc định là 200,000 VND
    tableDeposit = BigDecimal.valueOf(200000);
}

BigDecimal accumulatedTotalDeposit = tableDeposit.add(preorderTotal);
savedBooking.setTotalDeposit(accumulatedTotalDeposit);

savedBooking = bookingRepository.save(savedBooking);
```

- **Giải thích chi tiết từng đoạn code:**
  1. `BigDecimal preorderTotal = BigDecimal.ZERO;`: Khởi tạo biến tích lũy tổng tiền các món đặt trước bằng `BigDecimal` để đảm bảo độ chính xác tuyệt đối trong giao dịch tài chính (tránh lỗi làm tròn số thực của `double/float`).
  2. `BigDecimal subtotal = itemReq.getUnitPrice().multiply(...)`: Tính thành tiền cho từng món (`đơn giá x số lượng`).
  3. `savedBooking.getPreorderItems().add(item)`: Thêm món vào danh sách của `savedBooking`. Nhờ cấu hình `@OneToMany(cascade = CascadeType.ALL)`, JPA sẽ tự động phát sinh các câu lệnh `INSERT` vào bảng `booking_preorder_items` khi `savedBooking` được lưu.
  4. `if (request.getTotalDeposit().compareTo(preorderTotal) >= 0)`: Đoạn code thông minh xử lý cả 2 trường hợp:
     - Nếu Client gửi `grandTotal` (đã cộng cọc bàn + cọc món), hệ thống tự bóc tách phần `tableDeposit`.
     - Nếu Client chỉ gửi số tiền cọc bàn (hoặc không gửi gì), hệ thống tự động cộng dồn với `preorderTotal` để tạo ra `accumulatedTotalDeposit`.
  5. `savedBooking.setTotalDeposit(accumulatedTotalDeposit)`: Cập nhật trường `total_deposit` trên bảng `bookings`. Đây chính là số tiền sẽ được hiển thị trên mã VietQR.

---

### 3.4. Kiến Trúc Hướng Sự Kiện Kafka Outbox (BookingEventProducer.java)

```java
if (booking.getPreorderItems() != null && !booking.getPreorderItems().isEmpty()) {
    java.util.List<Map<String, Object>> items = booking.getPreorderItems().stream()
            .map(i -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", i.getId());
                map.put("menuItemId", i.getMenuItemId());
                map.put("itemName", i.getItemName());
                map.put("quantity", i.getQuantity());
                map.put("unitPrice", i.getUnitPrice());
                map.put("subtotal", i.getSubtotal());
                map.put("notes", i.getNotes());
                return map;
            })
            .collect(java.util.stream.Collectors.toList());
    payload.put("preorderItems", items);
}
```
- **Dòng code làm gì:** Khi một đơn đặt bàn mới được tạo, hàm `createBookingPayload` sẽ tuần tự hóa danh sách món đặt trước kèm ghi chú `notes` vào payload JSON của sự kiện `BOOKING_CREATED`.
- **Vai trò trong hệ thống:** Sự kiện này được lưu vào bảng `outbox_events` (Transactional Outbox Pattern) và bắn lên Kafka Topic `tablemaster.booking.created`. Nhờ đó, phân hệ Màn hình Quản lý Bếp (Kitchen Display System - KDS) có thể lắng nghe sự kiện này và kích hoạt quy trình chuẩn bị món trước giờ khách đến.

---

### 3.5. Xuất Hóa Đơn Điện Tử PDF A4 (InvoicePdfService.java)

```java
// Header bảng chi tiết 5 cột
Table itemsTable = new Table(UnitValue.createPercentArray(new float[]{10, 45, 15, 15, 15}));

// Dòng 1: Khoản cọc giữ bàn tiêu chuẩn
itemsTable.addCell(createCell(String.valueOf(itemIndex++), TextAlignment.CENTER));
itemsTable.addCell(createCell("Coc giu ban tieu chuan (" + booking.getGuestCount() + " khach)", TextAlignment.LEFT));
itemsTable.addCell(createCell("1", TextAlignment.CENTER));
itemsTable.addCell(createCell(currencyFormatter.format(tableDeposit) + " d", TextAlignment.RIGHT));
itemsTable.addCell(createCell(currencyFormatter.format(tableDeposit) + " d", TextAlignment.RIGHT));

// Dòng 2+: Danh sách món Signature đặt trước (UC-07)
if (booking.getPreorderItems() != null && !booking.getPreorderItems().isEmpty()) {
    for (BookingPreorderItem item : booking.getPreorderItems()) {
        String dishTitle = item.getItemName() != null && !item.getItemName().isBlank()
                ? item.getItemName()
                : "Mon Signature Dat Truoc (Pre-order Menu Item)";
        if (item.getNotes() != null && !item.getNotes().isBlank()) {
            dishTitle += "\n[Yeu cau cong phu: " + item.getNotes() + "]";
        }

        itemsTable.addCell(createCell(String.valueOf(itemIndex++), TextAlignment.CENTER));
        itemsTable.addCell(createCell(dishTitle, TextAlignment.LEFT));
        itemsTable.addCell(createCell(String.valueOf(item.getQuantity()), TextAlignment.CENTER));
        itemsTable.addCell(createCell(currencyFormatter.format(item.getUnitPrice()) + " d", TextAlignment.RIGHT));
        itemsTable.addCell(createCell(currencyFormatter.format(item.getSubtotal()) + " d", TextAlignment.RIGHT));
    }
}
```
- **Dòng code làm gì:** Sử dụng thư viện **iText 7** để vẽ bảng hóa đơn tiền cọc khổ A4 chuẩn hóa.
- **Điểm nổi bật:**
  - Tách bạch rõ ràng giữa khoản *Cọc giữ bàn tiêu chuẩn* và *Các món Signature*.
  - Ghép chuỗi ghi chú chuẩn bị công phu `[Yeu cau cong phu: ...]` ngay bên dưới tên món giúp hóa đơn vừa minh bạch về tiền tệ vừa có đầy đủ bằng chứng yêu cầu của khách hàng.

---

### 3.6. Kiểm Thử Đơn Vị Tự Động (BookingServiceTest.java)

```java
@Test
@DisplayName("UC-07: Đặt trước món ăn Signature cộng dồn tiền cọc vào tổng hóa đơn cọc VietQR")
void createBooking_WithSignaturePreorderDishes_AccumulatesTotalDeposit() {
    // 1. Tạo 3 món Signature: Wagyu A5 (1.850k), Margaux 2018 (5.800k), Bánh sinh nhật (900k)
    PreorderItemRequest wagyu = PreorderItemRequest.builder()
            .menuItemId(UUID.fromString("b5000000-0000-0000-0000-000000000001"))
            .itemName("Thăn Bò Wagyu A5 Miyazaki (Ủ nhiệt 45 phút)")
            .quantity(1)
            .unitPrice(BigDecimal.valueOf(1850000))
            .notes("Độ chín: Medium-Rare, Ủ nhiệt 45 phút Sous-vide")
            .build();
    // ...
    // Tổng 3 món = 1.850.000 + 5.800.000 + 900.000 = 8.550.000 VND
    // Cọc bàn tiêu chuẩn = 200.000 VND -> Tổng cọc = 8.750.000 VND

    BookingResponse response = bookingService.createBooking(request);

    // Assert kiểm tra kết quả
    assertThat(response.getTotalDeposit()).isEqualByComparingTo(BigDecimal.valueOf(8750000));
    assertThat(response.getPreorderItems()).hasSize(3);
    assertThat(response.getPreorderItems().get(0).getNotes()).contains("Medium-Rare");
    verify(bookingEventProducer, times(1)).publishBookingCreated(any(Booking.class));
}
```
- **Dòng code làm gì:** Kiểm thử đơn vị cô lập logic của `BookingServiceImpl`.
- **Kết quả:** Kiểm tra tính đúng đắn của phép cộng dồn 8.750.000 đ, xác nhận ghi chú được lưu trữ chính xác và sự kiện Kafka được bắn thành công. Chạy bằng lệnh:
  ```bash
  mvn test -Dtest=BookingServiceTest
  ```
  Kết quả đạt **7/7 tests passed**, không phát sinh bất kỳ lỗi nào.

---

### 3.7. Giao Diện Người Dùng & Tích Hợp Client (Frontend React/Vite)

#### File: `src/client/tablemaster-ui/src/services/bookingApi.ts`
```typescript
export const MENU_ITEMS = {
  WAGYU_A5: 'b5000000-0000-0000-0000-000000000001',
  TOMAHAWK: 'b5000000-0000-0000-0000-000000000002',
  MARGAUX_WINE: 'b5000000-0000-0000-0000-000000000004',
  BIRTHDAY_CAKE: 'b5000000-0000-0000-0000-000000000005',
};

export const getDishUUID = (dishId: string): string => {
  if (dishId === 'dish-1') return MENU_ITEMS.WAGYU_A5;
  if (dishId === 'wine-1') return MENU_ITEMS.MARGAUX_WINE;
  if (dishId === 'cake-1') return MENU_ITEMS.BIRTHDAY_CAKE;
  return MENU_ITEMS.WAGYU_A5;
};
```
- **Dòng code làm gì:** Ánh xạ ID giao diện người dùng (`dish-1`, `wine-1`, `cake-1`) sang định dạng UUID chuẩn `b5000000-...` trong cơ sở dữ liệu PostgreSQL.

#### File: `src/client/tablemaster-ui/src/views/BookingPage.tsx`
1. **Quản lý ghi chú tùy biến công phu:**
   ```typescript
   const [dishNotes, setDishNotes] = useState<Record<string, string>>({});
   
   const handleUpdateDishNote = (dishId: string, note: string) => {
     setDishNotes((prev) => ({
       ...prev,
       [dishId]: note,
     }));
   };
   ```
2. **Bộ chọn độ chín Steak & Ủ nhiệt 45 phút:**
   ```tsx
   {['Medium-Rare (Khuyên dùng)', 'Rare (Tái)', 'Medium (Vừa)', 'Well-Done'].map((opt) => (
     <button
       key={opt}
       onClick={() => handleUpdateDishNote(dish.id, `Độ chín: ${opt}, Ủ nhiệt 45 phút Sous-vide & áp chảo gang`)}
       className={isCurrent ? 'bg-amber-600 text-white' : 'bg-white text-stone-700'}
     >
       {opt}
     </button>
   ))}
   ```
3. **Bộ chọn thời gian thở rượu Decanter:**
   ```tsx
   {['Decant thở 30 phút (Khuyên dùng)', 'Decant thở 45 phút', 'Mở tại bàn', 'Ướp xô đá (16°C)'].map((opt) => (
     <button
       key={opt}
       onClick={() => handleUpdateDishNote(dish.id, `Chiết thở vang: ${opt}`)}
       className={isCurrent ? 'bg-amber-600 text-white' : 'bg-white text-stone-700'}
     >
       {opt}
     </button>
   ))}
   ```
4. **Ô nhập viết tên trên bánh kem sinh nhật:**
   ```tsx
   <input
     type="text"
     value={dishNotes[dish.id] || ''}
     onChange={(e) => handleUpdateDishNote(dish.id, e.target.value)}
     placeholder="VD: Chúc Mừng Sinh Nhật Minh Anh 26th (Cắm nến số 26)"
   />
   ```
5. **Khung tóm tắt cộng dồn tiền cọc:**
   ```tsx
   <div className="text-[11px] text-stone-600 flex items-center gap-2">
     <span>Cọc bàn: <strong>{format(depositRequired)} đ</strong></span>
     <span>+</span>
     <span>Cọc món Signature: <strong>{format(dishesTotal)} đ</strong></span>
     <span>=</span>
     <span className="font-bold text-amber-900 bg-amber-200/60 px-2 py-0.5 rounded">
       Tổng cọc VietQR: {format(grandTotal)} đ
     </span>
   </div>
   ```

#### File: `src/client/tablemaster-ui/src/components/common/QRPaymentModal.tsx`
```tsx
{booking.preOrders && booking.preOrders.length > 0 && (
  <div className="mt-2.5 pt-2 border-t border-amber-200/80 space-y-1.5 text-[11px]">
    <div className="flex justify-between text-stone-600">
      <span>• Tiền cọc giữ bàn ({booking.tableCode}):</span>
      <span className="font-mono font-bold text-stone-900">{format(tableDeposit)} đ</span>
    </div>
    <div className="flex justify-between text-amber-900 font-semibold">
      <span>• Cọc món Signature đặt trước ({totalDishesQty} phần):</span>
      <span className="font-mono font-bold text-amber-800">{format(dishesDeposit)} đ</span>
    </div>
    {/* Danh sách từng món & ghi chú */}
    {booking.preOrders.map((p, idx) => (
      <div key={idx} className="text-[10px] text-stone-600 leading-tight">
        <span className="font-bold text-amber-800">{p.quantity}x {p.dish.name}</span>
        {p.preparationNotes && (
          <span className="block text-stone-500 italic pl-2">↳ Yêu cầu: {p.preparationNotes}</span>
        )}
      </div>
    ))}
  </div>
)}
```
- **Dòng code làm gì:** Hiển thị trực quan bên dưới mã QR thanh toán bảng diễn giải chi tiết từng đồng tiền cọc. Khách hàng hiểu rõ số tiền quét mã QR gồm những khoản nào, tạo dựng niềm tin tuyệt đối khi thực hiện thanh toán giao dịch giá trị cao.

---

## 4. ĐÁNH GIÁ CHẤT LƯỢNG & KẾT QUẢ KIỂM THỬ HỆ THỐNG

| Hạng mục kiểm thử | Công cụ / Lệnh thực hiện | Kết quả thực tế | Trạng thái |
| :--- | :--- | :--- | :---: |
| **Backend Unit Tests** | `mvn test -Dtest=BookingServiceTest` | 7/7 tests passed (100%), 0 lỗi, 0 cảnh báo | **PASSED** |
| **Frontend Type Checking** | `npx tsc --noEmit` tại `tablemaster-ui` | 0 compilation errors, tương thích 100% | **PASSED** |
| **Cộng dồn tiền cọc** | Kiểm tra phép tính: 200k bàn + 8.550k món | Ra đúng 8.750.000 đ trên DB, VietQR, và PDF | **PASSED** |
| **Lưu trữ ghi chú chuẩn bị** | Kiểm tra DB snapshot cột `notes` | Lưu trọn vẹn văn bản độ chín, decant, tên bánh | **PASSED** |
| **Sự kiện Kafka Outbox** | Kiểm tra bảng `outbox_events` | Payload chứa đầy đủ mảng `preorderItems` | **PASSED** |

---

## 5. Ý KIẾN & ĐỀ XUẤT PHÁT TRIỂN MỞ RỘNG (FUTURE ROADMAP)

Để đưa hệ thống lên tầm cao của một sản phẩm thương mại hoặc đề tài đạt điểm tối đa (A+), tôi xin đề xuất **5 ý tưởng mở rộng mang tính đột phá**:

### 💡 1. Màn Hình Quản Trị Bếp Thông Minh (Kitchen Display System - KDS Realtime Countdown)
- **Vấn đề:** Hiện tại thông tin món đặt trước mới chỉ được bắn vào sự kiện Kafka. Nếu đầu bếp không mở kiểm tra thì vẫn có nguy cơ quên ủ nhiệt thịt bò hoặc quên ướp lạnh rượu vang.
- **Giải pháp:** 
  - Xây dựng một module UI riêng dành cho Bếp (`/kitchen-kds`).
  - Lắng nghe Kafka Topic `tablemaster.booking.created` qua WebSocket/STOMP.
  - Khi có đơn đặt trước, màn hình bếp sẽ hiển thị thẻ món kèm **đồng hồ đếm ngược thông minh (Smart Countdown)**:
    - *Ví dụ:* Đơn đặt bàn lúc 19:30 có Wagyu A5 (cần 45p ủ nhiệt) $\rightarrow$ Hệ thống tự động phát âm thanh cảnh báo và đổi màu thẻ sang đỏ lúc **18:45** để nhắc Bếp trưởng bắt đầu đưa thịt vào máy Sous-vide.

### 💡 2. Ràng Buộc Thời Gian Đặt Trước Tối Thiểu (Lead Time & Inventory Hard-Limit)
- **Vấn đề:** Nếu khách đặt bàn gấp chỉ trước 20 phút mà lại chọn Bò Wagyu A5 (cần 45p ủ nhiệt) hoặc Bánh kem sinh nhật (cần 120p làm bánh), bếp sẽ không thể đáp ứng kịp.
- **Giải pháp:**
  - Thiết lập thuộc tính `leadTimeMinutes` trên từng món ăn (ví dụ: Wagyu A5: 60 phút, Bánh kem: 180 phút).
  - Khi khách chọn giờ đặt bàn, nếu khoảng cách từ thời điểm hiện tại đến giờ đặt nhỏ hơn `leadTimeMinutes`, giao diện sẽ tự động làm mờ (disable) món đó kèm dòng thông báo: *"Món ăn đòi hỏi chuẩn bị công phu tối thiểu 60 phút. Quý khách vui lòng chọn khung giờ khác hoặc liên hệ hotline"*.
  - Kết hợp với Redis Atomic Counter để giới hạn số lượng món phục vụ mỗi tối (ví dụ: mỗi tối nhà hàng chỉ phục vụ tối đa 10 phần Wagyu A5 để đảm bảo chất lượng tuyệt hảo).

### 💡 3. AI Sommelier & Gợi Ý Món Ăn Đi Kèm Thông Minh (Smart Pairing Engine)
- **Giải pháp:**
  - Khi thực khách tick chọn món **Thăn Bò Wagyu A5** với độ chín *Medium-Rare*, một popup nhỏ sang trọng xuất hiện: *"Khuyên dùng từ Sommelier: Bò Wagyu A5 béo ngậy kết hợp hoàn hảo cùng vị chát sâu của vang đỏ Château Margaux 2018 (đang có ưu đãi decant 30 phút)"*.
  - Tính năng Upsell này giúp tăng doanh thu bình quân trên mỗi lượt đặt bàn (RevPASH) từ 30% đến 50%.

### 💡 4. Chính Sách Hoàn Cọc Phân Tầng Cho Món Đặt Trước (Tiered Refund Policy BR-REFUND-02)
- **Vấn đề:** Quy tắc hoàn cọc bàn thông thường (hoàn 100% nếu hủy trước 6 tiếng) không thể áp dụng cho món Signature vì nguyên liệu đã được sơ chế hoặc bánh kem đã được trang trí tên riêng.
- **Giải pháp:** Xây dựng ma trận hoàn cọc phân tầng:
  - **Hủy trước 24 giờ:** Hoàn 100% tiền cọc bàn và cọc món.
  - **Hủy từ 6 – 24 giờ trước giờ ăn:** Hoàn 100% cọc bàn, nhưng chỉ hoàn **50% cọc món** (50% còn lại bù đắp chi phí nguyên liệu nhà hàng đã nhập).
  - **Hủy dưới 6 giờ hoặc No-show:** Khấu trừ **100% toàn bộ tiền cọc bàn và món ăn**.

### 💡 5. Tự Động Đối Soát Thanh Toán Qua Webhook Ngân Hàng (VietQR / PayOS / SePay Auto-Reconciliation)
- **Vấn đề:** Hiện tại trên UI người dùng bấm nút *"Tôi đã chuyển khoản thành công"* để kích hoạt phê duyệt cọc (Mock flow).
- **Giải pháp:**
  - Tích hợp Webhook thời gian thực từ SePay / PayOS / VietQR Open API.
  - Khi khách quét mã QR và tiền về tài khoản ngân hàng của nhà hàng, webhook sẽ bắn payload biến động số dư về endpoint `POST /api/v1/payments/webhook`.
  - Backend đối soát `nội dung chuyển khoản` chứa mã `TM-...` và `số tiền chính xác = totalDeposit`. Nếu khớp 100%, backend tự động kích hoạt `approveAndRequestDeposit` và gửi tin nhắn Zalo ZNS / Email xác nhận vé check-in ngay lập tức cho thực khách.
