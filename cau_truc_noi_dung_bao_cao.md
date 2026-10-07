CHƯƠNG 1: GIỚI THIỆU CHUNG

1.1. Giới thiệu đơn vị thực tập

- Đoạn 1: FPT Software
- Đoạn 2: Chương trình Campuslink Front-End
- Đoạn 3: Agile/Scrum, GitHub, Slack và CI/CD
- Hình 1.1: Quy trình phát triển

  1.2. Giới thiệu công việc và vai trò đảm nhiệm

- Đoạn 1: Vị trí Fullstack Web Developer Intern
- Đoạn 2: Nghiên cứu và thiết kế giải pháp
- Đoạn 3: Hiện thực backend, frontend và realtime
- Đoạn 4: Phối hợp tích hợp và giới hạn phạm vi

  1.3. Tổng quan bài toán nền tảng đặt đồ ăn

- Đoạn 1: Bối cảnh thị trường F&B
- Đoạn 2: Luồng nghiệp vụ tổng thể
- Đoạn 3: Ba pain point chính
- Đoạn 4: Mô hình tương tác và đánh giá
- Hình 1.2: Ecosystem Diagram

CHƯƠNG 2: PHÂN TÍCH YÊU CẦU BÀI TOÁN

2.1. Miêu tả bài toán tổng thể của hệ thống

- Đoạn 1: Mục tiêu nền tảng
- Đoạn 2: Luồng nghiệp vụ tổng quát
- Đoạn 3: Các vấn đề cần giải quyết
- Đoạn 4: Mục tiêu và phạm vi báo cáo

  2.2. Phân chia công việc nhóm và phạm vi của sinh viên

- Đoạn 1: Mô hình tổ chức nhóm
- Đoạn 2: Phạm vi Cart & Order của sinh viên
- Đoạn 3: Vai trò các thành viên và module liên quan
- Đoạn 4: Ranh giới và rủi ro tích hợp
- Hình 2.1: Sơ đồ phân rã chức năng
- Bảng 2.1: Ma trận RACI
- Bảng 2.2: Nhiệm vụ và kết quả bàn giao

  2.3. Yêu cầu chi tiết đối với phân hệ phụ trách

- Đoạn 1: Bối cảnh và mục tiêu yêu cầu
- Đoạn 2: Bốn Use Case cốt lõi
- Đoạn 3: Nhóm Functional Requirements
- Đoạn 4: Checkout và tính nhất quán dữ liệu
- Đoạn 5: Realtime status synchronization
- Đoạn 6: Non-Functional Requirements
- Hình 2.2: Sơ đồ Use Case
- Bảng 2.3: Tổng hợp Functional Requirements
- Bảng 2.4: Tổng hợp Use Case
- Bảng 2.5: Non-Functional Requirements

CHƯƠNG 3: CƠ SỞ KỸ THUẬT, THIẾT KẾ VÀ GIẢI PHÁP THỰC HIỆN

3.1. Các công nghệ và giải pháp liên quan

- 3 đoạn: công nghệ, lý do lựa chọn, định hướng giải pháp

  3.2. Kiến trúc giải pháp và thiết kế hệ thống

- 5 đoạn: vấn đề, kiến trúc phân tầng, dữ liệu, toàn vẹn dữ liệu, đánh giá
- Hình 3.1: Kiến trúc phân tầng
- Hình 3.2: ERD
- 1 bảng thực thể chính

  3.3. Hiện thực hóa các tính năng cốt lõi

- 6 đoạn: Cart/Checkout và Realtime
- Hình 3.3: Sequence Checkout
- Hình 3.4: Realtime Order Status
- 2 bảng endpoint và event

  3.4. So sánh và đánh giá giải pháp

- 3 đoạn: so sánh, kết quả, kết luận
- 1 bảng đánh giá

CHƯƠNG 4: HƯỚNG DẪN CÀI ĐẶT VÀ VẬN HÀNH HỆ THỐNG

4.1. Môi trường phát triển và yêu cầu phần cứng/phần mềm

- 3 đoạn: mục đích, thành phần, yêu cầu
- 1 bảng môi trường

  4.2. Quy trình thiết lập và triển khai mã nguồn

- 4 đoạn: chuẩn bị, cấu hình, chạy, build/deploy
- Có thể có Hình 4.1: Quy trình triển khai

  4.3. Kết quả giao diện và luồng chạy thực tế

- 5 đoạn: mục tiêu, Cart/Checkout, trạng thái, đo lường, đánh giá
- 2 bảng kết quả
- 2–3 hình giao diện nếu cần

CHƯƠNG 5: KẾT QUẢ ĐẠT ĐƯỢC VÀ HƯỚNG PHÁT TRIỂN

5.1. Kết quả đạt được so với mục tiêu ban đầu

- 3 đoạn: chức năng hoàn thành, kết quả kiểm tra, giới hạn kết luận
- 1 bảng tổng hợp

  5.2. Kỹ năng và kiến thức thu thập được

- 3 đoạn: chuyên môn, kỹ thuật, làm việc

  5.3. Hạn chế và hướng phát triển tiếp theo

- 3 đoạn: hạn chế, hướng phát triển, lộ trình
- Hình 5.1: Kiến trúc mở rộng tương lai

## Quy tắc biên tập cần áp dụng

- Chỉ dùng các heading chính `#`, `##` tương ứng với Chương và mục `1.1`, `1.2`, `1.3`, `2.1`, `2.2`, `2.3`.

- Không dùng các heading nhỏ như:

- `1.1.1`.

- `2.2.1`.

- `UC-01` làm tiêu đề độc lập.

- `Problem Statement`, `Implementation`, `Evaluation` làm tiêu đề phụ.

- Ba tầng nội dung được thể hiện ngầm bằng thứ tự các đoạn:

1. Bối cảnh và vấn đề.

2. Giải pháp hoặc phạm vi hiện thực.

3. Đánh giá, giới hạn và khả năng kiểm chứng.

- Mỗi bảng hoặc sơ đồ phải có câu dẫn trực tiếp trước khi xuất hiện.

- Tên biến, endpoint, event và field cơ sở dữ liệu phải dùng inline code, ví dụ `POST /api/orders/checkout`, `orderStatus`, `order:updated`.

- Không khẳng định các chỉ số chưa có bằng chứng đo lường. Các target như p95 `< 200 ms`, throughput hoặc reconnect `>= 99%` phải được ghi là mục tiêu kiểm chứng nếu chưa có benchmark.

- Tóm gọn theo hướng **nêu vai trò, luồng và kết quả**, không mô tả chi tiết từng file, từng controller, từng validation branch hoặc toàn bộ endpoint trong phần nội dung chính.
