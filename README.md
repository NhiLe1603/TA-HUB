# ATINO TA Hub — Pha 1

App tĩnh (HTML/CSS/JS thuần, không cần build) cho team TA ATINO: **Trang chủ (phễu + việc của tôi)** và **Quản lý ứng viên**. Dữ liệu lưu chung trên Google Sheet qua Apps Script.

```
atino-ta-hub/
├── index.html      ← trang chính
├── css/style.css   ← giao diện (kiểu Lark, có dark mode)
├── js/api.js       ← lớp dữ liệu: API_URL, đọc/ghi Sheet, cache, hàng chờ lưu
├── js/config.js    ← 👉 MỞ/KHOÁ TÍNH NĂNG (open: true/false), 8 module, luồng bước tiếp theo
├── js/kpi.js       ← Module 8: KPI từng TA theo tháng (tab "Kpi" trên Sheet)
├── docs/           ← (tạo khi cần) slide / PDF bài giảng, khai báo trong js/learn-content.js
├── js/content.js   ← nội dung chuyên môn: mẫu chân dung, pháp lý, câu hỏi, prompt AI (sửa chữ ở đây)
├── js/app.js       ← khung app, Trang chủ, Ứng viên
├── js/tools.js     ← Pha 2: Vị trí (chân dung + phiếu điểm), Lọc CV, Sơ vấn
├── js/tools3.js    ← Pha 3: Viết JD & tin đăng (AIDA), Tạo nguồn, So sánh ứng viên
├── js/learn-content.js ← nội dung mục Học: 6 bài + 18 câu đố (sửa chữ ở đây)
├── js/learn.js     ← Pha 4: màn Học, hướng dẫn luồng ở Trang chủ, chặn pháp lý chung
├── js/activity.js  ← Nhật ký hoạt động (ai làm gì, lúc nào) — lưu ở tab "Logs" trên Sheet
├── Code.gs         ← backend Apps Script (dán vào Google Sheet)
└── .nojekyll       ← để GitHub Pages phục vụ file nguyên trạng
```

## Bước 1 — Backend Google Sheet (5 bước)
1. Tạo Google Sheet mới, vd **"ATINO TA Hub - Data"**.
2. **Extensions → Apps Script** → xoá hết → dán toàn bộ `Code.gs` → **Save**.
3. (Tuỳ chọn) chọn hàm `setup` → **Run** để tạo sẵn 2 tab `Positions`, `Candidates`.
4. **Deploy → New deployment → Web app** · Execute as: **Me** · Who has access: **Anyone** → **Deploy** → copy URL (kết thúc bằng `/exec`).
5. Sửa code sau này: **Deploy → Manage deployments → ✏ Edit → Version: New version → Deploy** (URL giữ nguyên).

## Bước 2 — Dán URL vào app
Mở `js/api.js`, dán URL vào dòng:
```js
const API_URL = "https://script.google.com/macros/s/XXXX/exec";
```
> Chưa muốn sửa code? Mở app → nút ⚙ → dán URL → **Lưu & kiểm tra** (chỉ lưu trên máy đó).
> Để trống = **chế độ thử**: dữ liệu chỉ lưu trên máy đang dùng.

## Bước 3 — Đưa lên GitHub Pages
1. Tạo repo GitHub (vd `atino-ta-hub`), upload toàn bộ thư mục này (kể cả `.nojekyll`).
2. **Settings → Pages** → Source: **Deploy from a branch** → Branch `main` / `(root)` → Save.
3. Sau ~1 phút, app chạy tại `https://<tên-github>.github.io/atino-ta-hub/`. Gửi link cho 4 bạn TA.

## Cách app lưu dữ liệu
- **Đọc**: GET `?action=all` khi mở app, khi quay lại tab (sau 30 giây) và sau mỗi lần lưu.
- **Ghi**: POST `text/plain` → không bị chặn CORS. Id do app tự sinh (`C…`, `P…`) nên gửi lại nhiều lần cũng không tạo trùng.
- Thay đổi hiện **ngay trên màn hình**, được giữ trong "hàng chờ" ở máy cho tới khi Sheet nhận. Mất mạng → góc trên hiện **"⚠ Chưa lưu · Thử lại"**, dữ liệu không mất. Nút ⚙ → **Tải JSON dự phòng** để xuất toàn bộ.
- **Lịch sử trạng thái** được lưu trong cột `chiTiet` (JSON, khoá `lichSu`) — mỗi lần đổi trạng thái app gửi `saveCandidate` kèm trạng thái mới + lịch sử trong 1 lần ghi.

## Kiểm tra nghiệm thu Pha 1
- [ ] Lần đầu mở: hỏi tên TA → tên hiện ở góc phải, bấm vào để đổi.
- [ ] ⚙ → dán URL → "Kết nối thành công".
- [ ] Ứng viên → **＋ Thêm ứng viên** → mở Google Sheet thấy dòng mới ở tab `Candidates`.
- [ ] Mở hồ sơ → **Chuyển sang bước tiếp** → cột `trangThai` trên Sheet đổi theo.
- [ ] Lọc theo vị trí / trạng thái / TA và tìm theo tên/mã hoạt động.
- [ ] Mở trên điện thoại: thanh điều hướng ở dưới, bấm-chọn dễ.
