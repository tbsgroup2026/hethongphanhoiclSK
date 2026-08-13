# 🚀 Quick Start - Flow Card

## 📊 Đã Tạo Xong!

Dưới đây là các file đã được tạo để bạn sử dụng:

### 📁 Files

```
✅ public/flow-card-incident.svg      → SVG file chính (16KB)
✅ public/flow-card-viewer.html       → HTML viewer + PNG converter
✅ public/flow-card-incident.html     → HTML layout view
✅ public/project-flowchart.svg       → SVG overview (từ task trước)
✅ docs/FLOW-CARD-README.md           → Tài liệu chi tiết (3.5KB)
✅ docs/FLOWCHART.md                  → Tài liệu flowchart gốc
✅ scripts/svg-to-png.py              → Python converter
✅ scripts/convert-svg-to-png.mjs     → Node.js wrapper
```

---

## ⚡ Xem Flow Card Ngay

### **Cách 1: Mở trong Browser** (Nhanh nhất ⚡)

```bash
# Mở file này trong browser
public/flow-card-viewer.html

# Hoặc nếu đang chạy dev server (Next.js)
http://localhost:3000/flow-card-viewer.html
```

### **Cách 2: Xem SVG trực tiếp**

```bash
# SVG file
public/flow-card-incident.svg

# HTML layout
public/flow-card-incident.html
```

---

## 📸 Chuyển SVG → PNG

### **Cách 1: Browser (Dễ nhất)** ✅✅✅

1. Mở: `public/flow-card-viewer.html`
2. Click: **"📸 Save as PNG"**
3. File PNG tải xuống tự động ✅

### **Cách 2: Drag & Drop Online**

- Vào https://cloudconvert.com/svg-to-png
- Drag `public/flow-card-incident.svg` vào
- Download PNG ✅

### **Cách 3: Inkscape (Chất lượng cao)**

```bash
# Windows: Download từ https://inkscape.org/
# Sau khi cài, chạy:
inkscape "d:\Work\KG1\web-admin\public\flow-card-incident.svg" --export-type=png -d 300

# Output: flow-card-incident.png
```

### **Cách 4: Python Script**

```bash
pip install cairosvg
python "d:\Work\KG1\web-admin\scripts\svg-to-png.py"
```

---

## 📋 Nội Dung Flow Card

Flow card này gồm **10 bước chính**:

```
🚨 → 📢 → 🔍 → 📊 → 👨‍💼 → 🔧 → ✔️ → ⏰ → 📤 → 📊
 1    2    3    4     5     6    7    8    9    10
```

**Tóm tắt:**

1. 🚨 Phát hiện sự cố
2. 📢 Báo cáo sự cố
3. 🔍 Điều tra ban đầu (15p)
4. 📊 Tổng hợp & xác định (hoặc escalate)
5. 👨‍💼 Giao nhân viên xử lý
6. 🔧 Thực hiện xử lý
7. ✔️ LL kiểm tra chất lượng
8. ⏰ Theo dõi 3-48 giờ
9. 📤 Đóng thẻ & báo BGĐ
10. 📊 Hiển thị trên Dashboard

**Thời gian toàn bộ:** 15 phút - 48 giờ (tuỳ Severity)

---

## 🎨 Tùy Chỉnh Flow Card

Nếu muốn chỉnh sửa diagram:

### **Chỉnh SVG trong Text Editor**

```bash
# Mở file SVG bằng VS Code hoặc editor bất kỳ
public/flow-card-incident.svg

# Sửa đổi -> Save -> Reload trong browser
```

### **Dùng Figma hoặc Inkscape**

- Import `flow-card-incident.svg` vào Figma/Inkscape
- Chỉnh sửa
- Export lại thành SVG/PNG

---

## 📊 Xem Trên Web Admin

Nếu muốn hiển thị flow card trên web-admin dashboard:

```typescript
// src/components/FlowCard.tsx (ví dụ)
export default function FlowCard() {
  return (
    <div className="flow-card">
      <img src="/flow-card-incident.png" alt="Incident Flow" />
      {/* hoặc */}
      <iframe src="/flow-card-viewer.html" />
    </div>
  );
}
```

---

## ✅ Checklist

- [ ] Mở `public/flow-card-viewer.html` trong browser
- [ ] Xem toàn bộ flow card
- [ ] Click "Save as PNG" để tải PNG
- [ ] Chia sẻ PNG/SVG với team
- [ ] Thêm vào wiki/documentation
- [ ] Integrate vào dashboard (nếu cần)

---

## 🤔 FAQ

**Q: PNG chất lượng như thế nào?**
A: Sử dụng browser "Save as PNG" sẽ render SVG với độ phân giải cao (2x). Nếu cần cao hơn, dùng Inkscape hoặc ImageMagick.

**Q: Có thể chỉnh sửa flow card không?**
A: Có! Chỉ cần mở file SVG trong text editor hoặc Inkscape, chỉnh sửa, và save.

**Q: Dùng cho cái gì?**
A: - Tài liệu wiki team

- Đào tạo nhân viên mới
- Hướng dẫn quy trình
- Integration vào dashboard/webapp

**Q: Có template khác không?**
A: Có file `project-flowchart.svg` (overview) và `flow-card-incident.html` (HTML layout).

---

## 📞 Support

Cần thay đổi flow card? Liên hệ:

- **Team:** @mention team-lead
- **Slack:** #workflow-support
- **Edit:** Chỉnh sửa SVG file trực tiếp

---

**✅ Mọi thứ đã sẵn sàng! Enjoy your flow card! 🎉**
