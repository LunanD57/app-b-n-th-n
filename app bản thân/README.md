# LunanD - Trạm Phát Triển Bản Thân & Quản Lý Chi Tiêu

> **Ứng dụng All-in-One chạy hoàn toàn trong 1 file `index.html` duy nhất**, phong cách Notion / Apple hiện đại, hỗ trợ Dark Mode và Mobile-first.

---

## 🌟 Các Tính Năng Chính

### 1. Màn hình Tổng quan (Dashboard)
- **Lời chào & Đồng hồ thời gian thực:** Chào buổi sáng / chiều / tối kèm đồng hồ cập nhật từng giây.
- **Lời trích dẫn truyền cảm hứng (Daily Motivation):** Tự động đổi câu nói triết lý (Marcus Aurelius, James Clear, Warren Buffett,...) tạo động lực thay đổi mỗi ngày.
- **Thống kê nhanh (KPIs):**
  - Tỷ lệ % hoàn thành thời khóa biểu tuần kèm thanh tiến độ.
  - Tổng số tiền đã chi tiêu trong tuần và trong tháng.
  - Số dư tài chính thực tế (Tổng thu - Tổng chi).
  - Chuỗi ngày kỷ luật (Day Streak counter).
- **Việc cần làm hôm nay:** Danh sách đầu việc của ngày hiện tại với checkbox tích hoàn thành ngay trên Dashboard.
- **Biểu đồ cơ cấu chi tiêu mini:** Trực quan hóa danh mục chi tiêu bằng Chart.js.

### 2. Thời khóa biểu 1 tuần (Thứ 2 đến Chủ Nhật)
- **Bố cục 7 ngày (Thứ 2 ➔ Chủ Nhật):** Lưới trực quan trên Desktop và thanh cuộn ngày tiện lợi trên Mobile.
- **Thêm việc chi tiết:**
  - Tên việc cần làm (VD: Chạy bộ 3km, Đọc 20 trang sách, Học tiếng Anh...).
  - Chọn ngày trong tuần (T2 - CN).
  - Khung giờ linh hoạt (VD: `06:00 - 07:00`).
  - Mức độ ưu tiên: 🔴 Cao (Gấp), 🟡 Trung bình, 🟢 Thấp.
  - Danh mục: Thể thao, Học tập, Công việc, Kỷ luật, Cá nhân.
- **Hành động:** Tích hoàn thành (gạch ngang chữ), sửa thông tin, xóa việc.
- **Nút "Làm mới tuần mới":** 1-Click bỏ tích toàn bộ các đầu việc định kỳ của 7 ngày để sẵn sàng bắt đầu tuần tiếp theo mà không cần phải nhập lại từ đầu!

### 3. Quản lý chi tiêu & Tài chính cá nhân
- **Form nhập giao dịch tiện lợi:**
  - Loại giao dịch: Khoản Chi (Expense) / Khoản Thu (Income).
  - Số tiền (VNĐ) kèm các nút bấm nhanh: +25k, +50k, +100k, +200k, +500k.
  - Danh mục chuẩn: Ăn uống, Di chuyển, Học tập, Giải trí, Tiết kiệm, Khác (và Thu nhập: Lương, Freelance, Thưởng...).
  - Ghi chú và ngày tháng.
- **Hạn mức chi tiêu tuần (Weekly Budget) & Cảnh báo:**
  - Đặt hạn mức chi tối đa cho tuần.
  - Thanh cảnh báo đổi màu thông minh:
    - 🟢 **Xanh lá:** An toàn (< 70% ngân sách).
    - 🟡 **Vàng:** Cảnh báo gần ngưỡng (>= 80%).
    - 🔴 **Đỏ:** Báo động chi tiêu vượt hạn mức và hiển thị số tiền vượt.
- **Biểu đồ tròn (Doughnut Chart):** Phân tích chi tiết tỷ lệ chi tiêu theo từng danh mục.
- **Lịch sử giao dịch:** Bộ lọc theo danh mục, tìm kiếm và nút xóa từng giao dịch.

### 4. Dữ liệu & Kỹ thuật
- **Lưu trữ Offline LocalStorage:** Dữ liệu lưu trực tiếp trên máy của bạn, tắt máy mở lại không bao giờ mất.
- **Xuất / Nhập JSON (Backup & Restore):** Sao lưu file `.json` để lưu trữ đám mây hoặc chuyển máy tính.
- **Chế độ Sáng / Tối (Dark / Light Mode):** Tối ưu bảo vệ mắt khi dùng ban đêm.

---

## 🚀 Cách Mở Ứng Dụng

1. **Cách 1 (Nhanh nhất - Cửa sổ App riêng biệt):**
   - Click đúp vào file `Khoi-Dong-App.bat`.
   - Ứng dụng sẽ mở ở chế độ App độc lập của Microsoft Edge (không thanh URL, như một phần mềm Windows xịn).

2. **Cách 2 (Mở bằng bất kỳ trình duyệt nào):**
   - Click đúp vào file `index.html` để mở trong Chrome, Edge, Cốc Cốc, Firefox hoặc Safari.

3. **Cách 3 (Tạo biểu tượng ngoài màn hình Desktop):**
   - Click đúp vào file `Tao-Phim-Tat-Desktop.bat` để tự động đưa icon ứng dụng ra màn hình Desktop.


## Cài LunanD trên iPhone và đồng bộ với web

LunanD hiện được chuẩn bị dưới dạng PWA. Để cài trên iPhone, toàn bộ thư mục cần được xuất bản ở một địa chỉ HTTPS trước.

### Cấu hình đồng bộ riêng tư

1. Tạo dự án Supabase và chạy toàn bộ nội dung `supabase-setup.sql` trong SQL Editor của dự án.
2. Trong `supabase-config.js`, điền Project URL vào `url` và khóa `anon`/publishable vào `anonKey`. Không dùng `service_role` key trong trang web.
3. Xuất bản thư mục này lên dịch vụ web tĩnh có HTTPS. Trong Supabase Auth, thêm địa chỉ web đã xuất bản vào danh sách URL chuyển hướng cho xác nhận email.
4. Mở trang trên thiết bị đang có dữ liệu mới nhất, vào **Cài đặt & Sao lưu dữ liệu**, tạo tài khoản rồi đăng nhập. Dữ liệu hiện có trên thiết bị đó sẽ được đưa lên cloud khi tài khoản chưa có bản lưu.
5. Trên iPhone, mở địa chỉ HTTPS bằng Safari, chọn **Chia sẻ → Thêm vào Màn hình chính**, bật **Mở dưới dạng ứng dụng web**, rồi chọn **Thêm**. Mở LunanD và đăng nhập bằng cùng tài khoản.

Khi có mạng, thay đổi được tự lưu lên Supabase và cập nhật trên thiết bị còn lại. Dữ liệu vẫn được lưu cục bộ để app tiếp tục mở. Nếu tài khoản đã có dữ liệu cloud, lần đăng nhập trên thiết bị mới sẽ tải dữ liệu cloud về thiết bị đó.