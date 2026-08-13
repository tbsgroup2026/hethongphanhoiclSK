# 📸 SVG to PNG Conversion Guide

## 🎯 Mục Tiêu

Chuyển `public/flow-card-incident.svg` thành file PNG để sử dụng trong tài liệu, wiki, hoặc dashboard.

---

## 🚀 5 Cách Chuyển Đổi (Từ Dễ → Khó)

### ✅ **Cách 1: Browser Viewer** (RECOMMENDED - Dễ nhất!)

**📍 Bước 1:** Mở file trong browser

```
Đường dẫn: public/flow-card-viewer.html
URL (nếu running dev): http://localhost:3000/flow-card-viewer.html
```

**📍 Bước 2:** Click nút **"📸 Save as PNG"**

**📍 Bước 3:** File PNG sẽ tự động tải xuống ✅

**Ưu điểm:**

- Không cần cài thêm gì
- Nhanh gọn
- Chất lượng cao

**Nhược điểm:**

- Cần browser

---

### ✅ **Cách 2: Online Tools** (Nhanh, không cần cài)

#### **Option A: CloudConvert**

1. Vào https://cloudconvert.com/svg-to-png
2. Drag & drop: `public/flow-card-incident.svg`
3. Download PNG ✅

#### **Option B: Convertio**

1. Vào https://convertio.co/svg-png/
2. Upload: `public/flow-card-incident.svg`
3. Download PNG ✅

#### **Option C: Zamzar**

1. Vào https://www.zamzar.com/
2. Upload SVG
3. Select PNG format
4. Download ✅

**Ưu điểm:**

- Không cần cài đặt
- Hoạt động trên mọi OS
- Có thể convert many files

**Nhược điểm:**

- Cần internet
- Có giới hạn dung lượng miễn phí

---

### ✅ **Cách 3: Inkscape** (Chất lượng tốt nhất)

#### **Step 1: Cài đặt Inkscape**

- Download: https://inkscape.org/release/
- Windows: Chọn `.msi` installer
- Cài đặt bình thường

#### **Step 2: Chuyển đổi**

**Dùng GUI:**

1. Mở Inkscape
2. File → Open → `public/flow-card-incident.svg`
3. File → Export As
4. Chọn "PNG Image" format
5. Chỉnh Resolution: 300 DPI (hoặc cao hơn)
6. Click "Export" ✅

**Dùng Command Line (nhanh hơn):**

```bash
# Windows (PowerShell)
inkscape "d:\Work\KG1\web-admin\public\flow-card-incident.svg" `
  --export-type=png `
  --export-dpi=300 `
  --export-filename="d:\Work\KG1\web-admin\public\flow-card-incident.png"

# Or using export-width/height
inkscape "d:\Work\KG1\web-admin\public\flow-card-incident.svg" `
  --export-type=png `
  --export-width=3200 `
  --export-height=4800 `
  --export-filename="d:\Work\KG1\web-admin\public\flow-card-incident.png"
```

**Ưu điểm:**

- Chất lượng xuất sắc
- Tùy chỉnh DPI/resolution
- Có thể batch convert

**Nhược điểm:**

- Cần cài đặt (~200MB)
- Lần đầu chạy hơi chậm

---

### ✅ **Cách 4: ImageMagick** (Nhanh, mạnh mẽ)

#### **Step 1: Cài đặt**

- Download: https://imagemagick.org/script/download.php
- Chọn Windows installer
- Cài đặt (chọn "Convert support files" để convert SVG)

#### **Step 2: Chuyển đổi**

```bash
# Basic conversion
magick convert `
  -density 300 `
  "d:\Work\KG1\web-admin\public\flow-card-incident.svg" `
  "d:\Work\KG1\web-admin\public\flow-card-incident.png"

# High quality
magick convert `
  -density 400 `
  -quality 95 `
  "d:\Work\KG1\web-admin\public\flow-card-incident.svg" `
  "d:\Work\KG1\web-admin\public\flow-card-incident.png"

# With background color
magick convert `
  -density 300 `
  -background white `
  -alpha remove `
  "d:\Work\KG1\web-admin\public\flow-card-incident.svg" `
  "d:\Work\KG1\web-admin\public\flow-card-incident.png"
```

**Ưu điểm:**

- Rất nhanh
- Mạnh mẽ, nhiều tùy chỉnh
- Tốt cho batch conversion

**Nhược điểm:**

- Cần cài ImageMagick

---

### ✅ **Cách 5: Python Script** (Lập trình viên)

#### **Step 1: Cài đặt cairosvg**

```bash
pip install cairosvg
```

#### **Step 2: Chạy script**

```bash
# Chạy script có sẵn
python "d:\Work\KG1\web-admin\scripts\svg-to-png.py"

# Hoặc chạy trực tiếp
python -c "
import cairosvg
cairosvg.svg2png(
    url='d:/Work/KG1/web-admin/public/flow-card-incident.svg',
    write_to='d:/Work/KG1/web-admin/public/flow-card-incident.png',
    scale=2
)
print('✅ PNG generated!')
"
```

**Ưu điểm:**

- Tự động hóa được
- Có thể dùng trong CI/CD
- Python only, no external tools

**Nhược điểm:**

- Cần Python
- Cần cài cairosvg

---

## 🎯 Quick Recommendation

| Use Case                    | Recommendation                  |
| --------------------------- | ------------------------------- |
| **Lần đầu, nhanh gọn**      | Cách 2 (Online CloudConvert) ✅ |
| **Lần đầu, không internet** | Cách 1 (Browser Viewer) ✅      |
| **Chất lượng cao nhất**     | Cách 3 (Inkscape) ⭐⭐          |
| **Batch/Automation**        | Cách 4 (ImageMagick) ⭐⭐       |
| **Developer workflow**      | Cách 5 (Python) ⭐              |

---

## 📊 Comparison

| Cách           | Setup    | Speed   | Quality | Automation |
| -------------- | -------- | ------- | ------- | ---------- |
| 1. Browser     | ✅ No    | ⚡ Fast | 🎨 Good | ❌ Manual  |
| 2. Online      | ✅ No    | ⚡ Fast | 🎨 Good | ❌ Manual  |
| 3. Inkscape    | ⚠️ 200MB | 🐢 Slow | ⭐⭐⭐  | ✅ Yes     |
| 4. ImageMagick | ⚠️ 50MB  | ⚡ Fast | ⭐⭐    | ✅ Yes     |
| 5. Python      | ✅ Small | ⚡ Fast | ⭐⭐    | ✅ Yes     |

---

## 🔍 Quality Settings

### **Cách 3 - Inkscape:**

```bash
# Standard (72 DPI) - Lỏng
--export-dpi=72

# Good (150 DPI) - Bình thường
--export-dpi=150

# High (300 DPI) - Cao
--export-dpi=300

# Very High (600 DPI) - Siêu cao
--export-dpi=600
```

### **Cách 4 - ImageMagick:**

```bash
# Standard
-density 150

# High
-density 300

# Very High
-density 600
```

### **Cách 5 - Python cairosvg:**

```python
# Standard
scale=1

# High (2x)
scale=2

# Very High (3x)
scale=3
```

---

## 🆘 Troubleshooting

### **Problem: PNG không render đúng (bị cắt)**

**Solution:** Tăng `-export-width` và `-export-height` hoặc `-density`

### **Problem: File quá lớn (>50MB)**

**Solution:** Giảm DPI hoặc dùng `-quality 85`

### **Problem: Chữ bị mờ hoặc lồi lõm**

**Solution:** Tăng DPI lên 300+, hoặc chỉnh font trong SVG

### **Problem: Colorspace error**

**Solution:** Thêm `-background white -alpha remove` (ImageMagick)

### **Problem: ImageMagick không recognize SVG**

**Solution:** Cài lại ImageMagick, chắc chắn chọn "Install delegate support files"

---

## 📋 Checklist

- [ ] Chọn phương pháp convert phù hợp
- [ ] Cài đặt tool (nếu cần)
- [ ] Test convert 1 lần
- [ ] Kiểm tra chất lượng PNG
- [ ] Lưu PNG vào `public/` hoặc folder khác
- [ ] Upload lên wiki/dashboard
- [ ] Chia sẻ với team

---

## 🎉 Success!

Sau khi có file PNG, bạn có thể:

- ✅ Thêm vào Wiki/Notion/Confluence
- ✅ Nhúng trong markdown docs
- ✅ Upload lên dashboard
- ✅ Chia sẻ với team qua email/Slack
- ✅ In ra làm hướng dẫn

---

## 📞 Support

Gặp vấn đề? Liên hệ:

- Slack: #dev-support
- GitHub Issues: (nếu có)
- Email: team@example.com

---

**✅ Good luck with your PNG conversion! 🚀**
