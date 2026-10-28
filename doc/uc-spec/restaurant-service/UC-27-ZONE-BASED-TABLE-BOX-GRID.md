# ĐẶC TẢ CHI TIẾT USE CASE: UC-27
# QUẢN LÝ DANH MỤC THẺ BOX BÀN & PHÂN KHU KHÔNG GIAN (ZONE-BASED TABLE BOX INVENTORY)

> **Dự án:** Hệ thống Quản lý Đặt bàn & Điều phối Bàn ăn Nhà hàng Cao cấp (TableMaster)  
> **Phân hệ:** Module 2 - Restaurant & Table Service (Port 8082)  
> **Mã Use Case:** `UC-27`  
> **Trạng thái:** **Hoàn thành 100% & Đã kiểm thử thành công (Tested & Verified - 23/23 Tests Pass)**

---

## 1. TỔNG QUAN USE CASE (OVERVIEW)

### 1.1. Mục tiêu
1. **Quản lý danh mục bàn ăn dạng thẻ Box:** Thay thế hoàn toàn canvas 2D kéo thả phức tạp bằng mô hình thẻ Box Grid trực quan, tập trung vào sức chứa (min/max capacity), tiền cọc riêng và trạng thái khả dụng.
2. **Phân khu không gian ẩm thực (`zoneType`):** Phân chia bàn vào các khu vực phục vụ đẳng cấp:
   - `STANDARD`: Bàn ăn tiêu chuẩn
   - `PRIVATE_VIP`: Phòng VIP tiệc riêng tư
   - `WINDOW_VIEW`: Bàn mặt kính view phố
   - `OUTDOOR`: Ban công ngoài trời
   - `BAR_COUNTER`: Quầy bar pha chế
3. **Kiểm tra hợp lệ dữ liệu:** Ngăn chặn trùng mã bàn (`409 Conflict`), kiểm tra sức chứa tối thiểu không lớn hơn tối đa (`400 Bad Request`).

### 1.2. Hệ thống Tác nhân (Actors)
* **Quản trị viên / Quản lý nhà hàng (Admin / Restaurant Manager):** Thêm mới, chỉnh sửa thông số bàn ăn, xóa bàn.
* **Nhân viên lễ tân / Điều phối (Host / Receptionist):** Tra cứu bàn theo phân khu trên Box Grid.

---

## 2. QUY TẮC NGHIỆP VỤ (BUSINESS RULES)

* **BR-REST-01 (Mã bàn duy nhất):** Mã bàn (`tableCode`) là duy nhất trên toàn hệ thống (Case-insensitive, lưu dạng chữ hoa).
* **BR-REST-02 (Ràng buộc sức chứa):** `minCapacity <= maxCapacity` và `minCapacity >= 1`.
* **BR-REST-03 (Phân loại Zone):** Bàn phải thuộc một trong các Zone hợp lệ: `STANDARD`, `PRIVATE_VIP`, `WINDOW_VIEW`, `OUTDOOR`, `BAR_COUNTER`.
* **BR-REST-04 (Tiền cọc bàn riêng):** Nếu bàn có `customDeposit`, hệ thống booking sẽ ưu tiên sử dụng mức cọc này thay cho `defaultDepositAmount` của quán.

---

## 3. DANH SÁCH ENDPOINTS API (RESTFUL SPECIFICATION)

| STT | Phương thức | Đường dẫn Endpoint | Mô tả chức năng | Request Body | Response |
| :---: | :---: | :--- | :--- | :--- | :--- |
| 1 | `GET` | `/api/v1/restaurant/tables` | Lấy danh sách bàn, hỗ trợ lọc theo `zoneType` và `activeOnly` | Query Params: `zoneType`, `activeOnly` | `ApiResponse<List<TableResponse>>` |
| 2 | `GET` | `/api/v1/restaurant/tables/{id}` | Lấy chi tiết thông tin bàn theo ID | N/A | `ApiResponse<TableResponse>` |
| 3 | `GET` | `/api/v1/restaurant/tables/code/{code}` | Lấy chi tiết thông tin bàn theo mã | N/A | `ApiResponse<TableResponse>` |
| 4 | `POST` | `/api/v1/restaurant/tables` | Thêm mới bàn ăn vào hệ thống | `TableRequest` | `ApiResponse<TableResponse>` (`201 Created`) |
| 5 | `PUT` | `/api/v1/restaurant/tables/{id}` | Cập nhật thông số bàn ăn | `TableRequest` | `ApiResponse<TableResponse>` (`200 OK`) |
| 6 | `DELETE`| `/api/v1/restaurant/tables/{id}` | Xóa bàn ăn khỏi hệ thống | N/A | `ApiResponse<Void>` (`200 OK`) |
