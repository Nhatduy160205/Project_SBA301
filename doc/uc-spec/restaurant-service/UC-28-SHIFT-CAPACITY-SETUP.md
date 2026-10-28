# ĐẶC TẢ CHI TIẾT USE CASE: UC-28
# CẤU HÌNH KHUNG GIỜ & CÔNG SUẤT TỐI ĐA CA PHỤC VỤ (SHIFT & CAPACITY CEILING)

> **Dự án:** Hệ thống Quản lý Đặt bàn & Điều phối Bàn ăn Nhà hàng Cao cấp (TableMaster)  
> **Phân hệ:** Module 2 - Restaurant & Table Service (Port 8082)  
> **Mã Use Case:** `UC-28`  
> **Trạng thái:** **Hoàn thành 100% & Đã kiểm thử thành công (Tested & Verified - 23/23 Tests Pass)**

---

## 1. TỔNG QUAN USE CASE (OVERVIEW)

### 1.1. Mục tiêu
1. **Thiết lập ca giờ phục vụ:** Quản lý các khung giờ ăn uống cố định trong ngày (Ca trưa, Ca tối Giờ Vàng, Ca đêm Rooftop).
2. **Khống chế công suất trần (BR-06: Capacity Ceiling):** Mỗi ca được thiết lập ngưỡng khách tối đa (`maxCapacity`, ví dụ: 40 khách/ca) để ngăn ngừa tình trạng quá tải nhân viên phục vụ và bếp chế biến dồn đơn cùng lúc.
3. **Ràng buộc thời gian hợp lệ:** Kiểm tra thời gian bắt đầu luôn phải diễn ra trước thời gian kết thúc (`startTime < endTime`), tránh khung giờ âm hoặc lỗi logic.

### 1.2. Hệ thống Tác nhân (Actors)
* **Quản trị viên / Bếp trưởng (Admin / Executive Chef):** Cân đối số lượng khách tối đa phục vụ được theo từng ca trực.
* **Hệ thống Đặt bàn (`booking-service`):** Kiểm tra tổng số khách đặt trong ca so với `maxCapacity` trước khi cho phép giữ chỗ.

---

## 2. QUY TẮC NGHIỆP VỤ (BUSINESS RULES)

* **BR-REST-07 (Khung giờ duy nhất):** Cặp `(startTime, endTime)` là duy nhất trong hệ thống (`uq_slot_time`). Nếu tạo trùng sẽ trả về `409 Conflict`.
* **BR-REST-08 (Ràng buộc thời gian ca):** `startTime` phải diễn ra trước `endTime`. Nếu sai phạm sẽ trả về `400 Bad Request` (`TIME_SLOT_INVALID_HOURS`).
* **BR-REST-09 (Đóng/Mở ca linh hoạt):** Ca trực có thể tạm ngưng nhận khách thông qua API toggle (`isActive = false`).

---

## 3. DANH SÁCH ENDPOINTS API (RESTFUL SPECIFICATION)

| STT | Phương thức | Đường dẫn Endpoint | Mô tả chức năng | Request Body | Response |
| :---: | :---: | :--- | :--- | :--- | :--- |
| 1 | `GET` | `/api/v1/restaurant/time-slots` | Lấy danh sách ca giờ, hỗ trợ query param `activeOnly` | N/A | `ApiResponse<List<TimeSlotResponse>>` |
| 2 | `GET` | `/api/v1/restaurant/time-slots/{id}` | Lấy chi tiết thông tin ca trực theo ID | N/A | `ApiResponse<TimeSlotResponse>` |
| 3 | `POST` | `/api/v1/restaurant/time-slots` | Tạo mới khung giờ ca phục vụ | `TimeSlotRequest` | `ApiResponse<TimeSlotResponse>` (`201 Created`) |
| 4 | `PUT` | `/api/v1/restaurant/time-slots/{id}` | Cập nhật thông tin ca trực | `TimeSlotRequest` | `ApiResponse<TimeSlotResponse>` (`200 OK`) |
| 5 | `PATCH` | `/api/v1/restaurant/time-slots/{id}/toggle` | Đóng hoặc mở lại ca trực nhận khách | N/A | `ApiResponse<TimeSlotResponse>` (`200 OK`) |
| 6 | `DELETE`| `/api/v1/restaurant/time-slots/{id}` | Xóa khung giờ ca trực | N/A | `ApiResponse<Void>` (`200 OK`) |

---

## 4. CHI TIẾT TEST CASES UNIT & E2E

* **Unit Tests:** `TimeSlotServiceTest` (6 test cases bao phủ tạo ca thành công, chặn trùng giờ, chặn giờ kết thúc trước giờ bắt đầu, toggle đóng mở ca).
* **E2E Tests:** `TC-28.1`, `TC-28.2`, `TC-28.3`.
