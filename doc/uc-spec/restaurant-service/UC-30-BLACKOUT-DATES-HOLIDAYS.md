# ĐẶC TẢ CHI TIẾT USE CASE: UC-30
# CẤU HÌNH NGÀY LỄ, PHỤ THU CỌC & BLACKOUT DATES (HOLIDAY PRICING & SPECIAL EVENTS)

> **Dự án:** Hệ thống Quản lý Đặt bàn & Điều phối Bàn ăn Nhà hàng Cao cấp (TableMaster)  
> **Phân hệ:** Module 2 - Restaurant & Table Service (Port 8082)  
> **Mã Use Case:** `UC-30`  
> **Trạng thái:** **Hoàn thành 100% & Đã kiểm thử thành công (Tested & Verified - 23/23 Tests Pass)**

---

## 1. TỔNG QUAN USE CASE (OVERVIEW)

### 1.1. Mục tiêu
1. **Thiết lập mức cọc tăng cường ngày lễ:** Vào các dịp cao điểm (Valentine 14/02, Giáng Sinh 24/12, Đêm Giao Thừa 31/12), nhà hàng thiết lập mức cọc tùy chỉnh cao hơn bình thường (`customDepositAmount`) để đảm bảo khách đến đúng hẹn và cam kết dịch vụ.
2. **Khóa chặn ngày đặc biệt (Blackout Dates / Closure):** Khi nhà hàng có sự kiện bao trọn tiệc cưới hoặc đóng cửa bảo trì toàn diện (`isClosed = true`), hệ thống đặt bàn sẽ khóa lịch, chặn khách không chọn được ngày này.
3. **Chống trùng lặp sự kiện:** Ràng buộc duy nhất trên trường `eventDate` (`uq_blackout_date`), ngăn chặn cấu hình 2 sự kiện chồng chéo trên cùng 1 ngày.

### 1.2. Hệ thống Tác nhân (Actors)
* **Quản trị viên / Tổng quản lý (General Manager / Admin):** Cấu hình biểu phí ngày lễ và ngày đóng cửa.
* **Hệ thống Đặt bàn (`booking-service`):** Kiểm tra ngày khách chọn có rơi vào Blackout Date hay không để áp dụng mức cọc hoặc khóa lịch.

---

## 2. QUY TẮC NGHIỆP VỤ (BUSINESS RULES)

* **BR-REST-13 (Ràng buộc ngày sự kiện duy nhất):** Mỗi ngày trong năm chỉ có tối đa 1 bản ghi cấu hình trong bảng `blackout_dates`. Nếu tạo trùng sẽ trả về `409 Conflict` (`BLACKOUT_DATE_ALREADY_EXISTS`).
* **BR-REST-14 (Ưu tiên tiền cọc ngày lễ):** Nếu ngày đặt bàn trùng với ngày có trong `blackout_dates` và có `customDepositAmount`, hệ thống sẽ sử dụng mức cọc này cho tất cả đơn đặt bàn trong ngày.
* **BR-REST-15 (Chặn đặt bàn khi đóng cửa):** Nếu `isClosed = true`, toàn bộ các khung giờ và bàn trong ngày đó đều không thể nhận đặt bàn.

---

## 3. DANH SÁCH ENDPOINTS API (RESTFUL SPECIFICATION)

| STT | Phương thức | Đường dẫn Endpoint | Mô tả chức năng | Request Body | Response |
| :---: | :---: | :--- | :--- | :--- | :--- |
| 1 | `GET` | `/api/v1/restaurant/blackout-dates` | Lấy toàn bộ danh sách ngày lễ và ngày đặc biệt | N/A | `ApiResponse<List<BlackoutDateResponse>>` |
| 2 | `GET` | `/api/v1/restaurant/blackout-dates/{id}` | Lấy chi tiết cấu hình ngày lễ theo ID | N/A | `ApiResponse<BlackoutDateResponse>` |
| 3 | `POST` | `/api/v1/restaurant/blackout-dates` | Tạo mới cấu hình ngày lễ hoặc ngày đóng cửa | `BlackoutDateRequest` | `ApiResponse<BlackoutDateResponse>` (`201 Created`) |
| 4 | `PUT` | `/api/v1/restaurant/blackout-dates/{id}` | Cập nhật cấu hình ngày đặc biệt | `BlackoutDateRequest` | `ApiResponse<BlackoutDateResponse>` (`200 OK`) |
| 5 | `DELETE`| `/api/v1/restaurant/blackout-dates/{id}` | Xóa cấu hình ngày lễ | N/A | `ApiResponse<Void>` (`200 OK`) |

---

## 4. CHI TIẾT TEST CASES UNIT & E2E

* **Unit Tests:** `BlackoutDateServiceTest` (4 test cases bao phủ tạo ngày lễ thành công, chặn trùng ngày, kiểm tra phụ thu cọc, xóa sự kiện).
* **E2E Tests:** `TC-30.1`, `TC-30.2`, `TC-30.3`.
