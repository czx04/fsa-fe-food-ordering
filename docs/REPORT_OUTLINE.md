# THÔNG TIN CHUNG BÁO CÁO THỰC TẬP

- **Đơn vị đào tạo**: Đại học Quốc gia Hà Nội – Trường Đại học Công nghệ (UET)
- **Ngành**: Công nghệ thông tin định hướng thị trường Nhật Bản
- **Đề tài**: Xây dựng nền tảng đặt đồ ăn
- **Sinh viên thực hiện**: Nguyễn Công Khải
- **Mã sinh viên**: 22026562
- **Lớp**: QH-2022-I/CQ-I-IT-20
- **Cán bộ hướng dẫn (Doanh nghiệp)**: Vũ Tú Anh
- **Giảng viên đánh giá**: ThS. Lê Duy Đức
- **Thời gian hoàn thành**: Tháng 08/2026

---

# CẤU TRÚC MỤC LỤC CHI TIẾT (10 – 15 TRANG)

## LỜI CẢM ƠN

- Lời cảm ơn gửi tới Công ty thực tập và Cán bộ hướng dẫn Vũ Tú Anh.
- Lời cảm ơn gửi tới Giảng viên đánh giá ThS. Lê Duy Đức và Khoa CNTT - ĐH Công nghệ.

## DANH MỤC TỪ VIẾT TẮT & THUẬT NGỮ

- Bảng tổng hợp các thuật ngữ kỹ thuật (API, REST, ERD, JWT, Socket.io, DBMS,...).

## DANH MỤC HÌNH VẼ VÀ BẢNG BIỂU

- Danh sách hình ảnh sơ đồ kiến trúc, thiết kế ERD và bảng phân chia công việc.

---

## CHƯƠNG 1: GIỚI THIỆU CHUNG

### 1.1. Giới thiệu đơn vị thực tập

- Tổng quan về doanh nghiệp, lĩnh vực hoạt động và văn hóa làm việc.
- Quy trình phát triển phần mềm áp dụng (Agile/Scrum, Git workflow).

### 1.2. Giới thiệu công việc và vai trò đảm nhiệm

- Vị trí thực tập sinh kỹ thuật.
- Trách nhiệm trong nhóm phát triển dự án.

### 1.3. Tổng quan bài toán nền tảng đặt đồ ăn

- Bối cảnh thị trường và sự cần thiết của hệ thống.
- Các đối tượng tương tác chính: Khách hàng (User), Cửa hàng (Merchant), Tài xế (Driver).

---

## CHƯƠNG 2: PHÂN TÍCH YÊU CẦU BÀI TOÁN

### 2.1. Miêu tả bài toán tổng thể của hệ thống

- Phạm vi toàn diện của nền tảng đặt món: Tìm kiếm nhà hàng, Quản lý giỏ hàng, Đặt đơn, Thanh toán, Điều phối giao hàng.

### 2.2. Phân chia công việc nhóm và phạm vi của sinh viên

- Ma trận phân công nhiệm vụ (Team Task Allocation).
- Xác định phân hệ sinh viên trực tiếp xây dựng: Module Quản lý Giỏ hàng & Xử lý Đơn hàng (Cart & Order Processing Module).

### 2.3. Yêu cầu chi tiết đối với phân hệ phụ trách

- **Yêu cầu chức năng**:
  - Thêm/sửa/xóa món ăn kèm topping/ghi chú vào giỏ hàng.
  - Tạo đơn hàng, tính toán chi phí (tạm tính, phí giao hàng, voucher).
  - Cập nhật và theo dõi trạng thái đơn hàng thời gian thực.
- **Yêu cầu phi chức năng**:
  - Đảm bảo tính toàn vẹn dữ liệu khi nhiều người dùng cùng đặt một món tại cùng một thời điểm (Concurrency).
  - Thời gian phản hồi API < 200ms.

---

## CHƯƠNG 3: CƠ SỞ KỸ THUẬT, THIẾT KẾ VÀ GIẢI PHÁP THỰC HIỆN

### 3.1. Các công nghệ và giải pháp liên quan

- Phân tích lý do chọn ngăn xếp công nghệ (Tech Stack) phục vụ module:
  - Runtime/Framework: Node.js / Express (hoặc công nghệ tương ứng của repo).
  - Cơ sở dữ liệu: MongoDB / PostgreSQL.
  - Xử lý Realtime: Socket.io / WebSocket.

### 3.2. Kiến trúc giải pháp và thiết kế hệ thống

- **3.2.1. Sơ đồ kiến trúc phân tầng (High-Level Architecture)**: Luồng dữ liệu giữa Client, API Gateway, Service và Database.
- **3.2.2. Thiết kế Cơ sở dữ liệu (ERD)**: Chi tiết cấu trúc các bảng/collection `Carts`, `Orders`, `OrderItems`, `Promotions`.

### 3.3. Hiện thực hóa các tính năng cốt lõi (Code & Implementation)

- **3.3.1. Xử lý logic tạo đơn và tính toán giá trị đơn hàng**:
  - Luồng kiểm tra tình trạng mở cửa và tồn kho món ăn.
  - Thuật toán áp mã giảm giá và tính phí vận chuyển.
- **3.3.2. Cơ chế đồng bộ trạng thái đơn hàng thời gian thực**:
  - Thiết kế sự kiện WebSocket thông báo đơn hàng cho Merchant khi có đơn mới.
  - Cập nhật trạng thái chuẩn bị/giao hàng tới Client.

### 3.4. So sánh và đánh giá giải pháp

- So sánh kiến trúc Event-driven / WebSocket với Polling truyền thống về độ trễ và tài nguyên máy chủ.
- Đánh giá cơ chế xử lý Transaction bảo đảm tính nhất quán dữ liệu giỏ hàng.

---

## CHƯƠNG 4: HƯỚNG DẪN CÀI ĐẶT VÀ VẬN HÀNH HỆ THỐNG

### 4.1. Môi trường phát triển và yêu cầu phần cứng/phần mềm

- Yêu cầu Node.js, Docker, Docker Compose, Git.

### 4.2. Quy trình thiết lập và triển khai mã nguồn

- Hướng dẫn cấu hình biến môi trường (`.env`).
- Các bước cài đặt dependencies và lệnh chạy môi trường phát triển (`npm run dev`).

### 4.3. Kết quả giao diện và luồng chạy thực tế

- Ảnh chụp màn hình các chức năng chính đã hoàn thiện.
- Kết quả kiểm thử API trên Postman/Swagger.

---

## CHƯƠNG 5: KẾT QUẢ ĐẠT ĐƯỢC VÀ HƯỚNG PHÁT TRIỂN

### 5.1. Kết quả đạt được so với mục tiêu ban đầu

- Tỷ lệ hoàn thành công việc được giao trong đợt thực tập.
- Đóng góp vào tiến độ chung của toàn bộ sản phẩm.

### 5.2. Kỹ năng và kiến thức thu thập được

- **Chuyên môn**: Nâng cao kỹ năng thiết kế RESTful API, quản trị CSDL, xử lý bất đồng bộ.
- **Kỹ năng mềm**: Tinh thần phối hợp nhóm, giải quyết vấn đề, kỷ luật cam kết deadline.

### 5.3. Hạn chế và hướng phát triển tiếp theo

- Các hạn chế còn tồn đọng của module (chưa tối ưu cache bộ nhớ, chưa có rate-limit nâng cao).
- Định hướng tích hợp Redis Caching và Message Queue (RabbitMQ/Kafka) khi mở rộng quy mô.

---

## TÀI LIỆU THAM KHẢO

- Danh sách tài liệu chính thức của thư viện/ngôn ngữ sử dụng và các tài liệu tham khảo chuyên ngành.

---

## TRANG XÁC NHẬN VÀ ĐÁNH GIÁ (THEO MẪU BẮT BUỘC)

- [Logo Công ty] - Ý kiến đánh giá của Người hướng dẫn tại doanh nghiệp (Vũ Tú Anh ký tên & đóng dấu).
- [Logo ĐHCN] - Ý kiến đánh giá và điểm số của Giảng viên đánh giá (ThS. Lê Duy Đức ký tên).

```[cite: 2]

```
