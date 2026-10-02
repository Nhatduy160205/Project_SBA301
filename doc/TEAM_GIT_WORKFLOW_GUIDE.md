# HƯỚNG DẪN QUY TRÌNH LÀM VIỆC NHÓM VÀ QUẢN LÝ SOURCE CODE VỚI GIT & GITHUB
> **Dự án:** TableMaster - Hệ Thống Đặt Bàn & Quản Lý Nhà Hàng Microservices  
> **Repository:** [https://github.com/Nhatduy160205/Project_SBA301](https://github.com/Nhatduy160205/Project_SBA301)  
> **Áp dụng cho:** Toàn bộ thành viên nhóm dự án SBA301

---

## I. NGUYÊN TẮC VÀNG (GOLDEN RULES)

1. **TUYỆT ĐỐI KHÔNG PUSH TRỰC TIẾP LÊN NHÁNH `main`:**
   * Nhánh `main` là nhánh sản phẩm chính thức, luôn phải ở trạng thái chạy được, không có lỗi biên dịch.
   * Mọi thay đổi đều phải thông qua **Nhánh phụ (Feature Branch) ➔ Mở Pull Request (PR) ➔ Trưởng nhóm review và duyệt**.
2. **LUÔN CẬP NHẬT CODE MỚI TRƯỚC KHI LÀM:**
   * Trước khi bắt đầu code một tính năng mới hoặc mỗi đầu buổi làm việc, luôn chạy `git checkout main && git pull origin main` để lấy những code mới nhất các bạn khác đã gộp.
3. **KHÔNG COMMIT FILE RÁC:**
   * Không commit các thư mục: `target/`, `node_modules/`, `.idea/`, `.vscode/`, file `.class`, `.jar`.
   * Dự án đã có file `.gitignore` ở thư mục gốc, hãy đảm bảo bạn không dùng lệnh `git add -f` để ép đẩy file rác.
4. **QUY ƯỚC ĐẶT TÊN NHÁNH (BRANCH):**
   * Định dạng chuẩn: `feature/<tên_thành_viên>-<tên_chức_năng>` hoặc `fix/<tên_thành_viên>-<lỗi_cần_sửa>`
   * *Ví dụ:*
     * `feature/huy-booking-service`
     * `feature/nam-auth-jwt`
     * `fix/lan-fix-cors-gateway`
5. **QUY ƯỚC COMMIT MESSAGE:**
   * Sử dụng tiền tố rõ ràng:
     * `feat:` Tính năng mới (ví dụ: `feat: them api tao hoa don momo`)
     * `fix:` Sửa lỗi (ví dụ: `fix: sua loi timeout ket noi redis`)
     * `refactor:` Tối ưu code nhưng không đổi logic
     * `docs:` Cập nhật tài liệu, README

---

## II. HƯỚNG DẪN CHI TIẾT DÀNH CHO THÀNH VIÊN (TEAM MEMBERS)

### Bước 1: Chấp nhận lời mời vào Repository
1. Kiểm tra hòm thư Email bạn đăng ký GitHub hoặc truy cập trực tiếp:  
   👉 [https://github.com/Nhatduy160205/Project_SBA301](https://github.com/Nhatduy160205/Project_SBA301)
2. Bấm nút **Accept invitation** (Chấp nhận lời mời) để có quyền cộng tác trong dự án.

---

### Bước 2: Clone dự án về máy tính cá nhân
Mở Terminal / PowerShell / Git Bash tại thư mục bạn muốn lưu code:
```bash
git clone https://github.com/Nhatduy160205/Project_SBA301.git
cd Project_SBA301
```

---

### Bước 3: Tạo nhánh riêng để làm việc
Trước khi viết bất kỳ dòng code nào, hãy tạo một nhánh riêng của bạn:
```bash
# 1. Chuyển về nhánh main và kéo code mới nhất
git checkout main
git pull origin main

# 2. Tạo nhánh mới và chuyển ngay sang nhánh đó
# Cú pháp: git checkout -b feature/<tên_bạn>-<tên_module>
git checkout -b feature/huy-payment-vnpay
```
*(Kiểm tra nhánh hiện tại bằng lệnh `git branch`, nếu thấy có dấu `*` ở nhánh của bạn là đúng).*

---

### Bước 4: Viết code và kiểm tra cục bộ (Local Testing)
* Thực hiện viết code, chức năng của bạn trong module được phân công (ví dụ: `src/server/payment-service`).
* Chạy thử và đảm bảo code biên dịch thành công, không có lỗi cú pháp, không làm ảnh hưởng các module khác.

---

### Bước 5: Commit và đẩy code lên nhánh của mình
Sau khi test xong:
```bash
# 1. Kiểm tra các file bạn đã thay đổi
git status

# 2. Thêm các file thay đổi vào Staging
git add .

# 3. Commit với thông điệp rõ ràng
git commit -m "feat: hoan thanh tich hop cong thanh toan vnpay"

# 4. Push nhánh của bạn lên GitHub
# Cú pháp: git push origin <tên_nhánh_của_bạn>
git push origin feature/huy-payment-vnpay
```

---

### Bước 6: Mở Pull Request (PR) gửi Trưởng nhóm
1. Truy cập vào GitHub: [https://github.com/Nhatduy160205/Project_SBA301](https://github.com/Nhatduy160205/Project_SBA301).
2. Bạn sẽ thấy một thanh thông báo màu vàng hiện lên kèm nút **Compare & pull request** ➔ Bấm vào nút đó.
3. Điền các thông tin:
   * **Title:** Ngắn gọn chức năng vừa làm (ví dụ: `[Payment] Tích hợp API tạo URL thanh toán VNPay`).
   * **Description:** Mô tả tóm tắt:
     * Đã làm những gì?
     * Có thêm cấu hình gì trong file `.yml` hay database không?
     * Cách test thử chức năng này.
4. Bấm nút xanh **Create pull request**.
5. Báo tin nhắn qua nhóm Zalo / Discord cho Trưởng nhóm vào review.

---

### Bước 7: Sau khi PR được duyệt và gộp vào `main`
Khi Trưởng nhóm đã bấm Merge PR của bạn vào `main`:
```bash
# Quay lại nhánh main trên máy bạn
git checkout main

# Kéo toàn bộ code mới nhất (bao gồm cả phần bạn vừa được merge và code các bạn khác)
git pull origin main

# Xóa nhánh feature cũ trên máy để tránh rối mắt
git branch -d feature/huy-payment-vnpay
```
*(Khi làm tính năng tiếp theo, lặp lại từ Bước 3).*

---

## III. HƯỚNG DẪN DÀNH CHO TRƯỞNG NHÓM (LEADER / CODE REVIEWER)

### 1. Xem danh sách các Pull Request đang chờ
1. Truy cập tab **Pull requests**:  
   👉 [https://github.com/Nhatduy160205/Project_SBA301/pulls](https://github.com/Nhatduy160205/Project_SBA301/pulls)
2. Bấm vào Pull Request cần duyệt.

### 2. Review code (Kiểm tra chất lượng code)
1. Bấm vào tab **Files changed** (ở cạnh tab *Conversation*).
2. Kiểm tra các mục:
   * Có file lạ hay file thừa nào bị commit nhầm không? (ví dụ: `target/`, file cấu hình nhạy cảm cá nhân).
   * Code có đúng cấu trúc kiến trúc Microservices của nhóm không?
3. **Nếu có lỗi hoặc cần thành viên sửa:**
   * Rê chuột vào dòng code cần sửa, bấm dấu **`+`** màu xanh.
   * Nhập nhận xét yêu cầu sửa (ví dụ: *"Chỗ này em thêm validation kiểm tra null nhé"*).
   * Bấm **Start a review** ➔ Khi xong hết bấm **Submit review** (chọn *Request changes*).
   * Thành viên sẽ sửa trực tiếp trên máy của họ và gõ `git push` lại nhánh đó là PR tự động cập nhật, bạn không cần làm gì thêm.

### 3. Gộp code (Merge Pull Request)
1. Khi code đã đạt chuẩn và GitHub hiển thị dòng chữ xanh:  
   `This branch has no conflicts with the base branch`
2. Bạn quay lại tab **Conversation**, cuộn xuống dưới:
3. Bấm **Merge pull request** ➔ Bấm tiếp **Confirm merge**.
4. Bấm nút **Delete branch** ngay sau đó để xóa nhánh tạm trên GitHub cho repo gọn gàng.

---

## IV. XỬ LÝ CÁC TÌNH HUỐNG THƯỜNG GẶP (TROUBLESHOOTING)

### 1. Nhánh của bạn bị báo Conflict với `main`
**Nguyên nhân:** Có một bạn khác vừa merge code vào `main` và sửa trùng vào file mà bạn cũng đang sửa.  
**Cách xử lý tại máy của thành viên:**
```bash
# 1. Đang đứng ở nhánh của bạn (ví dụ feature/huy-payment-vnpay)
git checkout feature/huy-payment-vnpay

# 2. Kéo code mới nhất của main vào nhánh của mình
git pull origin main

# 3. Mở VS Code / IntelliJ IDEA lên:
# Sẽ có thông báo vùng xung đột (Conflict): Bạn chọn "Accept Current", "Accept Incoming" hoặc chỉnh sửa lại cho đúng.

# 4. Sau khi giải quyết xong conflict:
git add .
git commit -m "fix: resolve merge conflicts with main"
git push origin feature/huy-payment-vnpay
```
*(Lập tức thông báo Conflict trên PR của GitHub sẽ biến mất và chuyển thành màu xanh cho phép Merge).*

---

### 2. Lỡ sửa code mà quên tạo branch mới (lỡ nằm trên `main`)
Nếu bạn lỡ viết code khi đang ở nhánh `main` nhưng chưa commit:
```bash
# Chuyển toàn bộ code đang sửa sang nhánh mới mà không bị mất
git checkout -b feature/<tên_bạn>-<tên_chức_năng>
git add .
git commit -m "feat: ..."
git push origin feature/<tên_bạn>-<tên_chức_năng>
```

---

## V. CẤU TRÚC PHÂN CHIA THƯ MỤC CẦN NẮM RÕ

```text
TableMaster-Project/
├── .gitignore                   # Bộ lọc loại trừ file build, file rác
├── docker-compose.yml           # Khởi động toàn bộ Database, Redis, RabbitMQ
├── infrastructure/              # Chứa scripts SQL khởi tạo các Database
├── doc/                         # Toàn bộ tài liệu phân tích, kiến trúc, quy trình
└── src/
    ├── client/tablemaster-ui/   # Source code Frontend (React/Vite/TypeScript)
    └── server/                  # Toàn bộ 6 Backend Microservices (Spring Boot)
        ├── discovery-service/   # Eureka Server (Port 8761)
        ├── gateway-service/     # API Gateway (Port 8080)
        ├── auth-service/        # Quản lý tài khoản, JWT (Port 8081)
        ├── restaurant-service/  # Quản lý bàn, sơ đồ nhà hàng (Port 8082)
        ├── booking-service/     # Đặt bàn, ca trực, cọc (Port 8083)
        ├── payment-service/     # Thanh toán QR, VNPay, Momo (Port 8084)
        └── analytics-service/   # Thống kê doanh thu, báo cáo (Port 8085)
```

> **Ghi chú:** Mỗi thành viên khi làm việc tại service nào chỉ nên tập trung chỉnh sửa trong thư mục service đó để tránh gây conflict cho các thành viên khác.
