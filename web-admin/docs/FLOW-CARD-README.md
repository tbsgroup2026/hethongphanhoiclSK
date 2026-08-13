# 🎯 Flow Card - Incident to Dashboard

## Tổng Quan

Flow Card này mô tả chi tiết **quy trình xử lý sự cố từ lúc phát hiện đến khi báo Ban Giám Đốc** và hiển thị trên Dashboard.

**Gồm 10 bước chính** với các điểm quyết định, vòng lặp, và escalation path.

---

## 📁 Files

```
├── public/
│   ├── flow-card-incident.svg          # SVG file chính (có thể chỉnh sửa)
│   ├── flow-card-incident.html         # HTML viewer (bộ cục tương tác)
│   ├── flow-card-viewer.html           # HTML converter SVG → PNG
│   └── flow-card-incident.png          # PNG output (sau khi convert)
│
├── scripts/
│   ├── svg-to-png.py                   # Python converter
│   ├── convert-svg-to-png.mjs          # Node.js wrapper
│   └── generate-flowcard-png.js        # Puppeteer converter (optional)
│
└── docs/
    └── FLOW-CARD-README.md             # File này
```

---

## 🎬 10 Bước Quy Trình

### **Bước 1️⃣ Phát Hiện Sự Cố** 🚨

- Nhân viên hoặc hệ thống phát hiện sự cố
- Sự cố được ghi nhận ngay lập tức
- **Status:** Mới | **Action:** Log sự cố

### **Bước 2️⃣ Báo Cáo Sự Cố** 📢

- Thông báo đến QA, LL, CH
- Gửi alert qua email, Slack, Dashboard
- Tạo Ticket với ID duy nhất
- SX được FYI

### **Bước 3️⃣ Điều Tra Ban Đầu (15 phút)** 🔍

- QA + LL + CH điều tra **độc lập**
- Áp dụng 5 Whys Method
- Mỗi người tương tác từng câu hỏi riêng
- **Kết quả:**
  - ✅ ≥2/3 thông tin → Bước 4a
  - ❌ Thiếu hoặc quá 15p → Bước 4b (Song song)

### **Bước 4a📊 Tổng Hợp & Xác Định**

- LL tổng hợp nguyên nhân gốc
- Đề xuất giải pháp khả thi
- **Quyết định:**
  - ✅ Có giải pháp → Bước 5
  - ❌ Không có → Bước 4c (Escalate)

### **Bước 4b⚡ TP Chọn Phương Bàn (Song Song)**

- Nếu quá 15p hoặc thiếu thông tin
- Không chờ hoàn thành Bước 3
- Chọn phương bàn xử lý → Tiếp tục Bước 5

### **Bước 4c🚀 Escalate Lên Ban Giám Đốc**

- Không có giải pháp nội bộ
- Báo cáo ngay cho GD, TGĐNNN
- **Card Status:** "Escalated to Management"
- Chờ quyết định → Bước 9

### **Bước 5👨‍💼 Giao Nhân Viên Xử Lý**

- TP giao việc cho nhân viên cụ thể
- **1 người / 1 việc**
- Nhân viên xác nhận nhận việc
- **Card Status:** "In Progress"

### **Bước 6🔧 Thực Hiện Xử Lý**

- Nhân viên sửa chữa/xử lý
- Lập Biên Bản Xác Nhận (chiDÁNO)
- Tính toán chi phí
- Upload: Ảnh trước/sau, Hóa đơn, Work logs
- Comment: "Xử lý xong"

### **Bước 7✔️ LL Xác Nhận & Kiểm Tra**

- LL kiểm tra chất lượng công việc
- Xác nhận toàn bộ hồ sơ đầy đủ
- **Quyết định:**
  - ✅ Chất lượng OK → Bước 8
  - ❌ Chưa OK → Quay lại Bước 6 (Sửa lại)

### **Bước 8⏰ Theo Dõi 3-48 Giờ**

- Xác nhận sự cố không tái diễn
- Giải pháp ổn định
- **Duration:** 3-48h (tuỳ Severity)
- **Card Status:** "Under Monitoring"
- Update Dashboard real-time

### **Bước 9📤 Đóng Thẻ & Báo Ban Giám Đốc**

- Xác nhận sự cố hoàn toàn được xử lý
- Tạo **Báo Cáo Hoàn Thành** với:
  - Nguyên nhân gốc
  - Giải pháp áp dụng
  - Chi phí total
  - Thời gian xử lý
  - Người thực hiện
- Gửi cho BGĐ, TGĐNNN, TP (CC)
- **Card Status:** "Closed"

### **Bước 10📊 Hiển Thị Trên Dashboard**

- Thẻ đóng hiển thị trên Dashboard
- BGĐ có thể xem chi tiết báo cáo
- **Metrics:**
  - Total incidents
  - Resolved / Pending
  - Avg resolution time
  - Recurrence rate
  - KPI tracking
- **Card Status:** "Archived"

---

## 📊 Timeline

| Giai Đoạn                 | Thời Gian     | Thao Tác       |
| ------------------------- | ------------- | -------------- |
| **Báo cáo & Điều tra**    | 0-15 phút     | Bước 1 + 2 + 3 |
| **Tổng hợp & Quyết định** | 15-30 phút    | Bước 4a/4b/4c  |
| **Xử lý & Kiểm tra**      | 30 phút - 48h | Bước 5, 6, 7   |
| **Giám sát**              | 3-48 giờ      | Bước 8         |
| **Báo cáo hoàn thành**    | 5-10 phút     | Bước 9         |
| **Hiển thị Dashboard**    | Real-time     | Bước 10        |

---

## 👥 Vai Trò Chính

| Vai Trò           | Viết Tắt | Trách Nhiệm                             |
| ----------------- | -------- | --------------------------------------- |
| Quality Assurance | QA       | Đánh giá, điều tra, xác nhận chất lượng |
| Lead / Leader     | LL       | Tổng hợp info, kiểm tra, xác nhận       |
| Chief             | CH       | Giám sát, phê duyệt escalation          |
| Team Lead / Phòng | TP       | Phân công, giao việc                    |
| Nhân Viên         | NV       | Thực hiện xử lý                         |
| Ban Giám Đốc      | BGĐ      | Quyết định cuối, phê duyệt escalation   |

---

## ⚙️ Card Status Progression

```
┌─────────────────────────────────────────────────────────────┐
│  NEW → IN PROGRESS → UNDER MONITORING → CLOSED → ARCHIVED  │
└─────────────────────────────────────────────────────────────┘

Mỗi thay đổi status cần:
✓ Timestamp tự động
✓ Người thực hiện (User ID)
✓ Comment / Note (tùy chọn)
✓ Attachment (nếu cần)
```

---

## 💾 Dữ Liệu Lưu Trữ

Mỗi card phải lưu:

- ✅ ID duy nhất (auto-generated)
- ✅ Severity / Priority
- ✅ Category (tên loại sự cố)
- ✅ Description (mô tả chi tiết)
- ✅ Photos (trước/sau xử lý)
- ✅ Work logs (ai làm gì, khi nào)
- ✅ Cost breakdown (chi phí từng item)
- ✅ Timesheet (giờ công)
- ✅ Report PDF (báo cáo hoàn thành)
- ✅ Status history (lịch sử thay đổi)

---

## ⚠️ Điểm Nguy Hiểm & Lưu Ý

### 🔴 **Critical Issues**

1. **Quá 15 phút không đủ thông tin từ Bước 3**
   - → Trigger Bước 4b (Song parallel)
   - → TP phải chọn phương bàn ngay
   - → Không chờ hoàn thành Bước 3

2. **Không có giải pháp nội bộ**
   - → Trigger Bước 4c (Escalate)
   - → Báo cáo ngay cho BGĐ
   - → Chờ quyết định, không xử lý tự phát

3. **LL kiểm tra Bước 7 phát hiện chất lượng chưa OK**
   - → Quay lại Bước 6
   - → Nhân viên phải sửa lại
   - → Tránh vòng lặp vô hạn: Max 2 lần sửa → Escalate

4. **Theo dõi Bước 8 phát hiện sự cố tái diễn**
   - → Quay lại Bước 6 (Xử lý lại)
   - → Cập nhật Báo Cáo Hoàn Thành
   - → Tăng KPI "Recurrence rate"

---

## 📈 KPI & Metrics

### Theo Dõi Hàng Ngày

| Metric                          | Target             | Red Flag  |
| ------------------------------- | ------------------ | --------- |
| **Response Time** (Bước 2)      | ≤ 15 phút          | > 20 phút |
| **Investigation Time** (Bước 3) | ≤ 15 phút          | > 20 phút |
| **Decision Time** (Bước 4)      | ≤ 10 phút          | > 15 phút |
| **Resolution Time** (Bước 5-7)  | ≤ 48 giờ (P1: ≤4h) | > 72 giờ  |
| **Escalation Rate**             | < 20%              | > 30%     |
| **Recurrence Rate**             | < 5%               | > 10%     |
| **First-time Fix Rate**         | > 85%              | < 75%     |

---

## 🔄 Vòng Lặp (Loops)

### **Loop 1: Quality Check Loop** (Bước 7)

```
Bước 6 → Bước 7 → Check OK?
              ↓
            NO → Quay lại Bước 6
             ↓
            YES → Tiếp tục Bước 8
```

### **Loop 2: Monitoring Loop** (Bước 8)

```
Bước 8: Theo dõi 3-48h
         ↓
    Tái diễn?
         ↓
        YES → Quay lại Bước 6
         ↓
        NO → Bước 9 (Đóng)
```

---

## 🎨 Cách Chuyển Đổi SVG → PNG

### **Cách 1: Sử Dụng Browser** ✅ (Dễ nhất)

1. Mở file `public/flow-card-viewer.html` trong browser
2. Click "📸 Save as PNG"
3. File PNG sẽ tự động tải xuống

### **Cách 2: Dùng Inkscape** (Chất lượng tốt)

```bash
# Cài đặt: https://inkscape.org/

# Convert with quality
inkscape public/flow-card-incident.svg \
  --export-type=png \
  --export-dpi=300 \
  --export-filename=public/flow-card-incident.png
```

### **Cách 3: Dùng ImageMagick**

```bash
# Cài đặt: https://imagemagick.org/

magick convert \
  -density 300 \
  public/flow-card-incident.svg \
  public/flow-card-incident.png
```

### **Cách 4: Dùng Python + cairosvg**

```bash
# Cài đặt
pip install cairosvg

# Chạy script
python scripts/svg-to-png.py
```

### **Cách 5: Dùng Online Tools** (Nhanh nhất)

- https://cloudconvert.com/svg-to-png
- https://convertio.co/svg-png/
- https://online-convert.com/

---

## 📋 Checklist Trước Deploy

- [ ] Tất cả 10 bước được test
- [ ] Status progression hoạt động đúng
- [ ] Timestamp tự động cập nhật
- [ ] Card ID duy nhất
- [ ] Notification gửi đúng người
- [ ] Dashboard cập nhật real-time
- [ ] KPI được track
- [ ] Báo cáo PDF generate đúng
- [ ] Escalation path hoạt động
- [ ] Loop lặp lại không vô hạn

---

## 📞 Liên Hệ & Hỗ Trợ

Nếu có câu hỏi hoặc cần cải thiện quy trình:

- **Email:** team@example.com
- **Slack:** #workflow-support
- **Documentation:** Xem file này

---

## 🔄 Lịch Sử Cập Nhật

| Ngày       | Người  | Thay Đổi              |
| ---------- | ------ | --------------------- |
| 2026-08-10 | System | Tạo Flow Card ban đầu |

---

**✅ Flow Card hoàn thành và sẵn sàng triển khai!**
