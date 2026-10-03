# Sổ Tay Kỹ Thuật: Ánh Xạ Chi Tiết Thao Tác Dashboard Đến Database Engine

> **Dự án**: UIT CARE — Hệ Thống Quản Lý Bảo Hành & Sửa Chữa Thiết Bị  
> **Nguyên tắc cốt lõi**: "Zero-Trust Data Integrity" — Toàn bộ quy tắc kho vận, phân loại bảo hành, state machine và khóa tài chính đều được thực thi tự động và bảo vệ tuyệt đối ở tầng CSDL (Microsoft SQL Server Engine).

---

## 1. Sơ Đồ Toàn Cảnh Luồng Tương Tác UI ⟷ DB Engine

```mermaid
sequenceDiagram
    autonumber
    actor User as Người dùng (Lễ tân / KTV / Thu ngân / Quản lý)
    participant UI as Web Frontend (Next.js Dashboard)
    participant API as Backend REST API (NestJS Fastify)
    participant DB as SQL Server Engine (SP / Trigger / UDF / Cursor)

    rect rgb(240, 253, 244)
    Note over User,DB: Giai Đoạn 1: Tiếp Nhận & Phân Loại Bảo Hành
    User->>UI: Điền Form tiếp nhận -> Bấm "Tạo phiếu tiếp nhận"
    UI->>API: POST /api/tickets
    API->>DB: EXEC dbo.sp_receive_device
    DB->>DB: Gọi UDF dbo.fn_is_device_under_warranty (Đánh giá bảo hành)
    DB->>DB: INSERT tickets (status = 'received')
    DB-->>DB: Kích hoạt Trigger trg_tickets_audit_history (Ghi log vết khởi tạo)
    DB-->>API: Trả về ticket_id, ticket_code (TCK-...)
    API-->>UI: 201 Created & Hiển thị phiếu tiếp nhận
    end

    rect rgb(254, 249, 195)
    Note over User,DB: Giai Đoạn 2: Chẩn Đoán & Xuất Kho Linh Kiện
    User->>UI: KTV chọn linh kiện thay thế -> Bấm "Thêm vào báo giá"
    UI->>API: POST /api/invoices/:id/items
    API->>DB: EXEC dbo.sp_add_invoice_part @invoice_id, @part_id, @quantity
    DB->>DB: Capture đơn giá kho (parts.price -> invoice_items.unit_price)
    DB->>DB: INSERT INTO invoice_items
    DB-->>DB: Kích hoạt Trigger trg_invoice_items_stock (Trừ parts.stock_quantity; Rollback nếu âm kho: Lỗi 50001)
    DB-->>DB: Kích hoạt Trigger trg_invoices_total_amount (Gọi UDF fn_calculate_parts_total tính lại total_amount)
    DB-->>API: Giao dịch thành công
    API-->>UI: 200 OK & Cập nhật danh sách linh kiện + Tổng tiền
    end

    rect rgb(254, 242, 242)
    Note over User,DB: Giai Đoạn 3: Gỡ Bỏ Linh Kiện Khỏi Báo Giá
    User->>UI: KTV bấm icon Thùng Rác "Xóa linh kiện"
    UI->>API: DELETE /api/invoices/:id/items/:partId
    API->>DB: DELETE FROM dbo.invoice_items WHERE invoice_id = ... AND part_id = ...
    DB-->>DB: Kích hoạt Trigger trg_invoice_items_freeze_paid (Chặn nếu HĐ đã thanh toán: Lỗi 50035)
    DB-->>DB: Kích hoạt Trigger trg_invoice_items_stock (Hoàn trả số lượng về parts.stock_quantity)
    DB-->>DB: Kích hoạt Trigger trg_invoices_total_amount (Tự động giảm total_amount)
    DB-->>API: Xóa thành công
    API-->>UI: 200 OK & Tồn kho phục hồi
    end

    rect rgb(238, 242, 255)
    Note over User,DB: Giai Đoạn 4: Thu Ngân Thanh Toán & Khóa Bất Biến
    User->>UI: Thu ngân chọn phương thức (Tiền mặt/Chuyển khoản) -> Bấm "Xác nhận thanh toán"
    UI->>API: POST /api/invoices/:id/checkout
    API->>DB: EXEC dbo.sp_checkout_invoice @invoice_id, @payment_method
    DB->>DB: UPDATE invoices SET status = 'paid', paid_at = GETDATE()
    DB-->>DB: Kích hoạt Triggers Khóa Bất Biến (trg_invoices_freeze_paid_amounts & trg_invoice_items_freeze_paid)
    DB-->>API: Hóa đơn đã thanh toán
    API-->>UI: 200 OK & Đóng băng toàn bộ hóa đơn
    end
```

---

## 2. Chi Tiết 10 Thao Tác Nghiệp Vụ Trên Dashboard & Ánh Xạ SQL Engine

---

### Quy Trình 1: Tiếp Nhận Thiết Bị Mới
* **Màn hình giao diện**: Phân hệ Lễ tân (`/reception`).
* **Thao tác người dùng**:
  1. Lễ tân nhập Số điện thoại, Họ tên khách hàng.
  2. Nhập thông tin thiết bị: Tên máy, Hãng sản xuất, Số Serial/IMEI, Hạn bảo hành chính hãng.
  3. Nhập mô tả lỗi ban đầu và phụ kiện kèm theo.
  4. Bấm nút **"Tạo phiếu tiếp nhận"** (Nút màu hổ phách/cam đậm).
* **REST API kích hoạt**: `POST /api/tickets`
* **Đối tượng CSDL được thực thi**:
  1. **Stored Procedure `dbo.sp_receive_device`**:
     * Kiểm tra khách hàng: Nếu SĐT đã có $\rightarrow$ lấy `customer_id`; nếu chưa $\rightarrow$ `INSERT dbo.customers`.
     * Kiểm tra thiết bị: Định danh theo `serial_number`, tự động cập nhật hoặc tạo mới trong `dbo.devices`.
     * Tạo phiếu tiếp nhận: `INSERT INTO dbo.tickets (status = 'received', ...)`.
  2. **Scalar Function `dbo.fn_is_device_under_warranty`**:
     * Được SP gọi để so sánh ngày tiếp nhận với hạn bảo hành của thiết bị.
     * Nếu còn hạn $\rightarrow$ gán `ticket_type = 'warranty'` (phiếu bảo hành miễn phí tiền công).
     * Nếu hết hạn $\rightarrow$ gán `ticket_type = 'repair'` (phiếu sửa chữa dịch vụ có tính phí).
  3. **Database Trigger `trg_tickets_audit_history`**:
     * Tự động bắt sự kiện `INSERT` trên bảng `tickets`.
     * Ghi ngay một bản ghi lịch sử vào `dbo.ticket_status_history` với `old_status = NULL`, `new_status = 'received'`.

---

### Quy Trình 2: Kỹ Thuật Viên Nhận Phiếu & Chuyển Trạng Thái
* **Màn hình giao diện**: Bàn làm việc KTV (`/technician`).
* **Thao tác người dùng**:
  1. KTV xem danh sách phiếu được phân công.
  2. Mở dropdown trạng thái chọn: *"Bắt đầu kiểm tra"* (`inspecting`), *"Chờ linh kiện"* (`waiting_for_parts`), hoặc *"Đang sửa chữa"* (`repairing`).
  3. Nhập nguyên nhân lỗi (`fault_cause`) và hướng xử lý (`repair_solution`).
  4. Bấm nút **"Cập nhật tiến độ"**.
* **REST API kích hoạt**: `PATCH /api/tickets/:id/process`
* **Đối tượng CSDL được thực thi**:
  1. **Stored Procedure `dbo.sp_process_ticket`**:
     * Cập nhật `status`, `fault_cause`, `repair_solution` trên bảng `tickets`.
  2. **Database Trigger `trg_tickets_workflow_guard` (Ràng buộc State Machine)**:
     * **Kiểm tra KTV (Mã 50003)**: Nếu chuyển sang trạng thái kỹ thuật mà `technician_id IS NULL`, giao dịch bị `ROLLBACK` lập tức với thông điệp: `Phải phân công kỹ thuật viên trước khi chuyển sang trạng thái này!`.
     * **Kiểm tra thứ tự (Mã 50004)**: Ngăn chặn nhảy cóc thẳng sang `delivered` khi chưa hoàn tất sửa chữa (`completed`).
     * **Bảo vệ phiếu đã bàn giao**: Nếu phiếu đã giao máy cho khách (`status = 'delivered'`), trigger cấm mở lại phiếu.
  3. **Database Trigger `trg_tickets_audit_history`**:
     * Tự động so sánh `old_status` và `new_status`. Ghi vết sự kiện kèm ID của KTV vào `dbo.ticket_status_history`.

---

### Quy Trình 3: Xuất Dùng Linh Kiện Vào Hóa Đơn Báo Giá
* **Màn hình giao diện**: Modal "Chẩn đoán & Chỉ định linh kiện" trên màn hình KTV (`/technician`) hoặc Chi tiết phiếu (`/tickets`).
* **Thao tác người dùng**:
  1. KTV chọn món linh kiện từ kho (ví dụ: *SSD Samsung 980 Pro 1TB*).
  2. Nhập số lượng cần xuất dùng (ví dụ: `2`).
  3. Bấm nút **"Thêm vào báo giá"**.
* **REST API kích hoạt**: `POST /api/invoices/:id/items`
* **Đối tượng CSDL được thực thi**:
  1. **Stored Procedure `dbo.sp_add_invoice_part`**:
     * Kiểm tra trạng thái hóa đơn: Nếu đã thanh toán (`paid`), ném lỗi `50041`.
     * Đọc giá hiện tại từ kho: `SELECT @unit_price = price FROM parts WHERE id = @part_id`.
     * Thêm dòng mới vào `invoice_items` với đơn giá `unit_price` vừa capture được (Price Snapshot).
  2. **Database Trigger `trg_invoice_items_stock` (Trừ Kho Tự Động)**:
     * Tự động thực hiện trừ tồn kho: `parts.stock_quantity = stock_quantity - inserted.quantity`.
     * **Ràng buộc chống âm kho (Mã 50001)**: Nếu sau khi trừ, `stock_quantity < 0`, trigger lập tức `ROLLBACK TRANSACTION` và ném mã lỗi:
       ```
       THROW 50001, N'Không đủ số lượng linh kiện trong kho để xuất sử dụng!', 1;
       ```
  3. **Database Trigger `trg_invoices_total_amount` (Tính Tiền Tự Động)**:
     * Kích hoạt hàm Scalar Function `dbo.fn_calculate_parts_total(@invoice_id)`.
     * Tính tổng chi phí linh kiện $\sum(\text{quantity} \times \text{unit\_price})$.
     * Tự động cập nhật `invoices.total_amount = MAX(0, labor_fee - discount_amount) + parts_total`.

---

### Quy Trình 4: Kỹ Thuật Viên Gỡ Bỏ Linh Kiện Khỏi Hóa Đơn
* **Màn hình giao diện**: Modal Chi tiết hóa đơn / Danh sách linh kiện đã chọn.
* **Thao tác người dùng**:
  * Khi KTV kiểm tra lại thấy linh kiện không cần dùng $\rightarrow$ Bấm nút biểu tượng **Thùng rác màu đỏ** bên cạnh dòng linh kiện đó.
* **REST API kích hoạt**: `DELETE /api/invoices/:id/items/:partId`
* **Đối tượng CSDL được thực thi**:
  1. **Lệnh SQL**: `DELETE FROM dbo.invoice_items WHERE invoice_id = @id AND part_id = @partId;`
  2. **Database Trigger `trg_invoice_items_freeze_paid` (Khóa dòng)**:
     * Kiểm tra trạng thái của hóa đơn chứa dòng này. Nếu hóa đơn đã `paid`, cấm xóa và ném lỗi `50035`.
  3. **Database Trigger `trg_invoice_items_stock` (Hoàn Trả Kho Tự Động)**:
     * Bắt sự kiện `DELETE`.
     * Tự động hoàn lại số lượng linh kiện về kho:
       `UPDATE parts SET stock_quantity = stock_quantity + deleted.quantity WHERE id = deleted.part_id`.
  4. **Database Trigger `trg_invoices_total_amount`**:
     * Tự động trừ tiền món linh kiện vừa xóa ra khỏi `invoices.total_amount`.

---

### Quy Trình 5: Kỹ Thuật Viên Báo Máy Sửa Xong
* **Màn hình giao diện**: Màn hình Kỹ thuật viên (`/technician`).
* **Thao tác người dùng**:
  * KTV sửa xong thiết bị $\rightarrow$ Chọn trạng thái **"Hoàn tất sửa chữa"** (`completed`) $\rightarrow$ Bấm nút **"Xác nhận hoàn tất"**.
* **REST API kích hoạt**: `PATCH /api/tickets/:id/process` với payload `{ status: "completed" }`.
* **Đối tượng CSDL được thực thi**:
  1. **Stored Procedure `dbo.sp_process_ticket`**:
     * Cập nhật `tickets.status = 'completed'`.
  2. **Database Trigger `trg_tickets_workflow_guard`**:
     * Bắt sự kiện chuyển sang `completed`.
     * Tự động điền dấu mốc hoàn tất kỹ thuật: `completed_at = GETDATE()`.
  3. **Database Trigger `trg_tickets_audit_history`**:
     * Ghi vết trạng thái `completed` phục vụ đo lường thời gian xử lý thực tế (Turnaround Time - TAT).

---

### Quy Trình 6: Thu Ngân Thanh Toán & Khóa Bất Biến Tài Chính
* **Màn hình giao diện**: Phân hệ Thu ngân (`/cashier`) $\rightarrow$ Tab "Chờ thanh toán".
* **Thao tác người dùng**:
  1. Thu ngân bấm nút **"Thanh toán"** trên dòng hóa đơn.
  2. Mở Checkout Modal kiểm tra tổng tiền.
  3. Chọn phương thức: *Tiền mặt* (`cash`), *Chuyển khoản* (`bank_transfer`), hoặc *Quẹt thẻ* (`credit_card`).
  4. Bấm nút **"Xác nhận thanh toán"**.
* **REST API kích hoạt**: `POST /api/invoices/:id/checkout`
* **Đối tượng CSDL được thực thi**:
  1. **Stored Procedure `dbo.sp_checkout_invoice`**:
     * Đổi `status = 'paid'`, cập nhật `payment_method`, gán thời gian `paid_at = GETDATE()`.
  2. **Bộ Đôi Trigger Khóa Bất Biến Tài Chính (Financial Immutability)**:
     * **Cấp Hóa Đơn (`trg_invoices_freeze_paid_amounts`)**:
       * Kể từ giây phút này, bất kỳ ai cố tình gửi lệnh `UPDATE invoices` sửa `total_amount`, `labor_fee`, `discount_amount` hoặc đảo ngược `status` từ `paid` về `unpaid` đều bị `ROLLBACK` và ném mã lỗi:
         ```
         THROW 50036, N'Hóa đơn đã thanh toán không thể sửa đổi số tiền hoặc đảo ngược trạng thái!', 1;
         ```
     * **Cấp Dòng Chi Tiết (`trg_invoice_items_freeze_paid`)**:
       * Cấm tuyệt đối mọi thao tác `INSERT`, `UPDATE`, `DELETE` trên bảng `invoice_items` của hóa đơn đã thanh toán, ném mã lỗi:
         ```
         THROW 50035, N'Không thể thêm, sửa, hoặc xóa linh kiện của hóa đơn đã thanh toán!', 1;
         ```

---

### Quy Trình 7: Bàn Giao Thiết Bị Cho Khách Hàng
* **Màn hình giao diện**: Phân hệ Lễ tân (`/reception`) hoặc Danh bạ phiếu (`/tickets`).
* **Thao tác người dùng**:
  * Khi khách đến nhận máy $\rightarrow$ Nhân viên bấm nút **"Bàn giao máy"** (`delivered`).
* **REST API kích hoạt**: `PATCH /api/tickets/:id/process` với payload `{ status: "delivered" }`.
* **Đối tượng CSDL được thực thi**:
  1. **Database Trigger `trg_tickets_workflow_guard`**:
     * Kiểm tra trạng thái tiền đề: Nếu trạng thái trước đó **chưa phải là `completed`** $\rightarrow$ `ROLLBACK` và ném lỗi `50004: Phiếu sửa chữa phải ở trạng thái [completed] trước khi bàn giao!`.
     * Tự động cập nhật `completed_at = GETDATE()` (nếu trước đó chưa có).
  2. **Database Trigger `trg_tickets_audit_history`**:
     * Đóng chu trình vòng đời phiếu bằng bản ghi audit cuối cùng với `new_status = 'delivered'`.

---

### Quy Trình 8: Giám Đốc Theo Dõi Cảnh Báo Trễ Hạn SLA Bằng Con Trỏ Database Cursor
* **Màn hình giao diện**: Bảng điều khiển Giám đốc (`/dashboard`) $\rightarrow$ Card **"Phiếu trễ hạn cam kết SLA (>14 ngày)"**.
* **Thao tác người dùng**:
  * Quản lý mở Dashboard hoặc bấm nút **"Làm mới số liệu"** (icon vòng xoay).
* **REST API kích hoạt**: `GET /api/reports/delayed-tickets?days=14`
* **Đối tượng CSDL được thực thi**:
  1. **Stored Procedure `dbo.sp_alert_delayed_tickets` (Sử dụng Cursor T-SQL)**:
     * Khai báo con trỏ:
       ```sql
       DECLARE cur_delayed_tickets CURSOR LOCAL FAST_FORWARD FOR
       SELECT id, received_at, status, customer_id, technician_id
       FROM tickets
       WHERE status NOT IN ('completed', 'delivered', 'cancelled')
         AND DATEDIFF(day, received_at, GETDATE()) > @delay_days;
       ```
     * Vòng lặp `WHILE @@FETCH_STATUS = 0` duyệt tuần tự qua từng phiếu vi phạm SLA, kết nối thông tin thiết bị, khách hàng và KTV phụ trách.
     * Tính toán chính xác số ngày trễ (`delayed_days`) và nạp vào biến bảng `@delayed_tickets`.
     * Trả về dataset dạng bảng cho Web API hiển thị danh sách cảnh báo màu đỏ kèm thanh tiến trình.

---

### Quy Trình 9: Kiểm Toán Đối Soát Toàn Bộ Doanh Thu Bằng Cursor
* **Màn hình giao diện**: Bảng điều khiển (`/dashboard`) $\rightarrow$ Bấm nút **"Đối soát hóa đơn & Doanh thu"** (Mở Invoice Audit Modal).
* **Thao tác người dùng**:
  * Bấm nút **"Bắt đầu quét đối soát"** (Tùy chọn tích checkbox *"Tự động sửa sai số nếu phát hiện"*).
* **REST API kích hoạt**: `POST /api/reports/audit-invoices` với body `{ autoFix: true/false }`.
* **Đối tượng CSDL được thực thi**:
  1. **Stored Procedure `dbo.sp_audit_invoices` (Sử dụng Cursor T-SQL)**:
     * Khai báo con trỏ duyệt 100% hóa đơn trong CSDL:
       ```sql
       DECLARE cur_invoices CURSOR LOCAL FAST_FORWARD FOR
       SELECT id, labor_fee, discount_amount, total_amount FROM invoices;
       ```
     * Tại mỗi vòng lặp, SP gọi hàm Scalar Function `dbo.fn_calculate_parts_total(id)`.
     * Đối chiếu: `@expected_total = MAX(0, labor_fee - discount_amount) + parts_total`.
     * So sánh với `@current_total`: Nếu phát hiện lệch tiền $\rightarrow$ ghi nhận chi tiết (Mã HĐ, Số tiền hiện tại, Số tiền chuẩn, Chênh lệch).
     * Nếu `@auto_fix = 1`: Cursor tự động thực thi lệnh `UPDATE invoices SET total_amount = @expected_total` để đồng bộ lại số liệu kế toán chuẩn xác.

---

### Quy Trình 10: Khách Hàng Tra Cứu Bảo Hành Công Khai
* **Màn hình giao diện**: Trang Tra cứu công khai (`/tra-cuu`).
* **Thao tác người dùng**:
  * Khách hàng nhập Số điện thoại hoặc Số Serial/IMEI của máy $\rightarrow$ Bấm nút **"Tra cứu bảo hành"**.
* **REST API kích hoạt**: `GET /api/tickets/public-tracking?phone=...`
* **Đối tượng CSDL được thực thi**:
  1. **Table-Valued Function `dbo.fn_get_device_repair_history(@device_id)`**:
     * Trả về bảng lịch sử sửa chữa đa tầng: Ngày tiếp nhận, Lý do hỏng, Linh kiện thay thế, KTV thực hiện, Trạng thái bàn giao.
  2. **Scalar Function `dbo.fn_is_device_under_warranty(@device_id, GETDATE())`**:
     * Tính toán thời hạn bảo hành thực tế.
     * Trả về cờ `1` (Còn bảo hành) hoặc `0` (Hết bảo hành) để giao diện hiển thị huy hiệu xanh/vàng tương ứng.

---

## 3. Bảng Tra Cứu Nhanh Mã Lỗi Trigger T-SQL (Custom Error Codes)

Khi người dùng thao tác sai quy trình nghiệp vụ trên Dashboard, Database Engine sẽ hủy bỏ giao dịch (`ROLLBACK TRANSACTION`) và trả về các mã lỗi sau:

| Mã Lỗi THROW | Trigger Phát Sinh | HTTP Status Code | Nguyên Nhân Kích Hoạt | Thông Báo Trên Giao Diện Toast |
|:---:|:---|:---:|:---|:---|
| **`50001`** | `trg_invoice_items_stock` | `400 Bad Request` | Số lượng linh kiện xuất dùng vượt quá tồn kho khả dụng (`stock_quantity < 0`). | *Không đủ số lượng linh kiện trong kho để xuất sử dụng!* |
| **`50003`** | `trg_tickets_workflow_guard` | `422 Unprocessable` | Chuyển phiếu sang trạng thái kỹ thuật (`inspecting`, `repairing`...) nhưng chưa phân công KTV (`technician_id IS NULL`). | *Phải phân công kỹ thuật viên trước khi chuyển sang trạng thái này!* |
| **`50004`** | `trg_tickets_workflow_guard` | `422 Unprocessable` | Vi phạm thứ tự tuyến tính: Chuyển sang `delivered` khi chưa `completed`, hoặc cố ý mở lại phiếu đã bàn giao. | *Phiếu sửa chữa phải ở trạng thái [completed] trước khi bàn giao!* |
| **`50035`** | `trg_invoice_items_freeze_paid` | `422 Unprocessable` | Thêm, sửa, hoặc xóa dòng linh kiện (`invoice_items`) của hóa đơn đã thanh toán (`paid`). | *Không thể thêm, sửa, hoặc xóa linh kiện của hóa đơn đã thanh toán!* |
| **`50036`** | `trg_invoices_freeze_paid_amounts` | `422 Unprocessable` | Chỉnh sửa số tiền hoặc cố ý chuyển trạng thái hóa đơn từ `paid` ngược về `unpaid`. | *Hóa đơn đã thanh toán không thể sửa đổi số tiền hoặc đảo ngược trạng thái!* |
