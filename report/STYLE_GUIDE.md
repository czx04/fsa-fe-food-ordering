# BỘ QUY TẮC ĐỊNH DẠNG VÀ VĂN PHONG BÁO CÁO (STYLE GUIDE)

---

## THÔNG TIN CHUNG VỀ TÀI LIỆU

- **Học phần:** Thực tập doanh nghiệp Nhật Bản
- **Đơn vị đào tạo:** Trường Đại học Công nghệ – Đại học Quốc gia Hà Nội (UET - VNU)
- **Ngành đào tạo:** Công nghệ thông tin định hướng thị trường Nhật Bản (Khóa QH-2022-I/CQ-I-IT-20)
- **Sinh viên thực hiện:** Nguyễn Công Khải (MSV: 22026562)
- **Giảng viên đánh giá:** ThS. Lê Duy Đức
- **Đơn vị thực tập tiếp nhận:** Công ty TNHH Phần mềm FPT (FPT Software) – Campuslink Front-End
- **Cán bộ hướng dẫn doanh nghiệp:** Vũ Tú Anh
- **Tên đề tài:** Xây dựng nền tảng đặt đồ ăn (Food Ordering Platform)
- **Phân hệ phụ trách chuyên sâu:** Phân hệ Giỏ hàng & Xử lý đơn hàng (_Cart & Order Processing Module_)
- **Mục đích của Style Guide:** Quy chuẩn hóa toàn diện cấu trúc nội dung, phong cách học thuật – kỹ thuật, quy tắc dẫn chiếu hình/bảng và thông số định dạng tài liệu khi cộng tác biên tập bằng các công cụ AI (GitHub Copilot, Gemini Docs, v.v.).

---

## 1. KHUNG CẤU TRÚC BÁO CÁO (DOCUMENT TAXONOMY)

Toàn bộ nội dung báo cáo phải bám sát tuyệt đối theo đề cương cấu trúc đã phê duyệt:

```text
MỤC LỤC
LỜI CẢM ƠN
CHƯƠNG 1: GIỚI THIỆU CHUNG
  1.1. Giới thiệu đơn vị thực tập (FPT Software - môi trường dự án định hướng Nhật Bản)
  1.2. Giới thiệu công việc và vai trò đảm nhiệm (Campuslink Front-End / Full-stack)
  1.3. Tổng quan bài toán nền tảng đặt đồ ăn
CHƯƠNG 2: PHÂN TÍCH YÊU CẦU BÀI TOÁN
  2.1. Miêu tả bài toán tổng thể của hệ thống
  2.2. Phân chia công việc nhóm và phạm vi của sinh viên
  2.3. Yêu cầu chi tiết đối với phân hệ phụ trách (Cart & Order Processing Module)
CHƯƠNG 3: CƠ SỞ KỸ THUẬT, THIẾT KẾ VÀ GIẢI PHÁP THỰC HIỆN
  3.1. Các công nghệ và giải pháp liên quan
  3.2. Kiến trúc giải pháp và thiết kế hệ thống
    3.2.1. Sơ đồ kiến trúc phân tầng
    3.2.2. Thiết kế Cơ sở dữ liệu
  3.3. Hiện thực hóa các tính năng cốt lõi
    3.3.1. Xử lý logic tạo đơn và tính toán giá trị đơn hàng
    3.3.2. Cơ chế đồng bộ trạng thái đơn hàng thời gian thực
  3.4. So sánh và đánh giá giải pháp
CHƯƠNG 4: HƯỚNG DẪN CÀI ĐẶT VÀ VẬN HÀNH HỆ THỐNG
  4.1. Môi trường phát triển và yêu cầu phần cứng/phần mềm
  4.2. Quy trình thiết lập và triển khai mã nguồn
  4.3. Kết quả giao diện và luồng chạy thực tế
CHƯƠNG 5: KẾT QUẢ ĐẠT ĐƯỢC VÀ HƯỚNG PHÁT TRIỂN
  5.1. Kết quả đạt được so với mục tiêu ban đầu
  5.2. Kỹ năng và kiến thức thu thập được (Kỹ thuật chuyên môn, quy trình Agile/Sprint, tác phong làm việc)
  5.3. Hạn chế và hướng phát triển tiếp theo
TÀI LIỆU THAM KHẢO
```

---

## 2. VĂN PHONG VÀ GIỌNG ĐIỆU (TONE & VOICE)

### 2.1. Đại từ nhân xưng và tính khách quan

- **Được phép sử dụng:**
  - Dùng đại từ: _"em"_.
  - Dùng danh xưng tập thể khi nhắc đến sản phẩm chung: _"nhóm em"_, _"nhóm"_.
  - Ưu tiên các cấu trúc câu khách quan, câu mô tả hệ thống hoặc thể bị động: _"Hệ thống được thiết kế theo..."_, _"Phân hệ giỏ hàng cung cấp API..."_, _"Dữ liệu được xác thực trước khi ghi nhận..."_.
- **Tuyệt đối cấm:**

### 2.2. Tiêu chuẩn văn phong kỹ thuật (Technical Tone)

- Diễn đạt chính xác, gãy gọn, lập luận dựa trên nguyên lý công nghệ và dữ liệu chứng minh.
- Không sử dụng khẩu ngữ, từ cảm thán, hoặc từ ngữ quảng bá chủ quan (ví dụ: _không dùng: "giao diện cực kỳ đẹp mắt", "code viết rất tối ưu", "tính năng siêu xịn"_).
- Giữ nguyên ngữ nghĩa chuẩn của các thuật ngữ chuyên ngành tiếng Anh:
  - _Kiến trúc & Cơ chế:_ Client-Side Rendering, Server-Side Rendering, State Synchronization, Real-time Communication, WebSocket, Polling, Event-driven Architecture, Decoupling, ACID transactions.
  - _Xử lý & Dữ liệu:_ Race Condition, Concurrency Control, Idempotency, Optimistic/Pessimistic Locking, In-memory Cache, Payload, Schema, RESTful API.
  - _Quy trình & Công cụ:_ Agile/Scrum, Sprint, Git Flow, Code Review, CI/CD, Type check.

### 2.3. Quy tắc định dạng code, API và cơ sở dữ liệu trong văn bản

- **Tên biến, hàm, tham số, endpoint, kiểu dữ liệu:** Đặt trong thẻ code inline `monospace` (ví dụ: `orderId`, `calculateTotalAmount()`, `POST /api/v1/orders/checkout`, `PENDING_PAYMENT`).
- **Tên bảng và cột CSDL:** Viết in hoa hoặc đúng chuẩn đặt tên thực tế: `orders`, `order_items`, `carts`, `cart_items`, `status`.

---

## 3. CẤU TRÚC TRÌNH BÀY TIỂU MỤC KỸ THUẬT (MÔ HÌNH 3 TẦNG)

Mọi mục phân tích giải pháp kỹ thuật tại Chương 3 và Chương 4 đều phải tuân thủ nghiêm ngặt 3 tầng nội dung tuần tự một cách ngầm định (không thêm tiêu đề phụ mà chỉ chia ra thành các đoạn văn bản tách nhau bởi cách dòng trống):

```text
┌─────────────────────────────────────────────────────────────┐
│ TẦNG 1: ĐẶT VẤN ĐỀ & BỐI CẢNH NGHIỆP VỤ (Problem Statement) │
├─────────────────────────────────────────────────────────────┤
│ TẦNG 2: GIẢI PHÁP THIẾT KẾ & HIỆN THỰC (Implementation)    │
├─────────────────────────────────────────────────────────────┤
│ TẦNG 3: ĐÁNH GIÁ, ĐO LƯỜNG & BIỆN LUẬN (Evaluation/Metrics) │
└─────────────────────────────────────────────────────────────┘
```

### Chi tiết từng tầng:

1. **Tầng 1 - Đặt vấn đề & Bối cảnh nghiệp vụ:**
   - Làm rõ bài toán nghiệp vụ cần giải quyết trong hệ thống đặt món.
   - Nêu các thách thức kỹ thuật thực tế (ví dụ: sai lệch giá khuyến mãi khi tạo đơn, xung đột cập nhật trạng thái đơn hàng giữa người dùng - quán ăn - tài xế giao hàng).
2. **Tầng 2 - Giải pháp thiết kế & Hiện thực:**
   - Trình bày chi tiết kiến trúc giải pháp, thuật toán, luồng dữ liệu (Data flow) hoặc quy trình logic.
   - Bắt buộc có công cụ minh họa trực quan: Lược đồ dữ liệu (ERD), biểu đồ tuần tự (Sequence Diagram), sơ đồ trạng thái (State Diagram) hoặc mã giả (pseudocode).
3. **Tầng 3 - Đánh giá, đo lường & Biện luận:**
   - Phân tích ưu/nhược điểm so với giải pháp thay thế.
   - Đánh giá hiệu năng, độ phức tạp thuật toán, khả năng mở rộng (scalability) và tính nhất quán dữ liệu.
   - Cung cấp số liệu kiểm thử thực tế nếu có (độ trễ phản hồi, thời gian hoàn tất đơn hàng, khả năng chịu tải đồng thời).

---

## 4. QUY TẮC MINH HỌA HÌNH ẢNH, BẢNG BIỂU VÀ SƠ ĐỒ

### 4.1. Câu dẫn trước minh họa (Lead-in Sentence)

- **Bắt buộc:** Trước khi xuất hiện bất kỳ hình ảnh, sơ đồ hoặc bảng dữ liệu nào, văn bản phải có ít nhất một câu dẫn trực tiếp tham chiếu tới mã số của đối tượng đó.
- _Mẫu chuẩn:_
  - _"Kiến trúc phân tầng và sự phân tách trách nhiệm giữa các module được thể hiện chi tiết tại Hình 3.1."_
  - _"Danh mục các thuộc tính và kiểu dữ liệu của thực thể đơn hàng được tổng hợp trong Bảng 3.2."_

### 4.2. Quy ước tiêu đề và định dạng Caption

- **Đối với Hình ảnh / Sơ đồ / Biểu đồ (Figures):**
  - Vị trí: Đặt **dưới** hình ảnh, căn giữa.
  - Cú pháp: `Hình <Chương>.<Thứ tự>: <Tên mô tả nội dung>`
  - _Ví dụ:_
    - `Hình 3.1: Sơ đồ kiến trúc phân tầng của phân hệ Cart & Order Processing`
    - `Hình 3.2: Lược đồ quan hệ thực thể (ERD) lưu trữ dữ liệu giỏ hàng và đơn hàng`
    - `Hình 4.1: Giao diện màn hình giỏ hàng và quy trình xác thực đơn hàng thực tế`
- **Đối với Bảng biểu (Tables):**
  - Vị trí: Đặt **trên** bảng biểu, căn lề trái hoặc căn giữa thống nhất.
  - Cú pháp: `Bảng <Chương>.<Thứ tự>: <Tên bảng mô tả>`
  - _Ví dụ:_
    - `Bảng 3.1: So sánh hiệu năng giữa cơ chế WebSocket và HTTP Long-Polling`
    - `Bảng 4.1: Yêu cầu thông số cấu hình phần mềm và môi trường thực thi`

---

## 5. THÔNG SỐ ĐỊNH DẠNG TÀI LIỆU (DOCUMENT TYPOGRAPHY & LAYOUT)

Khi biên tập và xuất tài liệu ra Microsoft Word / Google Docs, tài liệu phải tuân thủ chuẩn trình bày đồ án tốt nghiệp của Trường ĐH Công nghệ (UET):

| Thành phần tài liệu                 | Font chữ               | Cỡ chữ (Size)                                                                            | Định dạng kiểu            | Căn lề (Alignment)           | Dãn dòng / Cách đoạn                                  |
| :---------------------------------- | :--------------------- | :--------------------------------------------------------------------------------------- | :------------------------ | :--------------------------- | :---------------------------------------------------- |
| **Tiêu đề Chương (Heading 1)**      | Times New Roman        | 16 – 18pt                                                                                | In hoa, Đậm (Bold)        | Giữa hoặc Căn trái           | Before: 12pt, After: 6pt                              |
| **Mục cấp 1 (Heading 2)**           | Times New Roman        | 14 – 15pt                                                                                | Đậm (Bold)                | Căn trái                     | Before: 8pt, After: 4pt                               |
| **Mục cấp 2 (Heading 3)**           | Times New Roman        | 13 – 14pt                                                                                | Đậm / Nghiêng             | Căn trái                     | Before: 6pt, After: 2pt                               |
| **Văn bản nội dung (Body text)**    | Times New Roman        | 13pt                                                                                     | Thường (Regular)          | Căn đều hai bên (Justified)  | Line spacing: 1.3 – 1.5 lines; First line indent: 1cm |
| **Đoạn mã (Code snippet / Schema)** | Consolas / Courier New | 10 – 11pt                                                                                | Regular                   | Căn trái, khung nền xám nhạt | Line spacing: 1.0 (đơn)                               |
| **Chú thích (Caption hình & bảng)** | Times New Roman        | 11 – 12pt                                                                                | Đậm nghiêng (Bold Italic) | Giữa trang (Center)          | Before: 3pt, After: 6pt                               |
| **Quy cách căn lề trang (Margins)** | Khổ giấy A4            | Top: 2.0 – 2.5 cm, Bottom: 2.0 – 2.5 cm, Left: 3.0 – 3.5 cm (để đóng gáy), Right: 2.0 cm |

--
