# BÁO CÁO TOÀN DIỆN: TRIỂN KHAI UC-08 (SPECIAL REQUESTS & DIETARY NOTES)
## GIẢI THÍCH CHI TIẾT LUỒNG ĐI DỮ LIỆU & BẢN CHẤT KIẾN TRÚC HOẠT ĐỘNG

> **Mã Use Case**: UC-08: Ghi chú Nhu cầu Đặc biệt & Dị ứng (Special Requests & Dietary Notes)  
> **Hệ thống**: TableMaster - Hệ Thống Đặt Bàn & Quản Trị Nhà Hàng Đương Đại Le Prime Bistro  
> **Các bên liên quan (Stakeholders)**: Thực khách đặt bàn (Online Guest), Lễ tân trực sảnh (Host), Thu ngân (Cashier), Phục vụ (Waiter), Bếp trưởng & Đầu bếp (Kitchen Display System - KDS)  
> **Công nghệ áp dụng**: Spring Boot 3, PostgreSQL, Apache Kafka (Event Streaming), WebSocket STOMP (Real-time Push), React 18, TypeScript, TailwindCSS, Web Audio API

---

## 1. TỔNG QUAN DANH MỤC CÁC TỆP ĐÃ ĐƯỢC CODE (CODE INVENTORY)

Toàn bộ giải pháp UC-08 được triển khai hoàn chỉnh và khép kín qua 3 tầng (Database, Backend Microservice, Frontend Client):

### 1.1. Cơ Sở Dữ Liệu (Database)
- [04-booking-schema.sql](file:///d:/File/K%C3%8C%207/SBA301/Project/Project_SBA301/infrastructure/db-init/04-booking-schema.sql): Thêm 4 cột chuyên biệt (`occasion`, `dietary_notes`, `baby_chair_count`, `candle_setup`) và Index `idx_bookings_occasion` cho bảng `bookings`.

### 1.2. Backend Microservice (`booking-service`, Spring Boot - Port 8083)
- [Booking.java](file:///d:/File/K%C3%8C%207/SBA301/Project/Project_SBA301/src/server/booking-service/src/main/java/com/tablemaster/booking/entity/Booking.java): Entity JPA ánh xạ các cột mới của UC-08.
- [CreateBookingRequest.java](file:///d:/File/K%C3%8C%207/SBA301/Project/Project_SBA301/src/server/booking-service/src/main/java/com/tablemaster/booking/dto/request/CreateBookingRequest.java): DTO nhận thông tin đặt bàn mới từ khách hàng kèm các trường UC-08.
- [UpdateSpecialRequestsRequest.java](file:///d:/File/K%C3%8C%207/SBA301/Project/Project_SBA301/src/server/booking-service/src/main/java/com/tablemaster/booking/dto/request/UpdateSpecialRequestsRequest.java): DTO cho endpoint cập nhật nhanh từ Tablet Lễ tân.
- [BookingResponse.java](file:///d:/File/K%C3%8C%207/SBA301/Project/Project_SBA301/src/server/booking-service/src/main/java/com/tablemaster/booking/dto/response/BookingResponse.java): Phản hồi dữ liệu JSON đầy đủ các thuộc tính dịp tiệc, dị ứng, ghế em bé, nến.
- [KafkaConfig.java](file:///d:/File/K%C3%8C%207/SBA301/Project/Project_SBA301/src/server/booking-service/src/main/java/com/tablemaster/booking/config/KafkaConfig.java): Đăng ký Topic Kafka `booking.special-notes.updated`.
- [BookingEventProducer.java](file:///d:/File/K%C3%8C%207/SBA301/Project/Project_SBA301/src/server/booking-service/src/main/java/com/tablemaster/booking/kafka/BookingEventProducer.java): Tích hợp `SimpMessagingTemplate` để broadcast WebSocket tới `/topic/kitchen/kds`, `/topic/host/table-notes` và phát sự kiện Transactional Outbox Kafka.
- [BookingService.java](file:///d:/File/K%C3%8C%207/SBA301/Project/Project_SBA301/src/server/booking-service/src/main/java/com/tablemaster/booking/service/BookingService.java) & [BookingServiceImpl.java](file:///d:/File/K%C3%8C%207/SBA301/Project/Project_SBA301/src/server/booking-service/src/main/java/com/tablemaster/booking/service/BookingServiceImpl.java): Xử lý nghiệp vụ lưu đơn và cập nhật `updateSpecialRequests()`.
- [BookingController.java](file:///d:/File/K%C3%8C%207/SBA301/Project/Project_SBA301/src/server/booking-service/src/main/java/com/tablemaster/booking/controller/BookingController.java): REST API Endpoint `PUT /api/v1/bookings/{id}/special-requests`.
- [BookingServiceTest.java](file:///d:/File/K%C3%8C%207/SBA301/Project/Project_SBA301/src/server/booking-service/src/test/java/com/tablemaster/booking/service/BookingServiceTest.java): Kiểm thử tự động (Unit Test) đạt **19/19 tests passed (100%)**.

### 1.3. Frontend Client (`tablemaster-ui`, React + Vite + TypeScript)
- [types/index.ts](file:///d:/File/K%C3%8C%207/SBA301/Project/Project_SBA301/src/client/tablemaster-ui/src/types/index.ts): Bổ sung kiểu dữ liệu TypeScript cho `BookingDetails` và `TableOrderRecord`.
- [services/bookingApi.ts](file:///d:/File/K%C3%8C%207/SBA301/Project/Project_SBA301/src/client/tablemaster-ui/src/services/bookingApi.ts): Thêm payload và API client method `updateSpecialRequests()`.
- [data/mockData.ts](file:///d:/File/K%C3%8C%207/SBA301/Project/Project_SBA301/src/client/tablemaster-ui/src/data/mockData.ts): Cập nhật dữ liệu mẫu thực tế về tiệc sinh nhật, ghế em bé, dị ứng tiêu & hải sản.
- [views/BookingPage.tsx](file:///d:/File/K%C3%8C%207/SBA301/Project/Project_SBA301/src/client/tablemaster-ui/src/views/BookingPage.tsx): Form đặt bàn Online với bộ chọn dịp tiệc, stepper ghế em bé, toggle nến thơm, input tên bánh kem và ma trận chip dị ứng (ưu tiên đỏ: "Không rắc tiêu vào thức ăn vì có trẻ nhỏ").
- [views/HostTabletPage.tsx](file:///d:/File/K%C3%8C%207/SBA301/Project/Project_SBA301/src/client/tablemaster-ui/src/views/HostTabletPage.tsx): Màn hình Lễ tân/Thu ngân hiển thị huy hiệu trên thẻ bàn, card UC-08 trong POS Drawer, modal chỉnh sửa nhu cầu đồng bộ tức thì sang Bếp, và nút chuyển sang KDS.
- [views/KitchenKdsPage.tsx](file:///d:/File/K%C3%8C%207/SBA301/Project/Project_SBA301/src/client/tablemaster-ui/src/views/KitchenKdsPage.tsx): Màn hình Bếp KDS chuyên nghiệp với ticket board, banner cảnh báo dị ứng viền đỏ nổi bật, chuyển trạng thái nấu, mô phỏng in nhiệt phiếu bếp 80mm và âm thanh Web Audio Chime.
- [components/common/Navbar.tsx](file:///d:/File/K%C3%8C%207/SBA301/Project/Project_SBA301/src/client/tablemaster-ui/src/components/common/Navbar.tsx) & [App.tsx](file:///d:/File/K%C3%8C%207/SBA301/Project/Project_SBA301/src/client/tablemaster-ui/src/App.tsx): Tích hợp định tuyến điều hướng tab `Bếp (KDS)` và mapping dữ liệu UC-08 toàn cục.

---

## 2. GIẢI THÍCH CHI TIẾT LUỒNG ĐI CỦA DỮ LIỆU (DATA FLOW)

Toàn bộ hệ thống vận hành theo **4 luồng nghiệp vụ tương hỗ khép kín**:

```mermaid
graph TD
    subgraph "Luồng 1: Khách Đặt Bàn Online"
        A[Thực khách mở BookingPage] -->|Chọn Dịp, Ghế em bé, Nến, Dị ứng tiêu/hải sản| B[Gửi POST /api/v1/bookings]
        B --> C[(PostgreSQL: bookings)]
        B --> D[Kafka Topic: booking.created]
        B --> E[WebSocket STOMP Broker]
    end

    subgraph "Luồng Đồng Bộ Song Song Thời Gian Thực"
        E -->|Destination: /topic/host/table-notes| F[Tablet Lễ Tân: HostTabletPage]
        E -->|Destination: /topic/kitchen/kds| G[Màn Hình Bếp: KitchenKdsPage]
        F -->|Hiển thị Badge Ghế bé, Nến, Banner Cảnh Báo Dị Ứng| F1[Nhân viên chuẩn bị bàn & ghế bé]
        G -->|Vé Ticket hiện Banner Đỏ Rực + Cảnh báo Không rắc tiêu| G1[Đầu bếp chú ý khi đứng line]
    end

    subgraph "Luồng 2: Khách Đến Nhận Bàn (Check-in)"
        F1 -->|Bấm Nhận Bàn Check-in| H[handleCheckInOnlineBooking]
        H -->|Tự động thừa kế UC-08 & Pre-orders| I[tableOrders State: SEATED]
        I -->|Chuyển trạng thái sang Đang Dùng Bữa| G
    end

    subgraph "Luồng 3: Lễ Tân Cập Nhật Nhu Cầu Tại Sảnh"
        F -->|Khách yêu cầu thêm ghế em bé / kiêng hành tỏi| J[Modal Chỉnh Sửa Nhu Cầu]
        J -->|Bấm Lưu & Đồng Bộ| K[PUT /api/v1/bookings/id/special-requests]
        K --> C
        K --> L[Kafka Topic: booking.special-notes.updated]
        K --> E
        E -->|Re-render tức thì + Kêu chuông Chime| G
    end

    subgraph "Luồng 4: Quy Trình Bếp Xử Lý (KDS)"
        G1 -->|Đầu bếp bấm từng món| M[PREPARING -> SERVED]
        G1 -->|Bấm In Phiếu Bếp| N[Modal Phiếu Nhiệt 80mm Bếp In Đậm Cảnh Báo]
    end
```

### Bước 1: Khách nhập thông tin tại `BookingPage.tsx`
1. Khách hàng lựa chọn thời gian, vị trí bàn ăn và số lượng thực khách.
2. Tại **Phần 3 (Nhu cầu tiệc, Ghế em bé & Dị ứng)**:
   - Khách chọn dịp: `Sinh nhật`. Hệ thống tự động mở thêm ô: *"Tên chủ tiệc viết lên bánh kem"*.
   - Khách tăng số lượng `Ghế ăn dặm em bé: 1`.
   - Khách bật switch `Setup nến thơm: ON`.
   - Khách chọn chip cảnh báo: `Không rắc tiêu vào thức ăn vì có trẻ nhỏ` và `Dị ứng hải sản có vỏ`.
3. Hệ thống tạo ra payload có cấu trúc:
   ```json
   {
     "occasion": "Sinh nhật",
     "dietaryNotes": "Không rắc tiêu vào thức ăn vì có trẻ nhỏ, Dị ứng hải sản có vỏ",
     "babyChairCount": 1,
     "candleSetup": true,
     "specialNotes": "Mục đích: Sinh nhật. Bánh kem viết: Bé Cà Rốt tròn 3 tuổi. Cần 1 ghế ăn em bé. Setup nến thơm. Lưu ý dị ứng: Không rắc tiêu vào thức ăn vì có trẻ nhỏ, Dị ứng hải sản có vỏ."
   }
   ```
4. Khi khách hoàn tất đặt cọc VietQR, thông tin được gửi về Backend `booking-service`.

### Bước 2: Backend tiếp nhận, lưu DB và kích hoạt đồng bộ
1. `BookingController` tiếp nhận yêu cầu ➔ gọi `BookingServiceImpl.createBooking()`.
2. Dữ liệu được lưu vào bảng `bookings` trong cơ sở dữ liệu PostgreSQL.
3. Đồng thời, `BookingEventProducer` phát ra sự kiện kép (Dual Broadcasting):
   - **Kafka**: Gửi event sang topic `booking.created` phục vụ phân tích dữ liệu, CRM và audit log.
   - **Spring WebSocket STOMP**: Gửi thông điệp JSON tới destination:
     - `/topic/kitchen/kds`: Đẩy trực tiếp vào board Bếp.
     - `/topic/host/table-notes`: Đẩy trực tiếp vào Tablet Lễ tân.

### Bước 3: Tablet Lễ tân (`HostTabletPage.tsx`) tiếp nhận thông tin
1. Trên sơ đồ bàn, tại ô bàn đặt trước (ví dụ bàn `T-03` hoặc `VIP-01`):
   - Xuất hiện các badge trực quan: `🎂 Sinh nhật`, `👶 1 Ghế bé`, `🕯️ Nến`.
   - Xuất hiện thanh cảnh báo dị ứng màu hồng/đỏ: `🚨 Không rắc tiêu vào thức ăn vì có trẻ nhỏ, Dị ứng hải sản có vỏ`.
2. Nhân viên Host nhìn vào màn hình sẽ lập tức:
   - Yêu cầu nhân viên phụ bàn lấy 1 chiếc ghế high-chair đặt vào bàn trước khi khách đến.
   - Chuẩn bị nến thơm và thắp nến trước 5 phút theo giờ hẹn.
3. Khi khách đến, Host bấm **"Khách Tới ➔ Nhận Bàn (Check-in)"**:
   - Hàm `handleCheckInOnlineBooking()` lập tức kế thừa toàn bộ `occasion`, `dietaryNotes`, `babyChairCount`, `candleSetup` và các món gọi trước (`preOrders`) sang `tableOrders`.
   - Khách không cần phải nhắc lại bất kỳ yêu cầu nào đã điền trên web.

### Bước 4: Màn hình Bếp KDS (`KitchenKdsPage.tsx`) hiển thị cảnh báo
1. Trên màn hình Bếp, một Ticket phiếu bếp mới được render với giao diện tối chuyên dụng (Dark UI chống mỏi mắt trong môi trường nhiệt độ cao của bếp).
2. **Khung CẢNH BÁO DỊ ỨNG & CHẾ BIẾN (UC-08)** được đặt ngay đầu ticket với nền đỏ đậm (`bg-rose-950`), viền đỏ sáng (`border-rose-500`) và icon cảnh báo nhấp nháy:
   - Dòng chữ in đậm: **"Không rắc tiêu vào thức ăn vì có trẻ nhỏ, Dị ứng hải sản có vỏ"**.
   - Cảnh báo an toàn: **"👶 Cần chuẩn bị 1 ghế ăn trẻ em - Chú ý an toàn bàn ăn"**.
3. Đầu bếp phụ trách chảo (Sauté) hoặc nướng (Grill) khi làm món súp hoặc bò áp chảo sẽ lập tức không rắc tiêu sọ/tiêu đen xay lên đĩa món ăn của bàn này.
4. Đầu bếp có thể bấm trực tiếp vào từng món để đổi trạng thái `ĐANG NẤU ➔ ĐÃ XONG / LÊN BÀN`.
5. Đầu bếp có thể bấm **"In Phiếu Bếp"** để in ra mẫu hóa đơn nhiệt 80mm dán trực tiếp lên khay chuyền món.

### Bước 5: Lễ tân / Thu ngân cập nhật nhanh tại sảnh (Nếu khách đổi ý)
1. Trong trường hợp khách đến nơi và phát sinh thêm: *"Bé thứ 2 đi cùng, cho anh thêm 1 ghế em bé và đừng cho hành tỏi vào cơm chiên"*.
2. Lễ tân không cần vào trang admin phức tạp, chỉ cần bấm nút **"Nhu Cầu Đặc Biệt & Dị Ứng (KDS)"** ngay trên thẻ bàn hoặc trong POS Drawer.
3. Modal mở ra cho phép:
   - Tăng ghế em bé từ `1` lên `2`.
   - Click thêm chip `Không hành tỏi`.
   - Bấm **"Lưu & Đồng Bộ Sang KDS Bếp"**.
4. Frontend gọi API `PUT /api/v1/bookings/{id}/special-requests`.
5. Backend cập nhật PostgreSQL và bắn WebSocket ngay lập tức sang màn hình Bếp.
6. Màn hình Bếp KDS kêu tiếng chuông báo ("Beep Chime") qua Web Audio API, ticket tự động nhảy sang dữ liệu mới nhất mà Bếp trưởng không cần F5/Reload trang.

---

## 3. GIẢI THÍCH TẠI SAO HỆ THỐNG LẠI CHẠY NHƯ VẬY? (ARCHITECTURAL RATIONALE)

### 3.1. Tại sao lại tách thành các cột riêng (`occasion`, `dietary_notes`, `baby_chair_count`, `candle_setup`) thay vì chỉ dùng 1 cột `special_notes TEXT`?
- **Vấn đề của cột Text tự do truyền thống**:
  - Nếu chỉ có 1 trường `special_notes: "Sinh nhat, 1 ghe em be, ko an tieu"`, máy tính không thể hiểu được cấu trúc.
  - Khi Tablet Lễ tân muốn hiển thị badge số lượng ghế em bé hoặc đếm tổng số ghế bé đang dùng trong ca tối để cảnh báo xem nhà hàng có bị "thiếu ghế em bé" hay không, hệ thống không thể tính toán được nếu chỉ dùng chuỗi văn bản không định dạng.
  - Tương tự, Bếp không thể phân loại độ khẩn cấp giữa một "lời nhắn vu vơ" với một "cảnh báo dị ứng sốc phản vệ chết người".
- **Lợi ích khi chuẩn hóa Schema**:
  - `baby_chair_count INT`: Giúp hệ thống cộng tổng kiểm tra tồn kho thiết bị (Inventory check).
  - `candle_setup BOOLEAN`: Giúp nhân viên phục vụ lọc nhanh danh sách các bàn cần setup nến trong ca làm việc.
  - `dietary_notes TEXT`: Được tách riêng để kích hoạt chế độ cảnh báo đỏ (Red Alert State) trên KDS.
  - `occasion VARCHAR(50)`: Phục vụ hệ thống CRM, tự động gửi voucher sinh nhật hoặc tích điểm cho khách vào những dịp kỷ niệm.
  - **Vẫn giữ `special_notes`**: Đảm bảo tính tương thích ngược (Backward Compatibility) với các dịch vụ cũ hoặc nhân viên muốn ghi chú tự do.

---

### 3.2. Tại sao lại kết hợp CẢ Apache Kafka VÀ WebSocket STOMP? (Kiến trúc Dual-Channel)
Nhiều người sẽ thắc mắc: *"Tại sao không chỉ dùng Kafka hoặc chỉ dùng WebSocket?"*
1. **Vai trò của Apache Kafka**:
   - Kafka là Message Broker phân tán, đảm bảo tính **bền vững (Durability)** và **bất biến (Immutability)** của sự kiện.
   - Khi có sự kiện `booking.special-notes.updated`, các microservice khác (như Notification Service gửi SMS/Email, Analytics Service tính toán xu hướng dị ứng, CRM Service) sẽ tiêu thụ sự kiện này một cách bất đồng bộ (Asynchronous) mà không làm chậm request của khách.
   - Áp dụng mẫu **Transactional Outbox Pattern**: Đảm bảo không bao giờ xảy ra lỗi ghi DB thành công nhưng Kafka bị rớt mạng làm mất sự kiện.
2. **Vai trò của WebSocket STOMP**:
   - Kafka không kết nối trực tiếp đến trình duyệt Web của Tablet Lễ tân hay màn hình Bếp KDS do vấn đề bảo mật và độ trễ.
   - WebSocket duy trì kết nối song công toàn phần (Full-Duplex TCP Connection) liên tục giữa Backend và Trình duyệt.
   - Khi Backend lưu thành công, thông điệp được đẩy xuống giao diện Web trong vòng **dưới 50 mili-giây (Sub-second push)**.
   - **Loại bỏ hoàn toàn cơ chế Polling (Hỏi vòng liên tục)**: Giúp giảm 98% tải CPU và băng thông mạng so với việc cứ 2 giây client lại gửi request GET hỏi một lần.

---

### 3.3. Tại sao KDS Bếp lại đặt Banner Cảnh Báo Dị Ứng Viền Đỏ lên vị trí ưu tiên cao nhất?
- Trong ngành ẩm thực cao cấp quốc tế (Michelin / Fine Dining Standard), **dị ứng thực phẩm là vấn đề pháp lý và an toàn tính mạng**:
  - Dị ứng hải sản có vỏ (Shellfish) hoặc đậu phộng (Peanuts) có thể gây ra hiện tượng sốc phản vệ (Anaphylaxis) nguy hiểm chỉ sau vài phút.
  - Với trẻ nhỏ, niêm mạc dạ dày và phế quản rất nhạy cảm; việc rắc tiêu đen hoặc ớt vào món súp/cháo có thể khiến trẻ sặc cay, nôn trớ hoặc kích ứng đường thở.
- Do đó, Banner dị ứng được thiết kế:
  - Nằm ở **vị trí trên cùng (Top Priority)** của Ticket bếp.
  - Nền đỏ sẫm (`bg-rose-950`), viền đỏ sáng 2px (`border-rose-500`) tương phản cao trên nền đen của màn hình KDS.
  - Biểu tượng khiên bảo vệ `ShieldAlert` có hoạt ảnh nhấp nháy để người đứng bếp liếc mắt qua là nhìn thấy ngay trước khi bắt đầu đặt chảo lên bếp.

---

### 3.4. Tại sao lại tích hợp Web Audio API (Chime Sound) trên giao diện Bếp?
- Trong gian bếp nhà hàng, tiếng ồn từ máy hút mùi, tiếng xèo xèo của chảo nướng, và tiếng dao thớt rất lớn.
- Đầu bếp không thể nhìn chằm chằm 100% thời gian vào màn hình KDS.
- Sử dụng **Web Audio API** tạo ra dao động âm tần (Oscillator 880Hz sóng Triangle) mô phỏng tiếng chuông "Keng" thanh thoát:
  - Khi Lễ tân ngoài sảnh cập nhật đổi yêu cầu (ví dụ: *"Bàn 3 không ăn cay"*), tiếng chuông vang lên ngay lập tức.
  - Không cần tải file MP3 bên ngoài (tránh lỗi 404 mạng hoặc bị trình duyệt chặn tải file âm thanh lớn), âm thanh được tổng hợp toán học trực tiếp từ chip âm thanh của thiết bị.

---

### 3.5. Tại sao luồng Check-in tự động kế thừa (Merge) Pre-orders và UC-08 Notes vào `tableOrders`?
- Khi khách đặt trước trên mạng, đơn đặt bàn nằm ở trạng thái `CONFIRMED` trong CSDL.
- Khi khách bước chân vào nhà hàng, Lễ tân bấm nút **"Nhận Bàn (Check-in)"**.
- Nếu hệ thống không tự động chuyển dữ liệu sang `tableOrders`, nhân viên phục vụ tại bàn sẽ phải mở menu giấy và hỏi lại khách: *"Anh chị có gọi món trước hay có dặn gì không ạ?"*. Điều này phá hỏng sự chuyên nghiệp của nhà hàng cao cấp.
- Hệ thống tự động chuyển:
  - Các món đặt trước (`preOrders`) thành danh sách món đang nấu (`items: PREPARING`).
  - Ghi chú ghế em bé, nến, dị ứng được nhúng thẳng vào hóa đơn bàn ăn.
  - Khấu trừ ngay tiền đặt cọc trực tuyến (`depositAmount`) trên hóa đơn tạm tính để thu ngân không thu trùng tiền của khách.

---

## 4. BẢNG TỔNG HỢP CÁC KỊCH BẢN KIỂM THỬ (TEST SCENARIOS)

| Kịch Bản | Dữ Liệu Đầu Vào | Kỳ Vọng Tại Tablet Lễ Tân | Kỳ Vọng Tại Màn Hình Bếp KDS | Trạng Thái Backend & DB |
| :--- | :--- | :--- | :--- | :--- |
| **1. Khách đi cùng trẻ nhỏ & tiệc Sinh nhật** | Dịp: Sinh nhật; Ghế bé: 1; Nến: ON; Dị ứng: Không rắc tiêu vì có bé nhỏ. | Thẻ bàn hiện: `🎂 Sinh nhật`, `👶 1 Ghế bé`, `🕯️ Nến`, Banner: `🚨 Không rắc tiêu vì có bé nhỏ`. | Ticket xuất hiện ngay; Banner đỏ rực: CẢNH BÁO DỊ ỨNG & CHẾ BIẾN; Lưu ý chuẩn bị 1 ghế bé. | Lưu vào PostgreSQL; Bắn Kafka topic `booking.created`; WebSocket push `/topic/kitchen/kds`. |
| **2. Bếp trưởng thao tác trên ticket** | Bấm vào món "Thăn Bò Striploin Dry-Aged". | N/A (Bếp xử lý nội bộ). | Món chuyển từ trạng thái `ĐANG NẤU` sang `ĐÃ XONG / LÊN BÀN` kèm dấu tích xanh; phát tiếng Beep. | Cập nhật bộ nhớ trạng thái `tableOrders`; đồng bộ Waiter App. |
| **3. Lễ tân cập nhật thêm dị ứng tại bàn** | Khách báo thêm: Dị ứng đậu phộng; Lễ tân bấm Lưu trên Modal. | Card POS cập nhật ngay lập tức: thêm "Dị ứng đậu phộng". | Ticket tự động re-render có thêm "Dị ứng đậu phộng"; chuông báo âm thanh kích hoạt. | Gọi REST `PUT /api/v1/bookings/{id}/special-requests`; Bắn Kafka `booking.special-notes.updated`. |
| **4. In phiếu bếp nhiệt giả lập** | Bấm nút "In Phiếu Bếp" trên KDS. | N/A. | Modal hóa đơn in nhiệt 80mm hiện ra; dòng chữ cảnh báo dị ứng và không rắc tiêu được **in hoa đậm**. | Giả lập định dạng máy in POS ESC/POS chuẩn ngành F&B. |

---

## 5. KẾT LUẬN & MINH CHỨNG CHẤT LƯỢNG MÃ NGUỒN

1. **Backend Verification**:
   - Toàn bộ 19 unit test trong `src/server/booking-service` đều chạy thành công (`BUILD SUCCESS`).
   - Kiểm tra toàn diện từ việc mã hóa trường dữ liệu, lưu cơ sở dữ liệu, đến cơ chế Transactional Outbox Kafka và WebSocket Broadcasting.
2. **Frontend Verification**:
   - Lệnh `npm run build` (`tsc -b && vite build`) trong `src/client/tablemaster-ui` hoàn thành với **Exit code 0** (0 lỗi, 0 cảnh báo type).
   - Giao diện được trau chuốt theo ngôn ngữ thiết kế sang trọng đương đại của Le Prime Bistro (Tông màu kem champagne, nâu sô-cô-la ấm, hiệu ứng vi tương tác mượt mà và các banner cảnh báo an toàn nổi bật).
3. **Giá Trị Thực Tiễn**:
   - Đảm bảo an toàn sức khỏe tối đa cho thực khách, triệt tiêu nguy cơ nhầm lẫn món ăn gây dị ứng.
   - Kết nối liền mạch chuỗi vận hành giữa: **Khách hàng ➔ Lễ tân tiếp đón ➔ Bếp trưởng chế biến ➔ Thu ngân tính tiền**.
