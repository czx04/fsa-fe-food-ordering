**BÁO CÁO HỌC PHẦN THỰC TẬP DOANH NGHIỆP NHẬT BẢN**

**Tên đề tài:** Xây dựng nền tảng đặt đồ ăn (Food Ordering Platform)  
**Phân hệ phụ trách:** Giỏ hàng và Xử lý đơn hàng (Cart & Order Processing Module)  
**Sinh viên thực hiện:** Nguyễn Công Khải – MSV: 22026562  
**Đơn vị thực tập:** Công ty TNHH Phần mềm FPT (FPT Software) – Campuslink Front-End  
**Giảng viên đánh giá:** ThS. Lê Duy Đức  
**Cán bộ hướng dẫn doanh nghiệp:** Vũ Tú Anh  
**Đơn vị đào tạo:** Trường Đại học Công nghệ – Đại học Quốc gia Hà Nội

**LỜI CẢM ƠN**

Em xin trân trọng cảm ơn Trường Đại học Công nghệ – Đại học Quốc gia Hà Nội, các thầy cô và FPT Software đã tạo điều kiện để em tham gia chương trình thực tập trong môi trường dự án định hướng Nhật Bản. Em đặc biệt cảm ơn giảng viên đánh giá, cán bộ hướng dẫn doanh nghiệp và các thành viên trong nhóm đã hỗ trợ em trong quá trình phân tích yêu cầu, thiết kế, hiện thực, tích hợp và đánh giá phân hệ Cart & Order Processing.

Báo cáo này tổng hợp quá trình thực hiện nền tảng đặt đồ ăn, tập trung vào chuỗi nghiệp vụ `Cart → Checkout → Order → Status Synchronization`. Những nội dung chưa có benchmark hoặc kiểm thử runtime đầy đủ được ghi rõ là chưa xác minh, không suy diễn thành kết quả định lượng.

**MỤC LỤC**

- Lời cảm ơn
- Chương 1: Giới thiệu chung
- Chương 2: Phân tích yêu cầu bài toán
- Chương 3: Cơ sở kỹ thuật, thiết kế và giải pháp thực hiện
- Chương 4: Hướng dẫn cài đặt và vận hành hệ thống
- Chương 5: Kết quả đạt được và hướng phát triển
- Tài liệu tham khảo

# CHƯƠNG 1: GIỚI THIỆU CHUNG

## 1.1. Giới thiệu đơn vị thực tập

FPT Software cung cấp dịch vụ phát triển phần mềm, tư vấn chuyển đổi số và vận hành hệ thống cho khách hàng trong nước và quốc tế. Trong môi trường dự án định hướng Nhật Bản, tính kỷ luật, khả năng phối hợp đa vai trò, chất lượng sản phẩm và khả năng truy vết thay đổi được đặt ở vị trí quan trọng trong vòng đời phát triển phần mềm.

Chương trình Campuslink Front-End tạo điều kiện để sinh viên tiếp cận quy trình dự án doanh nghiệp thông qua việc phân tích yêu cầu, triển khai chức năng, phối hợp nhóm và kiểm soát mã nguồn. Dự án được tổ chức theo mô hình Agile/Scrum; công việc được phân rã thành user story hoặc task trong Sprint và được hiện thực trên feature branch theo định hướng Git Flow.

GitHub được sử dụng để lưu trữ repository, quản lý branch, mở Pull Request, thực hiện Code Review và theo dõi lịch sử thay đổi. Slack hỗ trợ trao đổi nhanh, làm rõ `API contract`, thông báo blocker và phối hợp giữa các vai trò. Các quyết định kỹ thuật quan trọng cần được phản ánh lại trong issue, Pull Request hoặc tài liệu để bảo đảm khả năng truy vết.

Ở cấp CI/CD, workflow GitHub Actions thực hiện `npm ci`, build workspace, lint và test dashboard trước khi publish image Docker của customer, dashboard và server. Cách tổ chức này tạo quality gate trước khi thay đổi được đưa vào nhánh tích hợp hoặc phát hành. Quy trình phát triển và kiểm soát mã nguồn được trình bày tại Hình 1.1.

[Mermaid diagram](diagrams/hinh-1-1-quy-trinh-phat-trien.mmd)

<div align="center"><strong><em>Hình 1.1: Quy trình phát triển và kiểm soát mã nguồn dự án</em></strong></div>

## 1.2. Giới thiệu công việc và vai trò đảm nhiệm

Trong chương trình thực tập, em đảm nhiệm vị trí Fullstack Web Developer Intern, tham gia cả backend và frontend. Phạm vi trách nhiệm tập trung vào phân hệ Cart & Order Processing, là điểm nối giữa thao tác chọn món của customer, dữ liệu nhà hàng, thanh toán, cập nhật trạng thái và khả năng mở rộng sang điều phối giao hàng.

Đây là phạm vi có tính liên kết cao. Một thay đổi ở giá món, phí giao hàng, coupon hoặc enum trạng thái có thể ảnh hưởng đồng thời đến giao diện, `API contract`, dữ liệu MongoDB, dashboard merchant và các sự kiện realtime. Vì vậy, công việc không chỉ là viết endpoint mà còn phải bảo đảm tính nhất quán của toàn bộ chuỗi `Cart → Checkout → Order → Status Synchronization`.

Trách nhiệm kỹ thuật bao gồm phân tích yêu cầu nghiệp vụ, xác định state machine của đơn hàng, lựa chọn RESTful API cho thao tác đồng bộ và Socket.IO cho Real-time Communication. Trên cơ sở đó, em thiết kế các thực thể `Cart`, `Coupon` và `Order`, xác định quan hệ với `User`, `Restaurant` và `MenuItem`, đồng thời bảo đảm `Order` lưu snapshot khách hàng, nhà hàng, item và pricing tại thời điểm checkout.

Ở phía backend, em xây dựng và tích hợp route, controller, service và repository cho CRUD giỏ hàng, áp coupon, tính phí giao hàng, checkout tại `POST /api/orders/checkout`, lịch sử đơn, reorder, hủy đơn và chuyển trạng thái phía owner. Ở phía frontend, em làm việc với `CartContext`, `CartPage`, `CheckoutPage`, `OrderHistoryPage` và `OrderDetailPage`, kết nối API service, xử lý optimistic update và thực hiện resynchronization dữ liệu khi cần.

Đối với realtime, Socket.IO client/server xác thực JWT trong handshake, join room `order:{orderId}`, phát event `order:updated` sau khi `Order.save()` hoàn tất và gọi REST để resynchronization khi reconnect. Trong quá trình tích hợp, em duy trì `API contract` với Auth, Merchant, Payment, Review và interface Driver, đồng thời cập nhật tài liệu, kiểm tra thay đổi qua Pull Request và xử lý phản hồi Code Review.

Trong hiện trạng repository, Driver chưa có service độc lập. Interface giữa Order và Driver được thể hiện bằng order snapshot, địa chỉ nhận hàng, `deliveryFee` và các trạng thái `delivering`/`delivered`; việc triển khai driver assignment và cập nhật vị trí cần được chuẩn hóa trong giai đoạn tiếp theo.

Giới hạn của phạm vi là chưa có inventory service và chưa có `ACID transaction` nguyên tử cho thao tác lưu order kết hợp xóa cart. State transition đã có kiểm tra theo state machine nhưng vẫn cần `conditional update` hoặc `Optimistic Locking` để giảm `Race Condition` khi nhiều actor cập nhật đồng thời. Các giới hạn này được ghi nhận như hướng cải tiến, không được xem là chức năng đã hoàn thiện.

## 1.3. Tổng quan bài toán nền tảng đặt đồ ăn

On-demand Food Delivery là mô hình trong đó customer tìm kiếm món ăn, tạo đơn và nhận hàng theo nhu cầu; merchant tiếp nhận và chuẩn bị đơn; driver nhận nhiệm vụ và thực hiện giao hàng. Sự phổ biến của smartphone, thanh toán điện tử và `location-based service` thúc đẩy quá trình chuyển đổi số trong ngành F&B. Nền tảng số không chỉ cung cấp kênh bán hàng mà còn kết nối dữ liệu giữa thực đơn, khuyến mại, đơn hàng, vận hành nhà hàng và giao nhận.

Customer cần biết đơn đã được tiếp nhận, đang chuẩn bị hay đang giao; merchant cần dashboard để xử lý đơn theo đúng thứ tự; driver cần nhận thông tin giao hàng chính xác. Bài toán cốt lõi là duy trì `Data consistency` giữa nhiều actor trong một quy trình có trạng thái thay đổi liên tục.

Ba pain point trọng tâm được xem xét. Thứ nhất, nhiều customer có thể đặt cùng món trong khoảng thời gian ngắn, trong khi hệ thống hiện tại chưa có `stockQuantity` và chưa thực hiện inventory decrement nguyên tử, dẫn đến nguy cơ oversell. Thứ hai, nếu chỉ sử dụng Polling, customer và merchant có thể nhìn thấy trạng thái cũ; Socket.IO giúp phát sự kiện sau khi dữ liệu được lưu, nhưng reconnect vẫn cần REST resynchronization. Thứ ba, `subtotal`, `discount`, `deliveryFee` và `grandTotal` phải được tính lại tại server để hạn chế sai lệch khi áp voucher đồng thời.

Nền tảng được ranh giới thành ba nhóm tác nhân chính. Customer thao tác qua customer web để duy trì cart, áp coupon, checkout và theo dõi order. Merchant sử dụng dashboard để quản lý menu, tiếp nhận đơn và chuyển trạng thái theo chuỗi `pending → confirmed → preparing → delivering → delivered`, hoặc hủy theo điều kiện. Driver là tác nhân giao nhận; trong repository hiện tại đây là integration boundary đang chờ service riêng.

Backend platform tiếp nhận request qua Express, thực hiện business rule trong service, đọc/ghi MongoDB qua model/repository và phát `order:updated` qua Socket.IO. `Order` lưu snapshot giá và thông tin liên quan nên hóa đơn lịch sử không phụ thuộc vào thay đổi menu sau checkout. Client customer kết hợp event realtime với `GET /api/orders/:id` sau reconnect để giữ mô hình eventual consistency có resynchronization. Mô hình tương tác được trình bày tại Hình 1.2.

[Mermaid diagram](diagrams/hinh-1-2-he-sinh-thai-dat-do-an.mmd)

<div align="center"><strong><em>Hình 1.2: Mô hình tương tác giữa các tác nhân trong hệ sinh thái đặt đồ ăn</em></strong></div>

Kiến trúc hiện tại đã giải quyết các phần quan trọng của luồng đặt hàng: cart được giới hạn theo một restaurant, coupon được kiểm tra lại khi tính toán, order giữ snapshot và trạng thái được kiểm soát bằng state machine. Socket.IO giảm độ trễ cảm nhận khi merchant cập nhật đơn; việc phát event sau `save()` và resynchronization qua REST giúp không phụ thuộc tuyệt đối vào một event đơn lẻ.

Inventory chưa tồn tại trong model/service nên chưa thể cam kết không oversell; cập nhật trạng thái chưa phải compare-and-swap nguyên tử; room `restaurant:{restaurantId}` được phát event nhưng server hiện mới có listener `join:order`. Việc lưu order và xóa cart cũng chưa nằm trong một MongoDB transaction. Do đó, nền tảng đã có kiến trúc xử lý nghiệp vụ cốt lõi nhưng cần bổ sung inventory transaction, `Concurrency Control`, merchant realtime room và integration test trước khi tuyên bố sẵn sàng production.

# CHƯƠNG 2: PHÂN TÍCH YÊU CẦU BÀI TOÁN

## 2.1. Miêu tả bài toán tổng thể của hệ thống

Mục tiêu của nền tảng là cung cấp một luồng đặt đồ ăn thống nhất từ lúc customer chọn món đến khi đơn được giao và hoàn tất. Hệ thống phải hỗ trợ customer tìm kiếm nhà hàng, xem menu, thêm món vào cart, áp voucher, nhập địa chỉ, chọn phương thức thanh toán, tạo order, theo dõi trạng thái và đánh giá sau giao hàng. Merchant cần quản lý nhà hàng, menu, tiếp nhận đơn và cập nhật trạng thái. Driver cần nhận dữ liệu đơn và phản hồi trạng thái giao hàng khi module được triển khai.

Luồng nghiệp vụ tổng quát gồm: customer chọn menu item; hệ thống tạo hoặc cập nhật cart thuộc một restaurant; cart service tính `subtotal`, `discountAmount` và `grandTotal`; customer gửi checkout; backend xác thực JWT và email, đọc dữ liệu từ server, tạo `Order` snapshot, xử lý thanh toán, xóa cart và phát cập nhật trạng thái khi order thay đổi.

Các vấn đề cần giải quyết là tính đúng đắn của giá và coupon, giới hạn cart theo một restaurant, quyền truy cập order, tính hợp lệ của state transition, đồng bộ realtime, chống tạo đơn trùng, tính nguyên tử của chuyển đổi cart thành order và khả năng mở rộng khi số lượng actor tăng.

Phạm vi báo cáo tập trung vào Cart & Order Processing. Các chỉ tiêu như p95 latency `< 200 ms`, throughput hoặc tỷ lệ reconnect `>= 99%` là mục tiêu kiểm chứng đề xuất nếu chưa có benchmark; không được xem là kết quả thực tế.

## 2.2. Phân chia công việc nhóm và phạm vi của sinh viên

Hệ thống được phát triển theo mô hình nhóm, trong đó mỗi thành viên chịu trách nhiệm chính cho một phân hệ nghiệp vụ và phối hợp thông qua các interface đã thống nhất. Cách tổ chức này giúp phân chia công việc theo năng lực, kiểm thử từng phần trước khi tích hợp và giảm xung đột mã nguồn.

Sinh viên được phân công làm Responsible/Accountable cho module Cart & Order Processing. Module tiếp nhận dữ liệu món ăn từ Merchant, xác lập giỏ hàng một nhà hàng, tính toán giá trị thanh toán, tạo snapshot đơn hàng, theo dõi trạng thái và phát tín hiệu cập nhật đến các thành phần liên quan. Phạm vi cụ thể gồm CRUD cart, coupon, checkout, order history, order detail, cancel, reorder, merchant status transition và realtime synchronization.

Hình 2.1 phân rã hệ thống theo nhóm chức năng và làm nổi bật phạm vi do sinh viên phụ trách.

[Mermaid diagram](diagrams/hinh-2-1-phan-ra-chuc-nang.mmd)

<div align="center"><strong><em>Hình 2.1: Sơ đồ phân rã chức năng hệ thống và phạm vi đảm nhiệm của sinh viên</em></strong></div>

Ma trận RACI của các phân hệ được tổng hợp trong Bảng 2.1.

**Bảng 2.1: Ma trận phân công trách nhiệm theo phân hệ**

| Phân hệ / Hạng mục | Sinh viên – Cart & Order | Auth | Merchant | Driver | Review / QA |
| --- | :---: | :---: | :---: | :---: | :---: |
| Xác thực, JWT, phân quyền | I | R/A | C | I | C |
| Quản lý nhà hàng, danh mục, món ăn | C | I | R/A | I | C |
| Giỏ hàng và quy tắc một nhà hàng | **R/A** | C | C | I | C |
| Coupon, subtotal, delivery fee, grand total | **R/A** | I | C | C | C |
| Checkout và tạo `Order` snapshot | **R/A** | C | C | C | C |
| Lịch sử, chi tiết, hủy, reorder | **R/A** | C | C | I | C |
| Cập nhật trạng thái phía nhà hàng | C | I | R/A | C | C |
| Phân công và theo dõi giao hàng | C | I | C | R/A | C |
| Socket.IO / đồng bộ trạng thái | **R** | C | C | C | A |
| Đánh giá sau giao hàng | C | I | C | I | R/A |
| Kiểm thử tích hợp và nghiệm thu contract | R | C | C | C | **R/A** |

Các nhiệm vụ và kết quả bàn giao chính được tổng hợp trong Bảng 2.2.

**Bảng 2.2: Nhiệm vụ và kết quả bàn giao**

| Phân hệ | Chức năng chính | Công nghệ liên quan | Kết quả bàn giao |
| --- | --- | --- | --- |
| Auth | Đăng ký, đăng nhập, refresh token, xác thực email, RBAC | React/TypeScript, Express, JWT, MongoDB | API auth, middleware `verifyToken`, contract user/role |
| Menu / Nhà hàng | Tra cứu nhà hàng, danh mục, món ăn, giá, availability | React, Express, Mongoose, Zod | Public menu API, owner API, schema `Restaurant`/`MenuItem` |
| Giỏ hàng | CRUD, giới hạn một nhà hàng, coupon, tính tổng | React Context, TypeScript, Express, Mongoose, Zod | `cartRoutes`, `cartService`, `Cart`, client `cartService` |
| Xử lý đơn hàng | Checkout, snapshot, lịch sử, hủy, reorder, payment hand-off | Express, Mongoose, VNPAY, Socket.IO | `orderRoutes`, `orderService`, `Order`, order API contract |
| Điều phối giao hàng | Nhận đơn, phân công tài xế, delivery status | REST/WebSocket, provider giao hàng | Driver API/event contract; hiện chưa có service độc lập |
| Đánh giá / QA | Review và kiểm thử contract | React, Express, Mongoose, Zod, CI | Review API, test scenario và danh sách lỗi |

Ranh giới giao tiếp của module Cart & Order được mô tả trong Bảng 2.3.

**Bảng 2.3: Ranh giới và interface của module Cart & Order**

| Bên giao tiếp | Interface / dữ liệu | Mục đích và quy tắc |
| --- | --- | --- |
| Auth → Cart & Order | `Authorization`, `userId`, `role`, verified email | `cartRoutes` và `orderRoutes` dùng `verifyToken`; checkout, reorder, hủy và review yêu cầu email đã xác thực. |
| Merchant → Cart & Order | `Restaurant`, `MenuItem`, `basePrice`, `salePrice`, `isAvailable`, `delivery.fee` | Kiểm tra món tồn tại, thuộc đúng nhà hàng và dùng giá tại thời điểm thêm vào cart. |
| Client → Cart API | `GET/POST /api/cart`, `PATCH/DELETE /api/cart/items/:menuItemId`, `DELETE /api/cart` | Cập nhật cart; khác nhà hàng trả conflict `409` hoặc thay thế khi người dùng xác nhận. |
| Client → Checkout API | `POST /api/cart/calculate-checkout`, `POST /api/orders/checkout` | Tính `deliveryFee`, `finalTotal`, sau đó tạo snapshot order. |
| Cart & Order → Payment | `paymentMethod`, `paymentStatus`, `paymentUrl` | COD tạo đơn; VNPAY trả URL chuyển hướng và có safety-net tự hủy đơn quá hạn. |
| Merchant → Order | `PATCH /api/owner/restaurants/:restaurantId/orders/:orderId/status` | Chuyển trạng thái theo transition hợp lệ. |
| Order → Customer / Merchant | Socket.IO `order:updated` tới `order:{orderId}` | Phát sau `Order.save()`; client dùng reconnect và REST resync. |
| Cart & Order → Driver | Order snapshot, địa chỉ, `deliveryFee`, `delivering` | Interface dự kiến; cần chốt event/API contract trước khi triển khai driver service. |
| Order → Review | `orderId`, `customerId`, `orderStatus = delivered` | Chỉ cho phép đánh giá đối với đơn hợp lệ đã hoàn tất. |

Rủi ro tích hợp chính gồm thay đổi field của `MenuItem`, thiếu `delivery.fee`, khác biệt enum trạng thái Driver và Order, event đến trước khi dữ liệu được ghi, hai actor cùng cập nhật một order, payment callback không đồng bộ và thay đổi schema không được thông báo. Biện pháp kiểm soát là version hóa contract, schema validation, contract test, REST resynchronization, conditional update và Pull Request bắt buộc cập nhật tài liệu liên quan.

## 2.3. Yêu cầu chi tiết đối với phân hệ phụ trách

Trong hệ thống thương mại điện tử F&B, Cart và Order là phân hệ chuyển đổi trực tiếp từ nhu cầu thành giao dịch có giá trị. Phân hệ phải xử lý đồng thời giá món, phí giao hàng, coupon, địa chỉ, phương thức thanh toán và trạng thái vận hành. Một sai lệch nhỏ có thể dẫn đến chênh lệch số tiền, tạo trùng đơn hoặc hiển thị trạng thái không thống nhất.

Bốn Use Case cốt lõi gồm: UC-01 quản lý giỏ hàng; UC-02 kiểm tra hợp lệ và tính chi phí; UC-03 khởi tạo đơn hàng và khóa giao dịch; UC-04 cập nhật và theo dõi trạng thái realtime. Sơ đồ Use Case được trình bày tại Hình 2.2.

[Mermaid diagram](diagrams/hinh-2-2-use-case-cart-order.mmd)

<div align="center"><strong><em>Hình 2.2: Sơ đồ ca sử dụng phân hệ Quản lý Giỏ hàng và Đơn hàng</em></strong></div>

Danh mục yêu cầu chức năng được tổng hợp trong Bảng 2.4.

**Bảng 2.4: Tổng hợp Functional Requirements**

| Mã | Yêu cầu | Tiêu chí kiểm chứng | Ưu tiên |
| --- | --- | --- | :---: |
| FR-01 | Xem cart | `GET /api/cart` trả cart đúng `userId`; cart rỗng có totals bằng `0`. | Must |
| FR-02 | Thêm món | Kiểm tra ObjectId, quantity nguyên dương, món tồn tại và đúng `restaurantId`. | Must |
| FR-03 | Một nhà hàng | Món khác nhà hàng trả `409`, hỗ trợ `replace=true`. | Must |
| FR-04 | Sửa số lượng | `PATCH` cập nhật quantity; `<= 0` được quy ước là xóa. | Must |
| FR-05 | Xóa món / cart | Xóa item hoặc toàn bộ cart và trả response phù hợp. | Must |
| FR-06 | Topping / ghi chú món | Bổ sung `selectedOptions` và `note` vào CartItem và Order snapshot. | Should |
| FR-07 | Tính giá | Tính `subtotal`, `discountAmount`, `grandTotal` từ dữ liệu server. | Must |
| FR-08 | Voucher | Kiểm tra status, thời hạn, ngưỡng đơn và mức giảm tối đa. | Must |
| FR-09 | Phí checkout | Trả `deliveryFee` và `finalTotal` từ cart/restaurant. | Must |
| FR-10 | Order snapshot | Lưu customer, restaurant, item, coupon, pricing và status history. | Must |
| FR-11 | Chống checkout trùng | Dùng `Idempotency-Key` ổn định; hiện `checkoutKey` vẫn do server sinh mới. | Should |
| FR-12 | Thanh toán | Hỗ trợ COD và tạo `paymentUrl` cho VNPAY. | Must |
| FR-13 | Lịch sử / chi tiết | Phân trang lịch sử; chỉ chủ order được xem chi tiết. | Must |
| FR-14 | Hủy / reorder | Chỉ hủy `pending`; reorder kiểm tra restaurant và availability. | Must |
| FR-15 | Merchant status | Owner cập nhật theo transition hợp lệ. | Must |
| FR-16 | Realtime | Emit `order:updated` sau save; reconnect, join lại và REST resync. | Must |
| FR-17 | Review | Rating 1–5, content 3–1000 ký tự, chỉ với đơn đủ điều kiện. | Should |
| FR-18 | Driver integration | Chuẩn hóa event/API bàn giao order và delivery status. | Could |
| FR-19 | Tự hủy VNPAY | Hủy đơn `pending/unpaid` quá hạn và phát cập nhật. | Should |
| FR-20 | Inventory | Kiểm tra và decrement tồn kho nguyên tử nếu bổ sung `stock`. | Should |

Các Use Case và trạng thái hiện tại được tổng hợp trong Bảng 2.5.

**Bảng 2.5: Tổng hợp Use Case và hiện trạng**

| Use Case | Luồng chính | Ngoại lệ quan trọng | Hiện trạng |
| --- | --- | --- | --- |
| UC-01 Cart | Add, update, remove, recalculate totals | ID sai, quantity sai, khác restaurant, cart không tồn tại | Đã có logic chính; topping và ghi chú món chưa được ánh xạ từ Cart. |
| UC-02 Pricing | Đọc cart, tính subtotal, revalidate coupon, đọc delivery fee | Cart rỗng, coupon hết hạn, thiếu phí giao hàng | Đã có; `addressId` hiện chưa làm thay đổi phí. |
| UC-03 Checkout | Xác thực, dựng snapshot, lưu order, xóa cart, payment | Thiếu địa chỉ/payment, email chưa verify, duplicate, lỗi DB | Đã có snapshot và clear cart; chưa có transaction, idempotency đầy đủ và `CouponUsage`. |
| UC-04 Realtime | Owner đổi status, save, emit, client cập nhật, reconnect/resync | Transition sai, mất socket, sai quyền room | Customer flow đã có; merchant room `join:restaurant` còn thiếu. |

Các endpoint và cơ chế kiểm tra hiện tại được nêu trong Bảng 2.6.

**Bảng 2.6: API endpoint và cơ chế validation/authorization**

| Endpoint | Chức năng | Kiểm tra hiện tại |
| --- | --- | --- |
| `GET /api/cart` | Lấy cart | `verifyToken`; truy vấn theo `req.user.userId`. |
| `POST /api/cart` | Thêm món | ObjectId, quantity, món tồn tại và đúng restaurant; chưa có Zod schema route. |
| `PATCH /api/cart/items/:menuItemId` | Sửa quantity | `quantity <= 0` là xóa; chưa giới hạn kiểu/số lượng đầy đủ bằng Zod. |
| `DELETE /api/cart/items/:menuItemId` | Xóa item | Kiểm tra param và cart của user. |
| `DELETE /api/cart` | Xóa cart | `verifyToken`; cart không tồn tại vẫn xem là thành công. |
| `POST /api/cart/apply-coupon` | Áp voucher | Kiểm tra code, status, thời hạn, min order và discount cap. |
| `POST /api/cart/calculate-checkout` | Tính phí | Đọc `restaurant.delivery.fee`; `addressId` chưa được dùng để tính phí. |
| `GET /api/orders` | Lịch sử | `verifyToken`, phân trang, limit tối đa `50`. |
| `POST /api/orders/checkout` | Tạo order | `verifyToken` + `requireVerifiedEmail`; chưa có schema Zod đầy đủ, `Idempotency-Key` và `CouponUsage`. |
| `GET /api/orders/:id` | Chi tiết | Kiểm tra ObjectId và ownership theo `customerId`. |
| `POST /api/orders/:id/cancel` | Hủy order | Email verified, reason bắt buộc, chỉ hủy `pending`. |
| `POST /api/orders/:orderId/reorder` | Reorder | Kiểm tra restaurant approved/open và availability món. |
| `PATCH /api/owner/restaurants/:restaurantId/orders/:orderId/status` | Owner đổi status | Role, ownership, Zod enum và transition hợp lệ. |

Các yêu cầu phi chức năng và cách kiểm chứng được tổng hợp trong Bảng 2.7. Các giá trị target trong bảng là tiêu chí nghiệm thu đề xuất.

**Bảng 2.7: Tổng hợp Non-Functional Requirements**

| Mã | Nhóm | Target | Phương pháp kiểm chứng |
| --- | --- | --- | --- |
| NFR-01 | API performance | p95 `< 200 ms` trong tải chuẩn | k6/Artillery; đo p50, p95, p99 từng endpoint. |
| NFR-02 | Throughput | 100 RPS read và 30 RPS checkout | Test 5–10 phút, theo dõi latency, error rate, CPU/RAM. |
| NFR-03 | Concurrency | Không quá một order với cùng idempotency key | 50–100 request đồng thời và đối chiếu Order thực tế. |
| NFR-04 | Data consistency | Over-selling `0` khi có stock | Atomic conditional update hoặc reservation transaction. |
| NFR-05 | Atomicity | Không tách rời Order–Cart sau lỗi | Fault injection giữa save order và clear cart. |
| NFR-06 | Realtime | p95 `order:updated` `< 1 s` sau commit cùng instance | Timestamp server/client trong integration test. |
| NFR-07 | Availability | Reconnect tối đa 5 lần; REST resync thành công `>= 99%` | Ngắt mạng có kiểm soát và kiểm tra trạng thái cuối. |
| NFR-08 | Graceful degradation | REST vẫn cung cấp trạng thái chuẩn khi WebSocket mất | Chặn Socket.IO, gọi `GET /api/orders/:id`. |
| NFR-09 | Authentication | 100% private request sai JWT bị từ chối | Test thiếu, giả, hết hạn và user locked. |
| NFR-10 | Authorization | Unauthorized access `0%` | Test IDOR với user/owner khác. |
| NFR-11 | Input validation | 100% payload sai bị chặn trước DB | Fuzz ObjectId, quantity, regex và NoSQL operator. |
| NFR-12 | Auditability | Mỗi transition có actor, role, timestamp, before/after | Kiểm tra `statusHistory` và correlation log. |
| NFR-13 | Reliability | Side effect lỗi không làm mất Order đã commit | Mock provider lỗi và kiểm tra retry/log. |

Các yêu cầu chức năng cơ bản có tính khả thi cao với Express, TypeScript, Mongoose/MongoDB và Socket.IO. Khoảng cách chính tới mức production là validation nhất quán, transaction, idempotency, inventory concurrency và authorization cho merchant room. Thứ tự ưu tiên là bổ sung schema validation và contract test, sau đó transaction/idempotency, inventory atomic update, `join:restaurant` và benchmark.

# CHƯƠNG 3: CƠ SỞ KỸ THUẬT, THIẾT KẾ VÀ GIẢI PHÁP THỰC HIỆN

## 3.1. Các công nghệ và giải pháp liên quan

Hệ thống sử dụng monorepo npm workspaces gồm customer web, owner/admin dashboard và API server. Frontend dùng React, TypeScript, Vite và React Router; backend dùng Express 5, TypeScript và Mongoose; MongoDB lưu dữ liệu nghiệp vụ. JWT được dùng cho xác thực request và Socket.IO handshake. Socket.IO cung cấp kênh cập nhật trạng thái gần realtime; VNPAY xử lý chuyển hướng thanh toán; Docker Compose và Caddy phục vụ đóng gói, reverse proxy và TLS.

MongoDB phù hợp với Order document chứa snapshot, item và status history vì có thể đọc chi tiết một đơn trong một document. Mongoose cung cấp schema validation, enum, `required`, `min`, index và populate logic. Express route/controller/service/repository giúp tách trách nhiệm, còn React Context và API service giúp đồng bộ cart ở phía client.

RESTful API được dùng cho thao tác cần nguồn dữ liệu chuẩn như CRUD cart, checkout, lịch sử, chi tiết và resynchronization. Socket.IO được dùng cho thông báo thay đổi trạng thái. Đây là mô hình kết hợp event-driven update với REST recovery: event tối ưu tốc độ cảm nhận, REST bảo đảm khả năng khôi phục khi kết nối bị gián đoạn.

## 3.2. Kiến trúc giải pháp và thiết kế hệ thống

Luồng checkout cần phối hợp client, Express route, middleware, controller, service, repository/model, MongoDB, payment và side effect. Kiến trúc phân tầng hiện tại và ranh giới transaction mục tiêu được trình bày tại Hình 3.1.

[Mermaid diagram](diagrams/hinh-3-1-kien-truc-phan-tang-cart-order.mmd)

<div align="center"><strong><em>Hình 3.1: Kiến trúc phân tầng xử lý Cart và Order</em></strong></div>

Vai trò các tầng được tổng hợp trong Bảng 3.1.

**Bảng 3.1: Trách nhiệm các tầng trong kiến trúc**

| Tầng | Thành phần | Trách nhiệm |
| --- | --- | --- |
| Client | `client/src/services/orderService.ts` | Gửi payload checkout, nhận mã đơn và `paymentUrl`. |
| Route / API | `app.ts`, `orderRoutes.ts` | Mount `/api/orders`, xác thực và định tuyến `/checkout`. |
| Middleware | `authMiddleware.ts`, `validateMiddleware.ts` | JWT, trạng thái tài khoản, email và validation. |
| Controller | `orderController.ts` | Kiểm tra payload tối thiểu, gọi service và chuyển lỗi. |
| Service | `orderService.ts`, `cartService.ts` | Dựng snapshot, tính giá, kiểm tra coupon và tạo order. |
| Repository / Model | `cartRepository.ts`, `orderRepository.ts`, Mongoose models | Đọc/ghi document và index. |
| Database | MongoDB | Lưu document, unique index và durability. |
| Side effect | `paymentService.ts`, `emailService.ts`, `socketService.ts` | Payment URL, email và event sau commit. |

Thiết kế dữ liệu phải bảo toàn lịch sử order kể cả khi menu hoặc restaurant thay đổi. Vì vậy, `Cart` giữ dữ liệu tạm thời, còn `Order` lưu `customerSnapshot`, `restaurantSnapshot`, `recipient`, `items`, `couponSnapshot`, `pricing` và `statusHistory`.

Lược đồ các collection và embedded subdocument được trình bày tại Hình 3.2.

[Mermaid diagram](diagrams/hinh-3-2-erd-cart-order.mmd)

<div align="center"><strong><em>Hình 3.2: Lược đồ quan hệ thực thể phân hệ Giỏ hàng và Đơn hàng</em></strong></div>

Các trường quan trọng của thực thể chính được tổng hợp trong Bảng 3.2.

**Bảng 3.2: Từ điển dữ liệu cốt lõi**

| Thực thể | Trường tiêu biểu | Ý nghĩa |
| --- | --- | --- |
| `Cart` | `userId`, `restaurantId`, `items`, `subtotal`, `discountAmount`, `grandTotal`, `couponId` | Giỏ tạm thời của một customer, chỉ gắn với một restaurant. |
| `CartItem` | `menuItemId`, `quantity`, `price` | Món và giá được chụp tại thời điểm thêm vào cart. |
| `Order` | `orderNumber`, `checkoutKey`, `customerId`, `restaurantId`, `items`, `pricing`, `paymentStatus`, `orderStatus` | Chứng từ đơn hàng và trạng thái vòng đời. |
| `OrderItemSnapshot` | `menuItemId`, `name`, `baseUnitPrice`, `finalUnitPrice`, `lineTotal`, `selectedOptions`, `note` | Snapshot dòng món, độc lập với menu hiện tại. |
| `StatusHistory` | `from`, `to`, `changedBy`, `changedByRole`, `reason`, `note`, `changedAt` | Nhật ký audit của state transition. |
| `Coupon` | `code`, `discountType`, `discountValue`, `minOrderAmount`, `maxDiscountAmount`, `startsAt`, `endsAt`, `status` | Quy tắc mã giảm giá. |
| `CouponUsage` | `couponId`, `customerId`, `orderId`, `status` | Theo dõi việc sử dụng coupon; checkout hiện chưa ghi document này. |

Các khóa logic dùng `ObjectId` và `ref`, không phải foreign key vật lý. `Order.orderNumber`, `Coupon.code` và compound index `{ customerId: 1, checkoutKey: 1 }` có unique constraint. Order có index hỗ trợ lịch sử customer, dashboard restaurant, payment status và tác vụ nền. Cart chưa có index riêng dù thường truy vấn theo `userId`; đây là điểm cần cải thiện.

Thiết kế sử dụng denormalization có mục đích. `CartItem` và `StatusHistory` được nhúng vì thường đọc cùng document cha; `OrderItemSnapshot`, `customerSnapshot`, `restaurantSnapshot` và `couponSnapshot` được nhúng để bảo toàn chứng từ lịch sử. Đây không phải mô hình quan hệ 3NF thuần túy. MongoDB giới hạn mỗi document ở 16 MB, do đó cần giới hạn kích thước item, ghi chú và lịch sử khi dữ liệu tăng.

Về toàn vẹn dữ liệu, MongoDB bảo đảm atomicity ở mức document; Mongoose bảo vệ kiểu, enum, required, min và unique index. Tuy nhiên, `Order.save()` và `clearCart()` hiện là hai thao tác tách rời. Transaction mục tiêu cần gộp tạo Order, trừ inventory, ghi `CouponUsage` và xóa cart; email, payment callback và Socket.IO nên chạy sau commit thông qua retry/outbox.

## 3.3. Hiện thực hóa các tính năng cốt lõi

Tạo đơn là điểm hội tụ của cart, coupon, restaurant, menu, user, payment và trạng thái. Luồng hiện tại đọc cart, dựng snapshot, lưu order, xóa cart và xử lý side effect; luồng mục tiêu bổ sung transaction, inventory và idempotency.

Các bước tính toán giá trị đơn hàng gồm: đọc cart theo `userId`; tính `subtotal` từ `price × quantity`; revalidate coupon theo `status`, thời hạn, `minOrderAmount`, discount type và `maxDiscountAmount`; đọc `restaurant.delivery.fee`; tính `deliveryFee`, `discountAmount` và `grandTotal`; tạo snapshot từ dữ liệu server. Client không được quyết định `grandTotal`.

Endpoint thực tế để tạo đơn là `POST /api/orders/checkout`, không phải `POST /api/orders`. Request yêu cầu JWT, email đã xác minh, `paymentMethod`, `deliveryAddress` và có thể có `note`. Response thành công là `201`; VNPAY có thể trả `paymentUrl`. `checkoutKey` hiện được server sinh mới cho mỗi request nên chưa chống retry trùng theo đúng nghĩa idempotency.

Hình 3.3 mô tả luồng checkout mục tiêu và đánh dấu các bước chưa có trong hiện trạng.

[Mermaid diagram](diagrams/hinh-3-3-sequence-checkout.mmd)

<div align="center"><strong><em>Hình 3.3: Biểu đồ tuần tự luồng xử lý giao dịch tạo đơn hàng</em></strong></div>

Hiện trạng checkout chưa có `startSession()`/`withTransaction()`, chưa có field stock trong `MenuItem`, chưa kiểm tra lại đầy đủ trạng thái restaurant trong `createOrderFromCart`, chưa ghi `CouponUsage` và chưa xử lý header `Idempotency-Key`. Đây là các khoảng cách giữa implementation hiện tại và thiết kế production.

Mã giả transaction đề xuất được rút gọn như sau:

```ts
async function createOrderFromCart(userId, payload, idempotencyKey) {
  const session = await mongoose.startSession()
  try {
    let result
    await session.withTransaction(async () => {
      const previous = await Order.findOne({
        customerId: userId,
        idempotencyKey,
      }).session(session)
      if (previous) {
        result = toCheckoutResponse(previous)
        return
      }

      const cart = await Cart.findOne({ userId }).session(session)
      assertCartIsNotEmpty(cart)
      const restaurant = await findAvailableRestaurant(cart.restaurantId, session)
      const menuItems = await findAvailableItems(cart.items, restaurant._id, session)
      const coupon = await revalidateCoupon(cart.couponId, userId, session)
      const pricing = calculateServerSidePricing({ cart, menuItems, coupon, restaurant })
      await decrementStockAtomically(cart.items, session)
      const order = await Order.create([buildOrderSnapshot({
        userId, cart, restaurant, menuItems, coupon, pricing, idempotencyKey,
      })], { session })
      await recordCouponUsageIfNeeded(coupon, userId, order[0]._id, session)
      await Cart.deleteOne({ _id: cart._id, userId }, { session })
      result = toCheckoutResponse(order[0])
    })
    await enqueuePostCommitSideEffects(result)
    return result
  } finally {
    await session.endSession()
  }
}
```

Với trạng thái đơn hàng, owner được phép chuyển `pending → confirmed/cancelled`, `confirmed → preparing/cancelled`, `preparing → delivering` và `delivering → delivered`. Customer chỉ được hủy khi order còn `pending`. Mỗi transition hợp lệ phải ghi `statusHistory` trước khi phát event. Để tránh race condition, cần thay thao tác đọc–sửa–save bằng conditional update hoặc optimistic locking.

Cơ chế realtime dùng namespace mặc định của Socket.IO. Client gửi JWT trong handshake; server xác thực token, đọc user và cho phép join `order:{orderId}` nếu user là chủ order hoặc owner của restaurant. `emitOrderUpdate` phát `order:updated` sau khi `Order.save()` hoàn tất tới room order và room restaurant. Server hiện chưa có listener `join:restaurant`, vì vậy merchant realtime chưa hoàn chỉnh.

Hình 3.4 mô tả event-driven architecture và cơ chế reconnect/resync.

[Mermaid diagram](diagrams/hinh-3-4-realtime-order-status.mmd)

<div align="center"><strong><em>Hình 3.4: Sơ đồ luồng sự kiện đồng bộ trạng thái đơn hàng thời gian thực</em></strong></div>

Danh mục endpoint và event cốt lõi được tổng hợp trong Bảng 3.3.

**Bảng 3.3: Endpoint và event của phân hệ Cart & Order**

| Loại | Tên | Vai trò |
| --- | --- | --- |
| REST | `GET/POST /api/cart` | Đọc và thêm món vào cart. |
| REST | `PATCH/DELETE /api/cart/items/:menuItemId` | Sửa hoặc xóa item. |
| REST | `POST /api/cart/apply-coupon` | Revalidate coupon và tính discount. |
| REST | `POST /api/cart/calculate-checkout` | Tính `deliveryFee` và `finalTotal`. |
| REST | `POST /api/orders/checkout` | Tạo Order snapshot và payment hand-off. |
| REST | `GET /api/orders`, `GET /api/orders/:id` | Lịch sử và chi tiết order. |
| REST | `POST /api/orders/:id/cancel` | Customer hủy order `pending`. |
| REST | `POST /api/orders/:orderId/reorder` | Đưa món khả dụng của order cũ vào cart. |
| REST | `PATCH /api/owner/restaurants/:restaurantId/orders/:orderId/status` | Owner chuyển trạng thái. |
| Socket | `join:order` | Kiểm tra quyền và join room order. |
| Socket | `order:updated` | Phát `OrderDetail` sau khi save. |
| Socket | `connect`, `connect_error`, `disconnect` | Theo dõi lifecycle kết nối. |
| Socket | `join:restaurant` | Chưa triển khai; cần bổ sung cho dashboard merchant. |

So với HTTP Polling, Socket.IO giảm request lặp khi không có thay đổi và phù hợp hơn với trạng thái đơn hàng. Tuy nhiên, Socket.IO cần quản lý handshake, room, reconnect và adapter khi scale ngang. Các con số độ trễ 50–150 ms hoặc p95 realtime `< 1 s` chỉ là mục tiêu/ước lượng kiến trúc, không phải benchmark đã chạy.

So sánh các cơ chế đồng bộ được trình bày trong Bảng 3.4.

**Bảng 3.4: So sánh WebSocket, Polling và Long-polling**

| Tiêu chí | WebSocket/Socket.IO | HTTP Polling | HTTP Long-polling |
| --- | --- | --- | --- |
| Request khi không có thay đổi | Gần như không có ở application layer | Cao theo chu kỳ | Thấp hơn polling nhưng giữ request mở |
| Cập nhật hai chiều | Có | Không tự nhiên | Không tự nhiên |
| Reconnect | Có hỗ trợ; ứng dụng phải rejoin/resync | Request tiếp theo tự khôi phục | Client xử lý timeout và request mới |
| Độ phức tạp | Cao hơn do auth, room, scale-out | Đơn giản | Trung bình |
| Phù hợp order status | Phù hợp nhất | Fallback đơn giản | Fallback khi WebSocket bị chặn |
| Giới hạn hiện tại | Thiếu `join:restaurant`, Redis Adapter và optimistic locking | Tăng request và độ trễ | Tăng request pending và timeout |

Kết luận kỹ thuật là Socket.IO phù hợp hơn Polling cho status synchronization. Implementation hiện tại đã có JWT handshake, room order và reconnect/resync ở customer client; ưu tiên tiếp theo là hoàn thiện room merchant, projection authorization, acknowledgement, fallback polling và Redis Adapter.

## 3.4. So sánh và đánh giá giải pháp

Giải pháp hiện tại có ưu điểm là tách lớp rõ ràng, dùng server-side pricing, lưu order snapshot, kiểm soát state transition và kết hợp event với REST recovery. Thiết kế document-oriented giúp đọc order detail trong một document và phù hợp với embedded item/history. Các index của Order hỗ trợ lịch sử customer và dashboard restaurant.

Hạn chế chính là checkout chưa atomic xuyên document, inventory chưa tồn tại, idempotency chưa được client kiểm soát, state transition chưa compare-and-swap, merchant room chưa có listener và event hiện gửi toàn bộ `OrderDetail`. Cart cũng chưa có index riêng dù truy vấn thường xuyên theo `userId`.

Đánh giá các tiêu chí giải pháp được tổng hợp trong Bảng 3.5.

**Bảng 3.5: Đánh giá giải pháp hiện tại và hướng hoàn thiện**

| Tiêu chí | Hiện trạng | Đánh giá |
| --- | --- | --- |
| Tính đúng giá | Server tính subtotal, discount, delivery fee và snapshot | Đạt ở mức logic hiện có |
| Lịch sử order | Snapshot item, customer, restaurant, coupon | Đạt; có denormalization có mục đích |
| Checkout atomicity | `Order.save()` và `clearCart()` tách rời | Chưa đạt; cần transaction |
| Chống đặt trùng | Unique index có, nhưng key được sinh mới mỗi request | Chưa đầy đủ; cần `Idempotency-Key` |
| Inventory | Chưa có `stockQuantity` và decrement | Chưa triển khai |
| State transition | Có state machine và history | Đạt tĩnh; cần concurrency test |
| Customer realtime | JWT, `join:order`, `order:updated`, REST resync | Đạt một phần/đủ cho flow customer hiện tại |
| Merchant realtime | Emit room restaurant nhưng thiếu listener join | Chưa hoàn thiện |
| Khả năng scale ngang | Express stateless; Socket.IO chưa có Redis Adapter | Có nền tảng; cần adapter |
| Đo hiệu năng | Chưa có benchmark server | Chưa xác minh |

Mục tiêu p95 `< 200 ms` cho checkout chỉ có thể xác nhận bằng benchmark với MongoDB, payload, CPU/RAM, vị trí database và trạng thái warm-up được nêu rõ. Không được suy diễn latency từ việc code có ít bước. Tương tự, tỷ lệ pass API, độ ổn định WebSocket và throughput hiện chưa có bằng chứng runtime.

# CHƯƠNG 4: HƯỚNG DẪN CÀI ĐẶT VÀ VẬN HÀNH HỆ THỐNG

## 4.1. Môi trường phát triển và yêu cầu phần cứng/phần mềm

Hệ thống là monorepo gồm customer web, dashboard vận hành và API server. Mỗi thành phần có dependency, port và biến môi trường riêng nhưng được quản lý tập trung bằng npm workspaces. `package-lock.json`, Docker multi-stage build, Docker Compose và CI giúp giảm khác biệt giữa local, CI và VPS.

Các phiên bản thực tế được xác định từ repository được tổng hợp trong Bảng 4.1.

**Bảng 4.1: Thông số phần mềm được xác định từ repository**

| Công cụ / thành phần | Phiên bản hoặc trạng thái | Mục đích |
| --- | --- | --- |
| Node.js local | `20.19+` hoặc `22.12+` theo root `package.json` | Runtime monorepo |
| Node.js CI/Docker | Node.js `22`; `node:22-alpine` cho frontend, `node:22-bookworm-slim` cho server | Build và production |
| npm | `10+`, lockfile version `3` | Dependency và workspaces |
| Frontend customer | React `19.2.8`, Vite `8.2.0`, React Router `7.2.0` | Customer web |
| Frontend dashboard | React `19.0.0`, Vite `6.1.0`, React Router `7.1.5` | Owner/Admin |
| Backend | Express `5.2.1`, TypeScript | HTTP API |
| Database client | Mongoose `9.9.1` | MongoDB access |
| Database server | MongoDB; version server chưa pin | Dữ liệu nghiệp vụ |
| Realtime | Socket.IO `4.8.3` | Auth handshake và order update |
| Reverse proxy | Caddy `2.10-alpine` | TLS và routing |
| Static server | Nginx `1.29-alpine` | Frontend runtime image |
| CI/CD | GitHub Actions, Ubuntu, Node 22, Docker Buildx | Quality gate và publish image |
| PostgreSQL / Redis | Không được cấu hình | Không thuộc kiến trúc hiện tại |

Repository không khai báo quota CPU, RAM hoặc disk. Sizing vận hành khuyến nghị cho VPS nhỏ được trình bày trong Bảng 4.2 và không được hiểu là hard requirement từ mã nguồn.

**Bảng 4.2: Cấu hình phần cứng thử nghiệm và khuyến nghị**

| Tài nguyên | Tối thiểu tải thấp | Khuyến nghị demo / production nhỏ | Cơ sở |
| --- | --- | --- | --- |
| CPU | 2 vCPU | 4 vCPU | API, Caddy, hai frontend |
| RAM | 2 GB | 4 GB trở lên | Container runtime và API |
| Disk | 20 GB SSD | 40 GB SSD trở lên | Image, log, certificate |
| Network | 1 Mbps, mở `80/443` | 5 Mbps trở lên | HTTPS, API, Socket.IO |
| Database | MongoDB local hoặc managed | MongoDB managed có backup | Dữ liệu không lưu trong app container |

Các biến môi trường quan trọng được tổng hợp trong Bảng 4.3.

**Bảng 4.3: Từ điển biến môi trường**

| Biến | Phạm vi | Ý nghĩa |
| --- | --- | --- |
| `NODE_ENV` | Server | Chế độ chạy và guard secret |
| `PORT` | Server | Port Express, mặc định `3000` |
| `MONGODB_URI` | Server | MongoDB connection string |
| `MONGODB_DB_NAME` | Server | Tên database, ví dụ `food_ordering` |
| `CLIENT_ORIGINS` | Server | Danh sách origin CORS |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | Server | Ký access/refresh token |
| `VNPAY_MODE` | Server | `mock` hoặc `real` |
| `VNP_TMNCODE`, `VNP_HASHSECRET`, `VNP_URL`, `VNP_RETURN_URL` | Server | Cấu hình VNPAY |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Server | Gửi email |
| `VITE_API_BASE_URL` | Frontend | Base URL API, thường là `/api` |
| `VITE_SOCKET_URL` | Customer | Socket origin tùy chọn |
| `DOCKERHUB_USERNAME`, `DOCKERHUB_REPOSITORY`, `RELEASE_TAG` | Deploy | Publish và chọn image |
| `CUSTOMER_DOMAIN`, `DASHBOARD_DOMAIN` | Compose | Domain Caddy |

Secret JWT, VNPAY, SMTP và MongoDB không được commit. `server/src/config/env.ts` validate bằng Zod và fail-fast trong production nếu vẫn dùng giá trị dev mặc định.

## 4.2. Quy trình thiết lập và triển khai mã nguồn

Trước hết, cài Node.js đúng khoảng version, kiểm tra npm và cài dependency từ thư mục gốc để npm workspaces sử dụng đúng lockfile.

```powershell
git clone https://github.com/czx04/fsa-fe-food-ordering.git
Set-Location fsa-fe-food-ordering
node --version
npm --version
npm ci
```

Tiếp theo, tạo file môi trường từ các file mẫu và điều chỉnh tối thiểu `MONGODB_URI`, `MONGODB_DB_NAME`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CLIENT_ORIGINS` cùng cấu hình VNPAY/SMTP nếu cần.

```powershell
Copy-Item server/.env.example server/.env
Copy-Item client/.env.example client/.env
Copy-Item client-dashboard/.env.example client-dashboard/.env
```

Repository hiện không có migration framework hoặc thư mục `migrations/`. Vì vậy không chạy lệnh migration giả định. Hãy khởi động MongoDB, cấu hình `MONGODB_URI` và để Mongoose sử dụng model; production cần backup/snapshot và quy trình migration có version trước khi thay đổi dữ liệu.

Chạy chế độ phát triển bằng:

```powershell
npm run dev
```

Các service mặc định là customer web tại `http://localhost:5173`, owner/admin tại `http://localhost:5174` và API health check tại `http://localhost:3000/api/health`. Có thể chạy riêng `npm run dev:server`, `npm run dev:customer` hoặc `npm run dev:dashboard`.

Đối với triển khai Docker Compose, khởi tạo file deploy, điền domain, Docker Hub namespace, `RELEASE_TAG` và secret production, sau đó pull image và dựng service.

```bash
cp deploy/deploy.env.example deploy/deploy.env
cp deploy/server.env.example deploy/server.env
docker compose --env-file deploy/deploy.env pull
docker compose --env-file deploy/deploy.env up -d
docker compose --env-file deploy/deploy.env ps
```

CI build ba image theo các Dockerfile riêng và tag theo commit SHA. Frontend dùng Node ở build stage và Nginx ở runtime; server dùng Node 22 và chạy `node dist/index.js` bằng user không có quyền root. Caddy chỉ nhận traffic sau khi healthcheck của client, dashboard và server thành công. Quy trình triển khai được trình bày tại Hình 4.1.

[Mermaid diagram](diagrams/hinh-4-1-quy-trinh-trien-khai.mmd)

<div align="center"><strong><em>Hình 4.1: Sơ đồ quy trình thiết lập và triển khai hệ sinh thái dịch vụ</em></strong></div>

Docker tạo ranh giới runtime rõ ràng và hỗ trợ rollback bằng release tag. Hạn chế còn lại là Docker Engine/Compose CLI, MongoDB server và image digest chưa được pin. Production nên dùng release tag bất biến hoặc digest, secret manager, network allowlist, TLS MongoDB, log rotation, backup và migration versioned.

## 4.3. Kết quả giao diện và luồng chạy thực tế

Kiểm thử luồng đặt hàng cần đồng thời xác nhận input API, business rule và đồng bộ Socket.IO. Repository hiện có test frontend dashboard nhưng không có integration/e2e test cho server, `cartService`, `orderService`, `socket.ts` hoặc `socketService`. Lệnh `npm run test --workspace client-dashboard` tại thời điểm khảo sát không chạy được vì `vitest` chưa có trong `node_modules`; do đó không công bố tỷ lệ pass runtime.

Các endpoint và trạng thái kiểm tra tĩnh được tổng hợp trong Bảng 4.4.

**Bảng 4.4: Ma trận endpoint Cart và Order**

| Endpoint | Expected | Kết quả từ mã nguồn | Latency |
| --- | --- | --- | --- |
| `GET /api/cart` | `200` | Trả cart hoặc cart rỗng với totals bằng `0` | Chưa đo |
| `POST /api/cart` | `201`; lỗi `400/404/409` | Kiểm tra ID, quantity, menu và restaurant; chống trộn nhà hàng | Chưa đo |
| `PATCH /api/cart/items/:menuItemId` | `200` | `quantity <= 0` là xóa; validation phân số chưa đầy đủ | Chưa đo |
| `DELETE /api/cart/items/:menuItemId` | `200` | Xóa item, item cuối có thể làm cart rỗng | Chưa đo |
| `POST /api/cart/apply-coupon` | `200`; lỗi `400/404` | Kiểm tra code, active, thời hạn, min order và cap | Chưa đo |
| `POST /api/orders/checkout` | `201`; lỗi `400/403/404/500` | Tạo snapshot, clear cart, COD/VNPAY; không trừ inventory | Chưa đo |
| `GET /api/orders/:id` | `200`; lỗi `400/403/404` | Kiểm tra ObjectId và ownership | Chưa đo |
| `POST /api/orders/:id/cancel` | `200`; lỗi `400/403/404` | Chỉ hủy `pending`, ghi history và emit | Chưa đo |
| `POST /api/orders/:orderId/reorder` | `200`; lỗi `400/404` | Kiểm tra restaurant/menu và trả item unavailable | Chưa đo |
| `PATCH /api/owner/restaurants/:restaurantId/orders/:orderId/status` | `200`; lỗi `400/404/409` | State transition và emit sau save | Chưa đo |

Kịch bản kiểm thử cốt lõi và kết quả hiện tại được tổng hợp trong Bảng 4.5.

**Bảng 4.5: Kịch bản kiểm thử chức năng**

| ID | Kịch bản | Kết quả |
| --- | --- | --- |
| TC-01 | Add, update, remove cart và recalculate totals | Có logic chính; update chưa chặn rõ phân số hoặc `NaN`. |
| TC-01A | Add món khác restaurant không có `replace` | Được triển khai, trả `409`. |
| TC-01B | Add món khác restaurant với `replace=true` | Được triển khai, thay cart cũ. |
| TC-02 | Coupon hợp lệ và checkout COD | Snapshot, coupon, totals và clear cart có; inventory chưa có. |
| TC-02A | Coupon fixed/percentage và max discount | Được triển khai tĩnh trong discount calculation. |
| TC-03 | Item unavailable hoặc hết stock | Inventory chưa triển khai; chưa thể chứng minh chặn oversell. |
| TC-03A | Coupon expired/inactive | Được triển khai; coupon không tồn tại trả `404`. |
| TC-03B | Thiếu address/payment | Controller trả `400`. |
| TC-03C | Email chưa xác thực | `requireVerifiedEmail` trả `403`. |
| TC-04 | Socket handshake và `join:order` | Được triển khai, có kiểm tra ownership/restaurant ownership. |
| TC-04A | Owner đổi status hoặc customer cancel | Emit `order:updated` sau save; merchant room join còn thiếu. |
| TC-04B | Reconnect | Client rejoin room và gọi REST detail để resync. |
| TC-04C | Token thiếu/hết hạn | Handshake bị từ chối qua `connect_error`. |

Luồng checkout thành công hiện tại là: đọc cart; lấy user và restaurant; dựng item snapshot; tính subtotal, delivery fee, discount và grand total; tạo `Order` với `pending`; `save()` order; xóa cart; với COD đặt payment status và gửi email; với VNPAY tạo `paymentUrl`. Luồng này giữ ổn định giá lịch sử nhưng chưa phải transaction MongoDB nguyên tử.

Các hình minh họa giao diện và kết quả runtime cần được chèn sau khi có lần chạy thực tế, có timestamp, endpoint, mã HTTP và dữ liệu test. Hình 4.2 nên thể hiện Cart/Checkout với subtotal, discount, delivery fee và grand total; Hình 4.3 nên thể hiện `POST /api/orders/checkout` trả `201`; Hình 4.4 nên thể hiện merchant status transition; Hình 4.5 nên thể hiện log handshake, `join:order` và event `order:updated`. Không được ghi endpoint `POST /api/orders` vì route thực tế là `/api/orders/checkout`.

Kết quả hiện tại chỉ đủ kết luận rằng các nhánh nghiệp vụ chính có bằng chứng triển khai một phần. Chưa đủ bằng chứng để công bố 100% test case pass, latency `< 200 ms`, throughput mục tiêu hoặc tỷ lệ reconnect. Trước khi công bố chất lượng production cần bổ sung server test runner, database fixture, transaction/rollback test, inventory test, Socket.IO room test và benchmark p95.

# CHƯƠNG 5: KẾT QUẢ ĐẠT ĐƯỢC VÀ HƯỚNG PHÁT TRIỂN

## 5.1. Kết quả đạt được so với mục tiêu ban đầu

Mục tiêu của Cart & Order Processing là hiện thực luồng từ quản lý cart, áp coupon, tính checkout, tạo order, theo dõi trạng thái đến đồng bộ qua Socket.IO. Trong phạm vi chức năng đã xây dựng, module có CRUD cart, giới hạn cart theo restaurant, coupon, checkout tại `POST /api/orders/checkout`, order snapshot, lịch sử, cancel, reorder, owner transition và `order:updated`.

Kết quả đối chiếu mục tiêu và hiện trạng được tổng hợp trong Bảng 5.1.

**Bảng 5.1: Ma trận đối chiếu mục tiêu và kết quả**

| Nhóm tiêu chí | Kết quả thực tế | Đánh giá |
| --- | --- | --- |
| Cart | Add/update/remove, recalculate totals, conflict restaurant `409`, `replace` | Đạt trong phạm vi Use Case cốt lõi |
| Coupon | Kiểm tra code, status, thời hạn, min order, fixed/percentage, cap | Đạt theo kiểm tra tĩnh |
| Checkout | Order snapshot, pricing, COD/VNPAY, clear cart | Đạt chức năng; chưa có inventory |
| Transaction | Chưa có session transaction cho Order–Cart | Chưa đạt; cần phát triển |
| State machine | Transition hợp lệ, history, emit sau save | Đạt theo kiểm tra tĩnh; chưa có concurrency test |
| Customer realtime | JWT handshake, `join:order`, `order:updated`, REST resync | Đạt một phần/đủ cho customer flow |
| Merchant realtime | Emit room restaurant nhưng thiếu `join:restaurant` | Chưa hoàn thiện |
| Latency | Chưa có benchmark | Chưa xác minh |
| Concurrency | Chưa có compare-and-swap/optimistic locking | Chưa đạt đầy đủ |
| CI/CD | CI build, lint, test dashboard và publish Docker image | Đạt ở mức pipeline hiện có |

Nhận định “100% phạm vi triển khai” chỉ phản ánh các chức năng đã xây dựng trong module, không đồng nghĩa với việc các yêu cầu mở rộng như transaction, inventory, horizontal scaling hoặc benchmark đã hoàn tất. `Order` snapshot giúp lịch sử không phụ thuộc vào menu hiện tại; event sau `await order.save()` hạn chế client nhận dữ liệu chưa được ghi.

Về định lượng, chưa thể công bố latency trung bình/p95 của checkout hoặc tỷ lệ ổn định WebSocket. Chương 4 chỉ cung cấp bằng chứng tĩnh về endpoint, guard, state machine, handshake và reconnect/resync. Các chỉ tiêu định lượng phải giữ trạng thái chưa xác minh cho đến khi có benchmark hợp lệ.

## 5.2. Kỹ năng và kiến thức thu thập được

Về kiến thức chuyên môn, em đã thực hành thiết kế các thực thể `Cart`, `Coupon`, `Order`, `Restaurant` và `MenuItem`, sử dụng snapshot để bảo toàn dữ liệu lịch sử, phân tích state transition và nhận diện `Race Condition`. Em cũng phân biệt được lưu tuần tự hiện tại với `Database Transaction` dùng MongoDB session để gộp checkout, inventory decrement và clear cart thành một đơn vị nguyên tử.

Về kiến trúc giao tiếp, em đã triển khai mô hình Event-driven Architecture ở mức Socket.IO: client gửi JWT trong handshake, server xác thực và kiểm soát room, service phát `order:updated` sau khi dữ liệu được lưu, còn client gọi REST để resynchronization sau reconnect. Cách kết hợp event nhanh với REST làm nguồn khôi phục giúp tách tốc độ cập nhật UI khỏi tính đúng đắn của dữ liệu.

Về kỹ năng kỹ thuật, em rèn luyện tổ chức code theo route, controller, service, repository và model; duy trì endpoint, kiểu dữ liệu và `API contract`; sử dụng Git branch, Pull Request, Code Review, CI/CD và Docker. Việc đối chiếu mục tiêu với bằng chứng đo được hình thành tư duy đánh giá hiệu năng dựa trên dữ liệu thay vì cảm nhận.

Về kỹ năng làm việc, em thực hành phân chia phạm vi theo module, phối hợp với Auth, Merchant, Payment, Review và Driver, trao đổi contract và xử lý vấn đề tích hợp. Việc ghi rõ chức năng đã triển khai, chức năng ở mức interface và giới hạn chưa đo được giúp giao tiếp kỹ thuật minh bạch hơn trong review và nghiệm thu.

## 5.3. Hạn chế và hướng phát triển tiếp theo

Hạn chế chính là `Order.save()` và `clearCart()` chưa nằm trong cùng `ACID transaction`; inventory chưa có `stockQuantity` và decrement điều kiện; state transition chưa có optimistic locking; payment/email/socket chưa có outbox hoặc retry thống nhất; merchant room chưa có listener; event gửi toàn bộ `OrderDetail`; test server và benchmark chưa có. Khi chạy nhiều instance Socket.IO, room/event giữa các instance cũng chưa được đồng bộ vì chưa có Redis Adapter.

Hướng phát triển thứ nhất là bổ sung transaction, idempotency và inventory reservation. Client tạo UUID ổn định cho một lần checkout và gửi qua `Idempotency-Key`; backend lưu key cùng customer, request fingerprint và `orderId` trong transaction. Inventory cần atomic conditional update hoặc reservation model; `CouponUsage` cần được ghi cùng transaction và có unique constraint phù hợp.

Hướng phát triển thứ hai là bổ sung Redis Cache cho menu, restaurant và dữ liệu đọc lặp lại, kèm TTL/invalidation. Redis cũng có thể làm Socket.IO Adapter để đồng bộ room/event giữa nhiều API instance. MongoDB vẫn là source of truth; cache không được thay thế authorization hoặc business rule tại server.

Hướng phát triển thứ ba là đưa email, notification, payment workflow, inventory reservation, recommendation và delivery task vào Message Broker như RabbitMQ hoặc Kafka. Cần đi kèm idempotency, retry, dead-letter queue, correlation ID và observability để tránh xử lý trùng hoặc mất event.

Hướng phát triển thứ tư là từng bước tách bounded context thành Order, Payment, Inventory, Merchant và Driver Dispatch khi có bằng chứng scale độc lập. Trước mắt, modular monolith vẫn phù hợp vì giảm chi phí vận hành và giúp nhóm kiểm chứng business rule trước khi phân tán hệ thống.

Kiến trúc mở rộng tương lai được trình bày tại Hình 5.1.

[Mermaid diagram](diagrams/hinh-5-1-kien-truc-mo-rong-tuong-lai.mmd)

<div align="center"><strong><em>Hình 5.1: Đề xuất kiến trúc mở rộng hệ thống trong tương lai</em></strong></div>

Lộ trình ưu tiên là benchmark có kiểm soát cho `POST /api/orders/checkout`, bổ sung integration test cho transaction và Socket.IO room, hoàn thiện schema validation và merchant join contract, sau đó mới triển khai Redis Cache/Adapter và Message Broker. Mỗi thay đổi kiến trúc cần đi kèm chỉ số đánh giá, rollback plan và kiểm chứng tính nhất quán.

**TÀI LIỆU THAM KHẢO**

1. FPT Software, tài liệu và quy trình chương trình Campuslink Front-End.
2. Repository `czx04/fsa-fe-food-ordering`, các thư mục `client/`, `client-dashboard/`, `server/`, `docker/`, `deploy/`, `compose.yaml` và `.github/workflows/`.
3. Tài liệu nội bộ `docs/report/1.0_general_introduction.md`.
4. Tài liệu nội bộ `docs/report/2.2_team_allocation_scope.md`.
5. Tài liệu nội bộ `docs/report/2.3_requirements_specification.md`.
6. Tài liệu nội bộ `docs/report/3.2.2_erd_design.md`.
7. Tài liệu nội bộ `docs/report/3.3.1_order_logic.md`.
8. Tài liệu nội bộ `docs/report/3.3.2_realtime_websocket.md`.
9. Tài liệu nội bộ `docs/report/4.1_4.2_environment_setup.md`.
10. Tài liệu nội bộ `docs/report/4.3_execution_results.md`.
11. Tài liệu nội bộ `docs/report/5.0_results_and_future_work.md`.
12. `report/STYLE_GUIDE.md` và `cau_truc_noi_dung_bao_cao.md`.
