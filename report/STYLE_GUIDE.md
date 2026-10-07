# BỘ QUY TẮC ĐỊNH DẠNG VÀ VĂN PHONG BÁO CÁO (STYLE GUIDE)
**Dự án:** Báo cáo học phần Thực tập doanh nghiệp Nhật Bản  
**Tác giả:** Nguyễn Công Khải  
**Mục đích:** Chuẩn hóa văn phong, cấu trúc nội dung và định dạng trình bày cho GitHub Copilot và Google Docs Gemini khi tạo lập/biên tập báo cáo.

---

## 1. Văn phong và Giọng điệu (Tone & Academic Style)
- **Đại từ nhân xưng:** Sử dụng ngôi thứ nhất khách quan hoặc trung tính:
  - Cho phép: *"sinh viên"*, *"nhóm phát triển"*, *"hệ thống"*, hoặc diễn đạt thể bị động/trung tính.
  - Tuyệt đối tránh: *"mình"*, *"em"*, *"tôi"*, *"chúng mình"*.
- **Tính chất câu văn:**
  - Gãy gọn, rõ nghĩa, chủ động, đi thẳng vào bản chất kỹ thuật.
  - Không dùng từ ngữ mang tính cảm tính, cường điệu hoặc văn nói (ví dụ: tránh dùng *"rất xịn"*, *"cực kỳ mạnh mẽ"*, *"nói chung là"*).
- **Thuật ngữ chuyên ngành:**
  - Giữ nguyên các thuật ngữ kỹ thuật tiếng Anh chuẩn mực để bảo toàn tính chính xác: *State synchronization, Concurrency, Event-driven, ACID, Idempotency, Race condition, Data consistency, Webhook, WebSocket...*
  - Tên bảng CSDL, API endpoint, tên hàm, tên biến cần viết đúng định dạng mã nguồn (dùng thẻ `code` hoặc viết hoa/thường theo đúng schema).

---

## 2. Cấu trúc một tiểu mục (Công thức 3 tầng)
Mỗi tiểu mục phân tích tính năng hoặc kiến trúc kỹ thuật cần tuân thủ cấu trúc 3 tầng tuần tự:

### Tầng 1: Khái niệm & Đặt vấn đề (Problem Statement)
- Mục này giải quyết bài toán/thách thức gì trong hệ thống đặt món?
- Bối cảnh nghiệp vụ, nguyên nhân phát sinh yêu cầu và mục tiêu kỹ thuật cần đạt được (ví dụ: bài toán đồng bộ trạng thái đơn giữa khách - tài xế - quán).

### Tầng 2: Giải pháp & Hiện thực (Implementation & Solution)
- Chi tiết phương án kỹ thuật và kiến trúc triển khai.
- Minh họa trực quan thông qua:
  - Bảng mô tả cấu trúc dữ liệu / schema / tham số API.
  - Sơ đồ kiến trúc, sơ đồ tuần tự (Sequence Diagram), sơ đồ luồng (Workflow) hoặc lược đồ quan hệ thực thể (ERD).
  - Mã giả (pseudocode) hoặc đoạn trích logic trọng tâm.

### Tầng 3: Đánh giá & Kết luận (Evaluation & Metrics)
- Phân tích ưu điểm và nhược điểm/hạn chế của giải pháp.
- Đánh giá độ phức tạp thuật toán, khả năng mở rộng (scalability).
- Cung cấp số liệu đo đạc cụ thể nếu có (ví dụ: *độ trễ phản hồi < 200ms*, *khả năng chịu tải throughput*, *tỉ lệ sai lệch tồn kho = 0*).

---

## 3. Quy ước Hình ảnh, Bảng biểu và Sơ đồ

### 3.1. Dẫn dắt trước hình ảnh (Lead-in Sentence)
- Trước bất kỳ hình ảnh hoặc sơ đồ nào, **bắt buộc** phải có ít nhất một câu văn dẫn dắt ngữ cảnh.
- *Ví dụ:*
  > *"Cấu trúc dữ liệu chi tiết và mối quan hệ giữa các thực thể trong phân hệ được mô tả tại Hình 3.2."*

### 3.2. Tiêu đề và Đánh số (Captioning)
- Mọi sơ đồ, hình ảnh phải đặt chú thích ngay bên dưới hình, căn giữa:
  > **Hình X.Y: Tên mô tả chi tiết**  
  *(Trong đó `X` là số thứ tự chương, `Y` là số thứ tự hình trong chương)*
- *Ví dụ mẫu:*
  - `Hình 3.2: Lược đồ quan hệ thực thể (ERD) phân hệ Giỏ hàng và Đơn hàng`
  - `Hình 3.5: Biểu đồ tuần tự (Sequence Diagram) quy trình xác thực và thanh toán đơn hàng`

### 3.3. Quy ước Bảng biểu (Tables)
- Tiêu đề bảng đặt **bên trên** bảng:
  > **Bảng X.Y: Tên bảng mô tả**
- Cột tiêu đề viết hoa chữ cái đầu, nội dung trong bảng căn lề rõ ràng (chữ căn trái, số liệu căn phải hoặc căn giữa).

---

## 4. Quy chuẩn Định dạng Google Docs (Formatting Rules)

| Thành phần | Font chữ | Cỡ chữ (Size) | Định dạng (Style) | Căn lề / Dãn dòng |
| :--- | :--- | :--- | :--- | :--- |
| **Heading 1** | Times New Roman | 20pt | Bold | Căn trái, cách đoạn trên 12pt, dưới 6pt |
| **Heading 2** | Times New Roman | 16pt | Bold | Căn trái, cách đoạn trên 10pt, dưới 4pt |
| **Heading 3** | Times New Roman | 14pt | Bold / Italic | Căn trái, cách đoạn trên 6pt, dưới 2pt |
| **Body text** | Times New Roman | 13pt | Regular | Căn đều hai bên (Justify), dãn dòng 1.2 – 1.3, First line indent 1cm (nếu cần) |
| **Code snippet / Schema** | Consolas / Courier New | 10.5 – 11pt | Regular (hộp màu nền xám nhẹ) | Căn trái, dãn dòng đơn (1.0) |
| **Figure / Table Caption** | Times New Roman | 11 – 12pt | Bold + Italic | Căn giữa |

---

## 5. Mẫu System Prompt Nạp Cho AI (Copilot & Gemini)

Khi đưa dữ liệu thô vào công cụ AI, hãy sử dụng mẫu prompt sau:

> *"Tuân thủ nghiêm ngặt bộ quy tắc trong `style_guide.md`:*  
> *1. Văn phong học thuật, xưng 'sinh viên' hoặc dùng câu khách quan, không dùng 'em/mình'.*  
> *2. Trình bày chuẩn 3 tầng: Đặt vấn đề -> Giải pháp & Hiện thực -> Đánh giá & Kết luận.*  
> *3. Luôn có câu dẫn dắt trước mọi sơ đồ/hình ảnh và đặt placeholder `[Hình X.Y: Tên mô tả]` theo đúng format.*  
> *4. Giữ nguyên 100% logic code, tên biến, bảng DB và các thuật ngữ chuyên ngành tiếng Anh."*