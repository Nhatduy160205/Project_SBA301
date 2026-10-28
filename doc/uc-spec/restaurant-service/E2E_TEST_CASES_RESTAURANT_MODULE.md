# BỘ KỊCH BẢN KIỂM THỬ ĐẦU-CUỐI (E2E TEST CASES)
# PHÂN HỆ: RESTAURANT & TABLE SERVICE (MODULE 2 - PORT 8082 / GATEWAY 8080)
## HỆ THỐNG QUẢN LÝ ĐẶT BÀN & ĐIỀU PHỐI BÀN ĂN TABLEMASTER

> **Mã tài liệu:** E2E-TEST-REST-02  
> **Phiên bản:** 2.1.0 (Đã loại bỏ hoàn toàn Tầng và 2D/3D Canvas; Chuẩn hóa Data-driven & Zone-based Box Grid)  
> **Dịch vụ Backend:** `restaurant-service` (Port :8082 qua API Gateway :8080)  
> **Frontend:** TableMaster UI (`/admin/restaurant` - Vite React TS)  
> **Trạng thái:** Sẵn sàng kiểm thử thủ công và tự động (Manual & Automated E2E)

---

## MỤC LỤC
1. [HƯỚNG DẪN KHỞI CHẠY HỆ THỐNG TRƯỚC KHI TEST](#1-hướng-dẫn-khởi-chạy-hệ-thống-trước-khi-test)
2. [E2E UC-27: QUẢN LÝ DANH MỤC THẺ BOX BÀN & PHÂN KHU (ZONE-BASED TABLE BOX INVENTORY)](#2-e2e-uc-27-quản-lý-danh-mục-thẻ-box-bàn--phân-khu)
3. [E2E UC-23: KHÓA BÀN KHẨN CẤP DO BẢO TRÌ & MỞ LẠI BÀN (EMERGENCY MAINTENANCE LOCK)](#3-e2e-uc-23-khóa-bàn-khẩn-cấp-do-bảo-trì--mở-lại-bàn)
4. [E2E UC-28: CẤU HÌNH KHUNG GIỜ & CÔNG SUẤT TỐI ĐA CA PHỤC VỤ (TIME SLOTS & SHIFT CAPACITY)](#4-e2e-uc-28-cấu-hình-khung-giờ--công-suất-tối-đa-ca-phục-vụ)
5. [E2E UC-29: QUẢN LÝ THỰC ĐƠN, MÓN ĐẶT TRƯỚC & DANH MỤC (MENU CATEGORY & PRE-ORDER ITEMS)](#5-e2e-uc-29-quản-lý-thực-đơn-món-đặt-trước--danh-mục)
6. [E2E UC-30: CẤU HÌNH NGÀY LỄ, PHỤ THU CỌC & BLACKOUT DATES (HOLIDAYS & CLOSURE)](#6-e2e-uc-30-cấu-hình-ngày-lễ-phụ-thu-cọc--blackout-dates)
7. [E2E BỔ SUNG: HỒ SƠ NHÀ HÀNG & THIẾT LẬP TÀI KHOẢN NGÂN HÀNG VIETQR](#7-e2e-bổ-sung-hồ-sơ-nhà-hàng--thiết-lập-tài-khoản-ngân-hàng-vietqr)

---

## 1. HƯỚNG DẪN KHỞI CHẠY HỆ THỐNG TRƯỚC KHI TEST

### 1.1 Khởi chạy Database & Cache (Docker)
```powershell
docker compose up -d postgres redis
```
*(Nếu cần reset database theo schema mới không còn Tầng/2D: Chạy lại file `infrastructure/db-init/03-restaurant-schema.sql` vào database `tablemaster_restaurant`)*

### 1.2 Khởi chạy Backend Services
- **Eureka Service Registry:**
  ```powershell
  cd src/server/discovery-server
  mvn spring-boot:run
  ```
- **API Gateway (Port 8080):**
  ```powershell
  cd src/server/gateway-service
  mvn spring-boot:run
  ```
- **Restaurant Service (Port 8082):**
  ```powershell
  cd src/server/restaurant-service
  mvn spring-boot:run
  ```

### 1.3 Khởi chạy Frontend UI
```powershell
cd src/client/tablemaster-ui
npm run dev
```
Truy cập trình duyệt: `http://localhost:5173/admin/restaurant`

---

## 2. E2E UC-27: QUẢN LÝ DANH MỤC THẺ BOX BÀN & PHÂN KHU

### Test Case 27.1: Thêm Box Bàn Mới Hợp Lệ (Happy Path)
- **Mục tiêu:** Quản lý tạo thêm 1 bàn mới thuộc khu vực VIP để phục vụ tiệc riêng.
- **Thao tác Frontend (UI):**
  1. Vào sidebar, chọn tab **"Sơ Đồ Bàn (Box View)"** hoặc **"Quản Lý Danh Sách Bàn"**.
  2. Bấm nút **"+ Thêm Box Bàn Mới"**.
  3. Điền thông tin vào Modal:
     - **Mã bàn:** `VIP-88`
     - **Khu vực (Zone):** `Phòng VIP Riêng Tư (Private VIP)`
     - **Sức chứa tối thiểu:** `4`
     - **Sức chứa tối đa:** `8`
     - **Tiền cọc riêng:** `500000`
     - **Kích hoạt bàn:** Tích chọn `[x]`
  4. Bấm **"Tạo Box Bàn"**.
- **API Gọi Thực Tế:**
  - `POST http://localhost:8080/api/v1/restaurant/tables`
  - **Request Body (`TableRequest`):**
    ```json
    {
      "tableCode": "VIP-88",
      "zoneType": "PRIVATE_VIP",
      "minCapacity": 4,
      "maxCapacity": 8,
      "customDeposit": 500000,
      "isActive": true
    }
    ```
- **Kết quả Mong Đợi (Expectation):**
  - **Backend:** Trả về HTTP `201 Created`
    ```json
    {
      "success": true,
      "message": "Tạo bàn thành công",
      "data": {
        "id": "...",
        "tableCode": "VIP-88",
        "zoneType": "PRIVATE_VIP",
        "minCapacity": 4,
        "maxCapacity": 8,
        "customDeposit": 500000,
        "isActive": true
      }
    }
    ```
  - **Frontend:** Xuất hiện Toast xanh *"Đã thêm bàn VIP-88 thành công!"*. Thẻ bàn `VIP-88` xuất hiện ngay lập tức trên Box Grid với viền vàng kim của khu vực VIP.

---

### Test Case 27.2: Chặn Trùng Mã Bàn (Conflict Validation)
- **Mục tiêu:** Hệ thống ngăn chặn việc tạo 2 bàn có cùng mã định danh.
- **Thao tác Frontend (UI):**
  1. Bấm lại nút **"+ Thêm Box Bàn Mới"**.
  2. Nhập lại Mã bàn: `VIP-88`, các thông số khác tùy ý.
  3. Bấm **"Tạo Box Bàn"**.
- **API Gọi Thực Tế:**
  - `POST http://localhost:8080/api/v1/restaurant/tables` với `tableCode: "VIP-88"`
- **Kết quả Mong Đợi (Expectation):**
  - **Backend:** Trả về HTTP `409 Conflict`
    ```json
    {
      "success": false,
      "message": "Mã bàn đã tồn tại trong hệ thống"
    }
    ```
  - **Frontend:** Xuất hiện Toast đỏ thông báo lỗi xung đột dữ liệu. Modal không bị đóng để người dùng đổi mã bàn.

---

### Test Case 27.3: Chặn Sức Chứa Bất Hợp Lý (minCapacity > maxCapacity)
- **Mục tiêu:** Ngăn chặn lỗi nghiệp vụ khi người dùng nhập số khách tối thiểu lớn hơn tối đa.
- **Thao tác Frontend (UI):**
  1. Nhập Mã bàn: `STD-99`.
  2. Sức chứa tối thiểu: `6`, Sức chứa tối đa: `4`.
  3. Bấm **"Tạo Box Bàn"**.
- **API Gọi Thực Tế:**
  - `POST http://localhost:8080/api/v1/restaurant/tables`
  - Body: `{"tableCode": "STD-99", "zoneType": "STANDARD", "minCapacity": 6, "maxCapacity": 4}`
- **Kết quả Mong Đợi (Expectation):**
  - **Backend:** Trả về HTTP `400 Bad Request`
    ```json
    {
      "success": false,
      "message": "Sức chứa tối thiểu không thể lớn hơn sức chứa tối đa"
    }
    ```
  - **Frontend:** Toast đỏ báo lỗi nghiệp vụ rõ ràng.

---

### Test Case 27.4: Lọc Box Bàn Theo Phân Khu (Zone Filter)
- **Mục tiêu:** Nhân viên điều phối lọc nhanh danh sách bàn theo từng khu vực không gian.
- **Thao tác Frontend (UI):**
  1. Tại tab **"Sơ Đồ Bàn (Box View)"**, quan sát thanh lọc khu vực: `[Tất Cả]`, `[Tiêu Chuẩn]`, `[Phòng VIP]`, `[View Mặt Kính]`, `[Ngoài Trời]`, `[Quầy Bar]`.
  2. Bấm vào nút `[Phòng VIP]`.
- **API Gọi Thực Tế:**
  - `GET http://localhost:8080/api/v1/restaurant/tables?zoneType=PRIVATE_VIP`
- **Kết quả Mong Đợi (Expectation):**
  - Danh sách Box bàn trên giao diện chỉ hiển thị các bàn có `zoneType = "PRIVATE_VIP"` (ví dụ: `VIP-01`, `VIP-88`).
  - Tổng số đếm thống kê trên tiêu đề khớp chính xác với số bàn VIP.

---

### Test Case 27.5: Cập Nhật Thông Tin Bàn Ăn
- **Thao tác Frontend (UI):**
  1. Bấm vào thẻ bàn `VIP-88`.
  2. Bấm nút **"Chỉnh Sửa"** ở chân thẻ bàn (hoặc trên cột Chi Tiết bên phải).
  3. Đổi sức chứa tối đa từ `8` thành `10`, Tiền cọc từ `500000` thành `600000`.
  4. Bấm **"Lưu Thay Đổi"**.
- **API Gọi Thực Tế:**
  - `PUT http://localhost:8080/api/v1/restaurant/tables/{id_cua_vip_88}`
  - Body: `{"tableCode": "VIP-88", "zoneType": "PRIVATE_VIP", "minCapacity": 4, "maxCapacity": 10, "customDeposit": 600000, "isActive": true}`
- **Kết quả Mong Đợi (Expectation):**
  - HTTP `200 OK`.
  - Thông số trên thẻ bàn hiển thị `4 - 10 Khách` và cọc `600.000 VNĐ`.

---

## 3. E2E UC-23: KHÓA BÀN KHẨN CẤP DO BẢO TRÌ & MỞ LẠI BÀN

### Test Case 23.1: Khóa Bàn Bảo Trì Khẩn Cấp (Lock Table)
- **Bối cảnh:** Bàn `VIP-88` bị hỏng máy lạnh hoặc sự cố đổ vỡ, Quản lý cần khóa gấp để khách không đặt được.
- **Thao tác Frontend (UI):**
  1. Bấm vào nút **"Tắt"** trên thẻ bàn `VIP-88` (hoặc bấm nút "Tạm Ngừng Hoạt Động Bàn" ở panel chi tiết).
- **API Gọi Thực Tế:**
  - `PATCH http://localhost:8080/api/v1/restaurant/tables/{id_cua_vip_88}/toggle`
- **Kết quả Mong Đợi (Expectation):**
  - **Backend:** HTTP `200 OK`, `data.isActive` chuyển sang `false`.
  - **Frontend:**
    - Toast xanh: *"Ngừng hoạt động bàn thành công"*.
    - Thẻ bàn mờ đi (`opacity-70`), chuyển sang badge đỏ **"Tạm Ngừng"**.
    - Nút thao tác chuyển thành **"Bật"**.
    - Số lượng bàn sẵn sàng phục vụ trên thẻ KPI giảm đi 1.

---

### Test Case 23.2: Mở Lại Bàn Sau Bảo Trì (Unlock Table)
- **Bối cảnh:** Bàn đã được khắc phục xong sự cố, mở lại phục vụ đón khách.
- **Thao tác Frontend (UI):**
  1. Bấm vào nút **"Bật"** trên thẻ bàn `VIP-88`.
- **API Gọi Thực Tế:**
  - `PATCH http://localhost:8080/api/v1/restaurant/tables/{id_cua_vip_88}/toggle`
- **Kết quả Mong Đợi (Expectation):**
  - **Backend:** HTTP `200 OK`, `data.isActive` chuyển sang `true`.
  - **Frontend:**
    - Toast xanh: *"Kích hoạt bàn thành công"*.
    - Thẻ bàn sáng rõ, badge xanh **"Hoạt Động"**.

---

### Test Case 23.3: Xóa Bàn Ăn Khỏi Hệ Thống
- **Thao tác Frontend (UI):**
  1. Bấm biểu tượng Thùng rác đỏ trên thẻ bàn `VIP-88`.
  2. Trình duyệt hiển thị popup xác nhận: *"Bạn có chắc chắn muốn xóa bàn này khỏi hệ thống?"* $\rightarrow$ Bấm **OK**.
- **API Gọi Thực Tế:**
  - `DELETE http://localhost:8080/api/v1/restaurant/tables/{id_cua_vip_88}`
- **Kết quả Mong Đợi (Expectation):**
  - **Backend:** HTTP `200 OK`, `message: "Xóa bàn thành công"`.
  - **Frontend:** Thẻ bàn `VIP-88` biến mất khỏi giao diện Box Grid.

---

## 4. E2E UC-28: CẤU HÌNH KHUNG GIỜ & CÔNG SUẤT TỐI ĐA CA PHỤC VỤ

### Test Case 28.1: Tạo Khung Giờ Ca Trực Mới (Happy Path)
- **Mục tiêu:** Tạo thêm ca phục vụ Trà chiều (Afternoon Tea).
- **Thao tác Frontend (UI):**
  1. Chọn tab **"Khung Giờ & Ca Trực"** trên sidebar.
  2. Bấm nút **"+ Thêm Ca Trực Mới"**.
  3. Nhập:
     - **Tên ca:** `Ca Trà Chiều Hoàng Hôn (14:30 - 17:00)`
     - **Giờ bắt đầu:** `14:30:00`
     - **Giờ kết thúc:** `17:00:00`
     - **Công suất tối đa:** `35`
  4. Bấm **"Lưu Ca Trực"**.
- **API Gọi Thực Tế:**
  - `POST http://localhost:8080/api/v1/restaurant/time-slots`
  - Body:
    ```json
    {
      "slotName": "Ca Trà Chiều Hoàng Hôn (14:30 - 17:00)",
      "startTime": "14:30:00",
      "endTime": "17:00:00",
      "maxCapacity": 35,
      "isActive": true
    }
    ```
- **Kết quả Mong Đợi (Expectation):**
  - HTTP `201 Created`.
  - Thẻ ca trực mới xuất hiện trên giao diện với công suất 35 khách tối đa.

---

### Test Case 28.2: Chặn Giờ Bắt Đầu Lớn Hơn Giờ Kết Thúc
- **Thao tác Frontend (UI):**
  1. Nhập `startTime: "18:00:00"`, `endTime: "16:00:00"`.
  2. Bấm **"Lưu Ca Trực"**.
- **API Gọi Thực Tế:**
  - `POST http://localhost:8080/api/v1/restaurant/time-slots`
- **Kết quả Mong Đợi (Expectation):**
  - HTTP `400 Bad Request`.
  - Message: `"Giờ bắt đầu phải trước giờ kết thúc"`.

---

### Test Case 28.3: Tạm Đóng / Kích Hoạt Ca Trực
- **Thao tác Frontend (UI):**
  1. Bấm vào nút trạng thái `[Đang Mở]` tại thẻ ca Trà Chiều.
- **API Gọi Thực Tế:**
  - `PATCH http://localhost:8080/api/v1/restaurant/time-slots/{id}/toggle`
- **Kết quả Mong Đợi (Expectation):**
  - HTTP `200 OK`.
  - Nút chuyển sang màu đỏ `[Tạm Đóng]`. Hệ thống booking bên ngoài sẽ chặn không cho khách đặt vào khung giờ này.

---

## 5. E2E UC-29: QUẢN LÝ THỰC ĐƠN, MÓN ĐẶT TRƯỚC & DANH MỤC

### Test Case 29.1: Thêm Danh Mục Thực Đơn Mới
- **Thao tác Frontend (UI):**
  1. Chọn tab **"Thực Đơn & Đặt Trước"**.
  2. Tại khối Danh Mục Thực Đơn, bấm **"+ Thêm Danh Mục"**.
  3. Nhập: Tên danh mục `Hải Sản Biển Sâu (Seafood)`, Thứ tự hiển thị: `5`.
  4. Bấm **"Lưu Danh Mục"**.
- **API Gọi Thực Tế:**
  - `POST http://localhost:8080/api/v1/restaurant/menu/categories`
  - Body: `{"name": "Hải Sản Biển Sâu (Seafood)", "displayOrder": 5, "isActive": true}`
- **Kết quả Mong Đợi (Expectation):**
  - HTTP `201 Created`.
  - Xuất hiện tag danh mục mới trong thanh phân loại.

---

### Test Case 29.2: Thêm Món Ăn Mới Kèm Cờ Pre-order
- **Thao tác Frontend (UI):**
  1. Bấm **"+ Thêm Món Ăn Mới"**.
  2. Nhập thông tin:
     - **Danh mục:** `Hải Sản Biển Sâu (Seafood)`
     - **Tên món:** `Tôm Hùm Alaska Nướng Bơ Tỏi (500g)`
     - **Giá bán:** `1250000`
     - **Link ảnh:** `https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&w=400&q=80`
     - **Mô tả:** `Tôm hùm tươi sống nhập khẩu nướng với bơ Pháp thượng hạng và tỏi lý sơn`
     - **Cờ đặt trước:** Tích chọn `[x] Cho phép khách đặt trước`
  3. Bấm **"Lưu Món Ăn"**.
- **API Gọi Thực Tế:**
  - `POST http://localhost:8080/api/v1/restaurant/menu/items`
  - Body:
    ```json
    {
      "categoryId": "<CATEGORY_ID>",
      "name": "Tôm Hùm Alaska Nướng Bơ Tỏi (500g)",
      "description": "Tôm hùm tươi sống nhập khẩu nướng với bơ Pháp thượng hạng và tỏi lý sơn",
      "price": 1250000,
      "imageUrl": "https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&w=400&q=80",
      "isPreorderAvailable": true,
      "isActive": true
    }
    ```
- **Kết quả Mong Đợi (Expectation):**
  - HTTP `201 Created`.
  - Món ăn hiển thị thẻ hình ảnh sang trọng, giá `1.250.000 đ` kèm badge **"Đặt Trước"**.

---

### Test Case 29.3: Chặn Xóa Danh Mục Khi Còn Món Ăn
- **Thao tác Frontend (UI):**
  1. Bấm nút xóa (thùng rác) tại tag danh mục `Hải Sản Biển Sâu (Seafood)`.
- **API Gọi Thực Tế:**
  - `DELETE http://localhost:8080/api/v1/restaurant/menu/categories/{id}`
- **Kết quả Mong Đợi (Expectation):**
  - HTTP `400 Bad Request`.
  - Message: `"Không thể xóa danh mục đang có món ăn. Vui lòng chuyển hoặc xóa các món ăn trước"`.

---

## 6. E2E UC-30: CẤU HÌNH NGÀY LỄ, PHỤ THU CỌC & BLACKOUT DATES

### Test Case 30.1: Thiết Lập Ngày Lễ Phụ Thu Tiền Cọc (Happy Path)
- **Bối cảnh:** Dịp Lễ Tình Nhân 14/02, nhà hàng tăng mức cọc và yêu cầu đặt thực đơn cố định.
- **Thao tác Frontend (UI):**
  1. Chọn tab **"Ngày Lễ & Blackout Dates"**.
  2. Bấm nút **"+ Thiết Lập Ngày Lễ Mới"**.
  3. Nhập:
     - **Ngày diễn ra:** `2026-02-14`
     - **Tên dịp lễ:** `Valentine's Day (Lễ Tình Nhân)`
     - **Mức cọc tùy chỉnh:** `400000`
     - **Ghi chú:** `Phụ thu đêm Valentine & Tặng hoa hồng sáp`
     - **Đóng cửa hoàn toàn:** `Không [ ]`
  4. Bấm **"Lưu Cấu Hình"**.
- **API Gọi Thực Tế:**
  - `POST http://localhost:8080/api/v1/restaurant/blackout-dates`
  - Body:
    ```json
    {
      "eventDate": "2026-02-14",
      "eventName": "Valentine's Day (Lễ Tình Nhân)",
      "isClosed": false,
      "customDepositAmount": 400000,
      "requireSpecialMenu": false,
      "note": "Phụ thu đêm Valentine & Tặng hoa hồng sáp"
    }
    ```
- **Kết quả Mong Đợi (Expectation):**
  - HTTP `201 Created`.
  - Thẻ ngày lễ hiển thị tiền cọc `400.000 đ`, trạng thái `Mở Phục Vụ`.

---

### Test Case 30.2: Chặn Trùng Ngày Lễ Trong Cùng Một Ngày
- **Thao tác Frontend (UI):**
  1. Gửi lại request cấu hình cho cùng ngày `2026-02-14`.
- **Kết quả Mong Đợi (Expectation):**
  - HTTP `409 Conflict`.
  - Message: `"Đã tồn tại cấu hình sự kiện cho ngày này"`.

---

### Test Case 30.3: Thiết Lập Ngày Đóng Cửa Bảo Trì (Full Blackout)
- **Bối cảnh:** Ngày `2026-05-01`, toàn bộ nhà hàng nghỉ lễ bảo trì tổng thể hệ thống gas và điện.
- **Thao tác Frontend (UI):**
  1. Bấm **"+ Thiết Lập Ngày Lễ Mới"**.
  2. Chọn ngày `2026-05-01`, Tên: `Bảo Trì Định Kỳ Toàn Nhà Hàng`.
  3. Tích chọn `[x] Đóng cửa hoàn toàn / Bảo trì nhà hàng (Chặn đặt bàn)`.
  4. Bấm **"Lưu Cấu Hình"**.
- **API Gọi Thực Tế:**
  - `POST http://localhost:8080/api/v1/restaurant/blackout-dates` với `"isClosed": true`.
- **Kết quả Mong Đợi (Expectation):**
  - HTTP `201 Created`.
  - Thẻ hiển thị màu đỏ viền hồng với badge **"Đóng Cửa / Bảo Trì"**. Khách hàng trên trang đặt bàn sẽ thấy ngày này bị disable/mờ đi.

---

## 7. E2E BỔ SUNG: HỒ SƠ NHÀ HÀNG & THIẾT LẬP TÀI KHOẢN NGÂN HÀNG VIETQR

### Test Case 31.1: Cập Nhật Tài Khoản Ngân Hàng Doanh Nghiệp & Tiền Cọc Mặc Định
- **Mục tiêu:** Quản trị viên cập nhật số tài khoản nhận tiền cọc VietQR và mức cọc cơ bản.
- **Thao tác Frontend (UI):**
  1. Chọn tab **"Hồ Sơ Nhà Hàng"**.
  2. Tại nhóm Thông Tin Cơ Bản:
     - Tên nhà hàng: `The Prime Bistro & Steakhouse Signature`
     - Hotline: `0901234567`
  3. Tại nhóm Cấu Hình Ngân Hàng VietQR:
     - Tên ngân hàng: `MBBank (Ngân hàng Quân Đội)`
     - Mã BIN: `970422`
     - Số tài khoản: `0388999999`
     - Tên chủ tài khoản: `CONG TY TNHH THE PRIME BISTRO`
     - Tiền cọc mặc định: `250000`
     - Thời gian giữ chỗ: `300` (giây)
  4. Bấm **"Lưu Hồ Sơ Nhà Hàng"**.
- **API Gọi Thực Tế:**
  - `PUT http://localhost:8080/api/v1/restaurant/profile`
  - Body (`RestaurantProfile`):
    ```json
    {
      "name": "The Prime Bistro & Steakhouse Signature",
      "hotline": "0901234567",
      "email": "contact@theprimebistro.vn",
      "address": "123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh",
      "description": "Fine dining steakhouse & European culinary experience",
      "bankBin": "970422",
      "bankName": "MBBank (Ngân hàng Quân Đội)",
      "bankAccountNo": "0388999999",
      "bankAccountHolder": "CONG TY TNHH THE PRIME BISTRO",
      "defaultDepositAmount": 250000,
      "cancellationGraceHours": 6,
      "holdTimeoutSeconds": 300
    }
    ```
- **Kết quả Mong Đợi (Expectation):**
  - **Backend:** HTTP `200 OK`.
  - **Frontend:** Toast xanh *"Cập nhật hồ sơ nhà hàng thành công!"*. Mức tiền cọc `250.000 đ` được hiển thị ngay trên thẻ KPI tổng quan.

---

## 8. BẢNG CHECKLIST TỔNG HỢP KIỂM THỬ (E2E MATRIX)

| Mã Case | Ca Kiểm Thử | Phương thức | Endpoint API | Trạng thái FE | Kết quả |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-27.1** | Tạo box bàn mới hợp lệ | `POST` | `/api/v1/restaurant/tables` | Thẻ bàn xuất hiện trên Box Grid | [ ] PASS |
| **TC-27.2** | Chặn trùng mã bàn | `POST` | `/api/v1/restaurant/tables` | Toast lỗi `409 Conflict` | [ ] PASS |
| **TC-27.3** | Chặn `minCapacity > maxCapacity` | `POST` | `/api/v1/restaurant/tables` | Toast lỗi `400 Bad Request` | [ ] PASS |
| **TC-27.4** | Lọc bàn theo phân khu (`zoneType`) | `GET` | `/api/v1/restaurant/tables?zoneType=...` | Grid lọc chính xác theo khu vực | [ ] PASS |
| **TC-27.5** | Sửa thông tin bàn | `PUT` | `/api/v1/restaurant/tables/{id}` | Cập nhật số ghế và tiền cọc | [ ] PASS |
| **TC-23.1** | Khóa bàn bảo trì khẩn cấp | `PATCH` | `/api/v1/restaurant/tables/{id}/toggle` | Thẻ mờ đi, badge Tạm Ngừng | [ ] PASS |
| **TC-23.2** | Mở lại bàn sau bảo trì | `PATCH` | `/api/v1/restaurant/tables/{id}/toggle` | Thẻ sáng, badge Hoạt Động | [ ] PASS |
| **TC-23.3** | Xóa bàn ăn | `DELETE` | `/api/v1/restaurant/tables/{id}` | Biến mất khỏi Box Grid | [ ] PASS |
| **TC-28.1** | Tạo khung giờ ca trực mới | `POST` | `/api/v1/restaurant/time-slots` | Thẻ ca trực mới xuất hiện | [ ] PASS |
| **TC-28.2** | Chặn `startTime >= endTime` | `POST` | `/api/v1/restaurant/time-slots` | Báo lỗi `400 Bad Request` | [ ] PASS |
| **TC-28.3** | Bật/Tắt ca trực | `PATCH` | `/api/v1/restaurant/time-slots/{id}/toggle` | Đổi badge Đang Mở / Tạm Đóng | [ ] PASS |
| **TC-29.1** | Thêm danh mục món | `POST` | `/api/v1/restaurant/menu/categories` | Thêm tag danh mục | [ ] PASS |
| **TC-29.2** | Thêm món có cờ đặt trước | `POST` | `/api/v1/restaurant/menu/items` | Thẻ món kèm badge "Đặt Trước" | [ ] PASS |
| **TC-29.3** | Chặn xóa danh mục có món | `DELETE` | `/api/v1/restaurant/menu/categories/{id}` | Báo lỗi `400 Category Has Items`| [ ] PASS |
| **TC-30.1** | Thiết lập ngày lễ phụ thu cọc | `POST` | `/api/v1/restaurant/blackout-dates` | Thẻ ngày lễ cọc 400.000 đ | [ ] PASS |
| **TC-30.2** | Chặn trùng ngày lễ | `POST` | `/api/v1/restaurant/blackout-dates` | Báo lỗi `409 Conflict` | [ ] PASS |
| **TC-30.3** | Thiết lập ngày đóng cửa bảo trì | `POST` | `/api/v1/restaurant/blackout-dates` | Thẻ đỏ badge "Đóng Cửa / Bảo Trì"| [ ] PASS |
| **TC-31.1** | Cập nhật hồ sơ & VietQR cọc | `PUT` | `/api/v1/restaurant/profile` | Lưu thành công, cập nhật KPI | [ ] PASS |
