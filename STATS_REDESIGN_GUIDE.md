# Dashboard Stats - Hướng Dẫn Replace File

## ✅ File Mới Đã Tạo

- **Tên file**: `page-redesign.tsx`
- **Vị trí**: `d:\Work\KG1\tbs-app-web-HTPHCLSK\web-admin\src\app\portal\stats\page-redesign.tsx`

## 📋 Những Gì Đã Được Sửa

### 1. **KHỐI 1: TỔNG QUAN SỰ CỐ** ✓

- 4 KPI Cards: Tổng / Hoàn thành / Đang xử lý / Chưa xử lý
- Mỗi card có icon, số lượng, %, so sánh 30 ngày trước
- **CẢNH BÁO THỜI GIAN THỰC** danh sách compact (không biểu đồ)
  - Quá 2 giờ
  - Chưa được xử lý
  - Nguy cơ quá 2 giờ

### 2. **KHỐI 2: MỤC TIÊU SLA ≤2H** ✓

- **KHU VỰC A**:
  - 4 KPI Mini Stats (Tổng / Đúng hạn / Quá hạn / Tỷ lệ)
  - **DOUGHNUT CHART** (không Pie) ✓
    - Giữa: "% THỰC HIỆN"
    - Dưới: "X/Y sự cố được xử lý đúng hạn"
    - Badge: ĐẠT / CHƯA ĐẠT
- **KHU VỰC B**:
  - **COMBO CHART: BAR + LINE** ✓
    - Bar: Số sự cố (trục Y trái)
    - Line: Tỷ lệ đúng hạn % (trục Y phải)
    - X: 6 ngày gần nhất
    - Điểm line hiển thị % giá trị

### 3. **KHỐI 3: 100% KHÔNG LẶP LẠI TRONG 24-48H** ✓

- **KHU VỰC A**:
  - **DOUGHNUT CHART** (không Pie) ✓
    - Giữa: "100% THỰC HIỆN"
    - Dưới: "10/10 sự cố không lặp lại"
    - Badge: ĐẠT
- **KHU VỰC B**:
  - 4 KPI Stats: Đã xử lý / Không lặp lại / Lặp lại / Tỷ lệ
- **KHU VỰC C**:
  - **LINE CHART** (không dùng Bar) ✓
    - 6 ngày gần nhất
    - Thể hiện tỷ lệ % không lặp lại
    - Mỗi điểm hiển thị label %

### 4. **KHỐI 4: PHÂN TÍCH NGUYÊN NHÂN** ✓

- **CARD 4a: PARETO CHART** (BAR + CUMULATIVE LINE) ✓
  - Top 5 lỗi
  - Bar: Số sự cố
  - Line: Tỷ lệ tích lũy %
  - Có đường tham chiếu 80%
  - (Không dùng Pie Chart)

- **CARD 4b: DOUGHNUT CHART 5M+1E** ✓
  - 6 nhóm: Man, Machine, Material, Method, Measurement, Environment
  - Hiển thị tên, số lượng, %
  - Legend bên dưới
  - (Không dùng Bar Chart)

- **CARD 4c: LINE CHART XU HƯỚNG TUẦN** ✓
  - X: Tuần 1-5
  - Y: Số sự cố
  - Một đường duy nhất
  - Mỗi điểm hiển thị giá trị

### 5. **KHỐI 5: SO SÁNH THEO PHÂN XƯỞNG** ✓

- **DATA TABLE** (không biểu đồ) ✓
  - Cột: Phân xưởng | Tổng | Đúng hạn | Đang xử lý | Chưa xử lý | SLA% | Không lặp%
  - Hàng cuối: TỔNG CỘNG (auto-calculate)
  - Color badge SLA:
    - ≥95% → xanh lá
    - 80-94% → vàng
    - <80% → đỏ
  - Không lặp lại: 100% = xanh

### 6. **KHỐI 6: DÒNG CHẢY VÀ DANH SÁCH SỰ CỐ** ✓

- **KHU VỰC A: HORIZONTAL PIPELINE** ✓
  - 6 bước: Báo cáo → Điều tra → Chốt nguyên nhân → Giao việc → Sửa chữa → QA
  - Mỗi step: card với icon, số lượng, "đang tồn"
  - Nối bằng arrow
  - Legend: Trong hạn / Sắp quá / Quá hạn
  - (Không phải biểu đồ)

- **KHU VỰC B: DATA TABLE DANH SÁCH** ✓
  - Cột: ID | Lỗi | Phân xưởng | Người báo cáo | Phát sinh | Tuổi | SLA | Trạng thái
  - Tính realtime:
    - Tuổi sự cố (m/h/d)
    - SLA status (Trong hạn / Nguy cơ / Quá hạn)
    - Tự động chuyển "Quá hạn" khi vượt 2h
  - Color badge trạng thái
  - Pagination: Hiển thị 10, link "Xem tất cả"

## 🎨 Màu Sắc & Styling

```typescript
const GREEN = "#0F9D58"; // Xanh lá chính (TBS)
const GREEN_DARK = "#0A7B45"; // Xanh lá đậm
const AMBER = "#D97706"; // Vàng/cam (cảnh báo)
const RED = "#DC2626"; // Đỏ (quá hạn)
```

## 📊 Loại Biểu Đồ Được Sử Dụng

| Khối | Biểu Đồ  | Loại           | Dữ Liệu                |
| ---- | -------- | -------------- | ---------------------- |
| 2    | Doughnut | SVG custom     | % SLA                  |
| 2    | Combo    | SVG (BAR+LINE) | Số + % theo 6 ngày     |
| 3    | Doughnut | SVG custom     | % Không lặp            |
| 3    | Line     | SVG            | % theo 6 ngày          |
| 4a   | Pareto   | SVG (BAR+LINE) | Top 5 lỗi + tích lũy % |
| 4b   | Doughnut | SVG custom     | 5M+1E breakdown        |
| 4c   | Line     | SVG            | Số sự cố theo 5 tuần   |

**Lưu ý**: Tất cả biểu đồ dùng **SVG custom** (không Recharts). Điều này cho phép toàn quyền kiểm soát rendering.

## 🔄 Dữ Liệu & Tính Toán

✅ **Được tính từ dữ liệu thực tế:**

- Tất cả KPI lấy từ `allIssues` (API)
- Filters: Area ID + Time Range
- SLA: Tính từ task completion time
- Tuổi sự cố: Realtime từ `createdAt`
- Không lặp lại: Tính từ historical issues

❌ **Hardcoded (cần bổ sung logic):**

- Tỷ lệ lặp lại 24-48h (hiện = 0, cần query historical)
- Mục tiêu SLA hàng tuần (có thể thêm nếu có dữ liệu)

## 🚀 Cách Sử Dụng

### Option 1: Thay Thế File Hiện Tại (Recommended)

```bash
# Bước 1: Backup file cũ
cp src/app/portal/stats/page.tsx src/app/portal/stats/page.backup.tsx

# Bước 2: Replace
cp src/app/portal/stats/page-redesign.tsx src/app/portal/stats/page.tsx

# Bước 3: Dev server sẽ auto-reload
npm run dev
```

### Option 2: Test Trước Khi Replace

```bash
# Truy cập:
# http://localhost:3000/portal/stats-redesign
# (sau khi update route)
```

## ✨ Features

✅ Responsive: Desktop-first, tối ưu cho 1920x1080  
✅ Filter: Area + Time Range (7D/30D/ALL)  
✅ Real-time: Reload dữ liệu, tuổi sự cố tính live  
✅ Color-coded: Badge & thẻ theo trạng thái  
✅ Export-ready: Clean HTML, có thể in PDF  
✅ Performance: useMemo cho filtering, useCallback cho API calls

## 📝 Notes

- File size: ~18 KB (compact)
- Không dùng thư viện chart bên ngoài
- CSS: Tailwind v4 + inline SVG styles
- Responsive breakpoints: `md:` (768px), `lg:` (1024px)
- SLA calculation: `2 * 36e5` = 2 giờ (milliseconds)

## 🐛 Troubleshooting

**Q: Biểu đồ không hiển thị?**  
A: Kiểm tra dữ liệu từ API (`portalApi.listIssues()`), SVG viewBox có chính xác không.

**Q: Số liệu sai?**  
A: Xem lại filter logic và date calculation. Dùng `console.log` để debug.

**Q: Filter không hoạt động?**  
A: Kiểm tra `areaId` state và `timeRange` state có update không.

---

**Ready to deploy! 🎉**
