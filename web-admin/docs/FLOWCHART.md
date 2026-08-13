# Quy Trình Xử Lý Đơn Hàng / Yêu Cầu

## Tổng Quan

Tài liệu này mô tả chi tiết quy trình xử lý báo cáo sự cố và yêu cầu trong hệ thống, từ khi nhận báo cáo cho đến khi hoàn thành xử lý.

**Biểu đồ luồng:** Xem file `public/project-flowchart.svg`

---

## Các Bước Chi Tiết

### **Bước 1: Báo Cáo Sự Cố** (15 phút)

- **Người thực hiện:** Người phát hiện sự cố
- **Thời gian:** 15 phút
- **Hành động:**
  - Báo cáo cho QA (Quality Assurance)
  - Báo cáo cho LL (Legal Lead hoặc Lead)
  - Báo cáo cho CH (Chief)
  - FYI (For Your Information) cho SX (Production)
- **Output:** Báo cáo sự cố chi tiết

---

### **Bước 2: Điều Tra Ban Đầu** (15 phút)

- **Người thực hiện:** QA + LL + CH
- **Thời gian:** 15 phút
- **Phương pháp:**
  - QA, LL, CH điều tra **độc lập** (5 Whys)
  - Mỗi người tương tác từng câu hỏi riêng
- **Kết quả:** Tập hợp thông tin từ 3 nguồn

---

### **Bước 3: Xác Định Loại Sự Cố** (Dựa trên kết quả Bước 2)

Sau khi hoàn thành Bước 2, có 2 trường hợp:

#### **Trường Hợp A: Đủ 2/3 Form**

Nếu được ít nhất 2/3 thông tin từ 3 người:

**Bước 3: Tổng Hợp Nguyên Nhân & Giải Pháp** (Thực hiện bởi LL)

- Tổng hợp toàn bộ thông tin
- Phân tích nguyên nhân gốc rễ
- Đề xuất các giải pháp khả thi

Tiếp theo có 2 hướng:

**3a. Không Thể Xử Lý Tự (Escalate)**
→ **Phase 2: Báo Ban Giám Đốc**

- Báo cáo cho GD (Giám Đốc)
- TGĐNNN (Trưởng Giao Dịch Ngoại Nội Nước)
- Hình nộng (hình thức nộng)
- Chi chủ + Xử lý

**3b. Có Giải Pháp**
→ **Bước 4: TP Chọn Phương Bàn** (Tiếp tục quy trình bên dưới)

#### **Trường Hợp B: Thiếu Form**

Nếu không có đủ 2/3 thông tin hoặc quá 15 phút:

→ **Bước 4: TP Chọn Phương Bàn** (Theo dõi song song)

---

### **Bước 4: TP Chọn Phương Bàn & Giao Nhân Viên**

- **Người thực hiện:** TP (Team Lead hoặc Trưởng Phòng)
- **Hành động:**
  - Chọn phương bàn xử lý thích hợp
  - Giao nhân viên trong cùng khu vực trách nhiệm
- **Output:** Danh sách nhân viên được giao

---

### **Bước 5: Nhân Viên Phòng Ban Nhận Việc**

- **Người thực hiện:** Nhân viên phòng ban
- **Thời gian:** Trong 15 phút kể từ khi được giao
- **Hành động:**
  - Nhận việc
  - Đề xuất xử lý (1 người/1 việc)
  - Xác nhận kế hoạch thực hiện
- **Output:** Kế hoạch xử lý chi tiết

---

### **Bước 6: Hoàn Thành Sửa Chữa**

- **Người thực hiện:** Nhân viên được giao
- **Hành động:**
  - Thực hiện sửa chữa/xử lý
  - Lập chiDÁNO tại (chỉ định địa điểm cần sửa)
  - Tính khoản (Chi phí)
  - Sinh trước/sau (Tạo trước hoặc sau, tuỳ loại sử cấp)
- **Output:** Công việc hoàn thành

---

### **Bước 7a: LL Xác Nhận & Kiểm Tra Lại**

- **Người thực hiện:** LL (Lead/Lãnh Đạo)
- **Hành động:**
  - Xác nhận công việc hoàn thành
  - Kiểm tra chất lượng
- **Kết quả:**
  - ✅ **Xong:** Tiếp tục Bước 7b
  - ❌ **Chưa xong:** Quay lại Bước 6 để sửa chữa thêm

---

### **Bước 7b: Theo Dõi Chất Lượng (3 - 48 giờ)**

- **Người thực hiện:** Nhân viên theo dõi
- **Thời gian:** Từ 3 giờ đến 48 giờ (tuỳ theo độ ưu tiên)
- **Hành động:** Theo dõi hiệu quả xử lý
- **Kết quả:**

#### **Sau 3 - 48 giờ: Xác Đông (Xác Nhận Đầy Đủ)**

- Nếu xử lý thành công → **Đã Hoàn Thành → Báo Ban Giám Đốc**
- Tạo báo cáo hoàn thành
- Gửi Ban Giám Đốc

#### **Quá 48 Giờ Không Bắm Gì (Không Có Cải Thiện)**

- → **Tự Động Dạng Phiếu → Báo Ban Giám Đốc**
- Hệ thống tự động tạo phiếu báo cáo
- Gửi Ban Giám Đốc để xem xét tiếp theo

---

## Các Điểm Quan Trọng

| Khoảng Thời Gian     | Thao Tác                                          |
| -------------------- | ------------------------------------------------- |
| **0 - 15 phút**      | Bước 1 + Bước 2 (Báo cáo & điều tra ban đầu)      |
| **15 - 30 phút**     | Bước 3/4 (Tổng hợp hoặc giao phương bàn)          |
| **30 phút - 48 giờ** | Bước 5, 6, 7a (Xử lý & kiểm tra)                  |
| **Sau 48 giờ**       | Bước 7b (Theo dõi chất lượng & báo cáo cuối cùng) |

---

## Vòng Lặp (Loop)

- **Vòng lặp 1:** Nếu Bước 7a phát hiện chưa xong → Quay lại Bước 6
- **Vòng lặp 2:** Nếu Bước 2 thiếu thông tin → Có thể giao Bước 4 để xử lý song song

---

## Các Vai Trò Chính

| Vai Trò                  | Viết Tắt | Trách Nhiệm                             |
| ------------------------ | -------- | --------------------------------------- |
| Quality Assurance        | QA       | Đánh giá chất lượng, điều tra           |
| Lead / Lãnh Đạo          | LL       | Tổng hợp thông tin, xác nhận hoàn thành |
| Chief                    | CH       | Giám sát, phê duyệt                     |
| Team Lead / Trưởng Phòng | TP       | Phân công, giao việc                    |
| Giám Đốc                 | GD       | Quyết định cuối cùng                    |

---

## Cách Sử Dụng Tài Liệu Này

1. **Đào tạo:** Sử dụng để đào tạo nhân viên mới
2. **Tham Khảo:** Khi có thắc mắc về quy trình
3. **Cải Thiện:** Báo cáo nếu tìm thấy lỗi hoặc cần điều chỉnh
4. **Tự Động Hóa:** Dùng làm cơ sở để xây dựng hệ thống tự động theo dõi

---

## Lịch Sử Cập Nhật

| Ngày       | Người  | Thay Đổi             |
| ---------- | ------ | -------------------- |
| 2026-08-10 | System | Tạo tài liệu ban đầu |

---

## Liên Hệ & Hỗ Trợ

Nếu có câu hỏi hoặc cần điều chỉnh quy trình, vui lòng liên hệ:

- **Email:** team@example.com
- **Slack:** #workflow-support
