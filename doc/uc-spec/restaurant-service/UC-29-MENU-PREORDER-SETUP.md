# ĐẶC TẢ CHI TIẾT USE CASE: UC-29
# QUẢN LÝ THỰC ĐƠN, MÓN ĐẶT TRƯỚC & THIẾT LẬP CỌC VIETQR (MENU & PRE-ORDER SETUP)

> **Dự án:** Hệ thống Quản lý Đặt bàn & Điều phối Bàn ăn Nhà hàng Cao cấp (TableMaster)  
> **Phân hệ:** Module 2 - Restaurant & Table Service (Port 8082)  
> **Mã Use Case:** `UC-29`  
> **Trạng thái:** **Hoàn thành 100% & Đã kiểm thử thành công (Tested & Verified - 23/23 Tests Pass)**

---

## 1. TỔNG QUAN USE CASE (OVERVIEW)

### 1.1. Mục tiêu
1. **Quản lý danh mục thực đơn (Menu Categories):** Phân nhóm món ăn theo các danh mục trực quan (Steak thượng hạng, Rượu vang & Đồ uống, Khai vị & Salad, Tráng miệng).
2. **Quản lý món ăn & Cờ đặt trước (`isPreorderAvailable`):** Hỗ trợ gắn cờ cho phép khách đặt trước món ăn đắt tiền / chế biến cầu kỳ (Bò Wagyu A5, Tôm hùm Alaska, Rượu vang ủ thùng sồi) ngay trong quá trình đặt bàn và cọc tiền trực tuyến.
3. **Cấu hình Hồ sơ nhà hàng & Tài khoản VietQR:** Lưu thông tin tài khoản ngân hàng doanh nghiệp (Mã BIN ngân hàng, Số tài khoản, Tên chủ tài khoản) và mức tiền cọc tiêu chuẩn (`defaultDepositAmount`) để `payment-service` sinh mã VietQR động chuẩn NAPAS 247.

### 1.2. Hệ thống Tác nhân (Actors)
* **Bếp trưởng / Quản lý ẩm thực (Chef / F&B Manager):** Cập nhật món ăn, hình ảnh, đơn giá và cấu hình món đặt trước.
* **Thực khách (Diner):** Xem thực đơn trên trang đặt bàn và chọn món đặt trước.
* **Hệ thống Thanh toán (`payment-service`):** Lấy thông tin tài khoản ngân hàng từ Restaurant Service để tạo mã QR thanh toán cọc.

---

## 2. QUY TẮC NGHIỆP VỤ (BUSINESS RULES)

* **BR-REST-10 (Ràng buộc toàn vẹn danh mục):** Không cho phép xóa danh mục khi danh mục đó đang chứa các món ăn (`CATEGORY_HAS_ITEMS` - `400 Bad Request`). Phải di dời hoặc xóa các món ăn trước.
* **BR-REST-11 (Cờ đặt trước món):** Món ăn có `isPreorderAvailable = true` mới được hiển thị trong danh sách chọn món trước của luồng đặt bàn.
* **BR-REST-12 (Tài khoản VietQR hợp lệ):** Mã BIN ngân hàng (6 số chuẩn NAPAS) và số tài khoản ngân hàng không được để trống để đảm bảo quá trình sinh mã QR cọc không bị gián đoạn.

---

## 3. DANH SÁCH ENDPOINTS API (RESTFUL SPECIFICATION)

| STT | Phương thức | Đường dẫn Endpoint | Mô tả chức năng | Request Body | Response |
| :---: | :---: | :--- | :--- | :--- | :--- |
| 1 | `GET` | `/api/v1/restaurant/profile` | Lấy thông tin hồ sơ nhà hàng & ngân hàng VietQR | N/A | `ApiResponse<RestaurantProfileResponse>` |
| 2 | `PUT` | `/api/v1/restaurant/profile` | Cập nhật hồ sơ nhà hàng, tài khoản VietQR, tiền cọc | `RestaurantProfileRequest` | `ApiResponse<RestaurantProfileResponse>` |
| 3 | `GET` | `/api/v1/restaurant/menu/categories` | Lấy danh mục món ăn (kèm danh sách món nếu có) | Query: `activeOnly`, `includeItems` | `ApiResponse<List<MenuCategoryResponse>>` |
| 4 | `POST` | `/api/v1/restaurant/menu/categories` | Thêm danh mục món ăn mới | `MenuCategoryRequest` | `ApiResponse<MenuCategoryResponse>` (`201 Created`) |
| 5 | `DELETE`| `/api/v1/restaurant/menu/categories/{id}` | Xóa danh mục món ăn (Chặn nếu có món) | N/A | `ApiResponse<Void>` |
| 6 | `GET` | `/api/v1/restaurant/menu/items` | Lấy danh sách món ăn, hỗ trợ lọc theo danh mục, preorder | Query: `categoryId`, `preorderOnly` | `ApiResponse<List<MenuItemResponse>>` |
| 7 | `POST` | `/api/v1/restaurant/menu/items` | Thêm món ăn mới kèm cờ đặt trước | `MenuItemRequest` | `ApiResponse<MenuItemResponse>` (`201 Created`) |
| 8 | `PUT` | `/api/v1/restaurant/menu/items/{id}` | Cập nhật thông tin món ăn | `MenuItemRequest` | `ApiResponse<MenuItemResponse>` |
| 9 | `DELETE`| `/api/v1/restaurant/menu/items/{id}` | Xóa món ăn khỏi thực đơn | N/A | `ApiResponse<Void>` |

---

## 4. CHI TIẾT TEST CASES UNIT & E2E

* **Unit Tests:** `MenuItemAndCategoryServiceTest` (5 test cases: tạo danh mục, chặn xóa danh mục có món, tạo món với cờ đặt trước, cập nhật giá, toggle trạng thái).
* **E2E Tests:** `TC-29.1`, `TC-29.2`, `TC-29.3`, `TC-31.1`.
