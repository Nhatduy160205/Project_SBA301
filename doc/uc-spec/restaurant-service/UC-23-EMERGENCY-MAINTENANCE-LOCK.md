# ĐẶC TẢ CHI TIẾT USE CASE: UC-23
# KHÓA BÀN KHẨN CẤP DO BẢO TRÌ & MỞ LẠI BÀN (EMERGENCY TABLE MAINTENANCE LOCK)

> **Dự án:** Hệ thống Quản lý Đặt bàn & Điều phối Bàn ăn Nhà hàng Cao cấp (TableMaster)  
> **Phân hệ:** Module 2 - Restaurant & Table Service (Port 8082)  
> **Mã Use Case:** `UC-23`  
> **Trạng thái:** **Hoàn thành 100% & Đã kiểm thử thành công (Tested & Verified - 23/23 Tests Pass)**

---

## 1. TỔNG QUAN USE CASE (OVERVIEW)

### 1.1. Mục tiêu
1. **Khóa bàn khẩn cấp 1-chạm:** Cho phép Quản lý ca hoặc Trưởng bàn ngay lập tức vô hiệu hóa bàn (`isActive = false`) khi xảy ra sự cố cơ sở vật chất (đổ vỡ chén đĩa, hỏng bóng đèn/máy lạnh, bảo dưỡng nội thất).
2. **Đồng bộ trạng thái đón khách:** Khi bàn bị khóa bảo trì:
   - Hệ thống quét bàn trống (Availability Engine của `booking-service`) sẽ tự động loại bỏ bàn này khỏi danh sách bàn gợi ý cho thực khách.
   - Thẻ Box bàn trên giao diện quản trị chuyển sang trạng thái mờ (`opacity-70`) kèm nhãn đỏ **"Tạm Ngừng"**.
3. **Mở lại bàn sau bảo trì:** Sau khi hoàn thành khắc phục, 1 chạm để kích hoạt lại (`isActive = true`), đưa bàn trở lại trạng thái sẵn sàng nhận khách.

### 1.2. Hệ thống Tác nhân (Actors)
* **Quản lý ca / Host Lễ tân (Shift Manager / Host):** Kích hoạt khóa bảo trì khẩn cấp hoặc mở lại bàn.
* **Hệ thống Đặt bàn (`booking-service`):** Lọc theo `activeOnly = true` để không cấp bàn đang sửa chữa.

---

## 2. QUY TẮC NGHIỆP VỤ (BUSINESS RULES)

* **BR-REST-05 (Chặn đặt bàn khi bảo trì):** Bàn có `isActive = false` sẽ không thể được gán cho bất kỳ đơn đặt bàn mới nào.
* **BR-REST-06 (Chuyển đổi trạng thái nguyên tử):** Thao tác `toggleActive` được thực hiện tức thì thông qua endpoint `PATCH /api/v1/restaurant/tables/{id}/toggle`.

---

## 3. DANH SÁCH ENDPOINTS API (RESTFUL SPECIFICATION)

| STT | Phương thức | Đường dẫn Endpoint | Mô tả chức năng | Request Body | Response |
| :---: | :---: | :--- | :--- | :--- | :--- |
| 1 | `PATCH` | `/api/v1/restaurant/tables/{id}/toggle` | Đảo ngược trạng thái hoạt động (Active <-> Inactive) | N/A | `ApiResponse<TableResponse>` (`200 OK`) |

---

## 4. CHI TIẾT TEST CASES UNIT & E2E

* **Unit Test:** `TableServiceTest.testToggleActive_EmergencyLock` (Khóa bàn `isActive` chuyển từ `true` sang `false`).
* **Unit Test:** `TableServiceTest.testToggleActive_Reactivate` (Mở lại bàn `isActive` chuyển từ `false` sang `true`).
* **E2E Test:** `TC-23.1` (Khóa bàn trên UI Box Grid) & `TC-23.2` (Mở lại bàn trên UI Box Grid).
