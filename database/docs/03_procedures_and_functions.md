# Database Architecture: Stored Procedures & Functions

> **Chiến lược kiến trúc**: Các nghiệp vụ biến đổi trạng thái đa bảng (Multi-table Mutations) và các giao dịch nguyên tử (Atomic Transactions) được đóng gói trong **Stored Procedures** tại SQL Server. Backend NestJS gọi thực thi thông qua Raw SQL `EXEC dbo.<procedure_name>`.

---

## 1. Bảng Tổng Hợp 7 Stored Procedures

| Tên Procedure | Tham Số Chính | Chức Năng Nghiệp Vụ | URL Giao Diện Trực Quan | Đảm Bảo Giao Dịch (ACID) |
|:---|:---|:---|:---|:---:|
| `sp_receive_device` | `@device_id`, `@receptionist_id`, `@ticket_type`, `@issue_description`... | Tiếp nhận máy tại quầy POS, chặn trùng phiếu active. | [Tiếp nhận: `http://localhost:3000/reception`](http://localhost:3000/reception) | `TRANSACTION` |
| `sp_process_ticket` | `@ticket_id`, `@technician_id`, `@status`, `@fault_cause`, `@repair_solution`... | Bàn KTV cập nhật chẩn đoán, chi phí và chuyển trạng thái. | [Bàn kỹ thuật: `http://localhost:3000/technician`](http://localhost:3000/technician) | Cập nhật nguyên tử |
| `sp_create_invoice` | `@ticket_id`, `@labor_fee` | Khởi tạo hóa đơn, tự chiết khấu 100% tiền công nếu bảo hành. | [Bàn kỹ thuật: `http://localhost:3000/technician`](http://localhost:3000/technician)<br/>[Thu ngân: `http://localhost:3000/cashier`](http://localhost:3000/cashier) | `TRANSACTION` |
| `sp_add_invoice_part` | `@invoice_id`, `@part_id`, `@quantity` | Gắn linh kiện vào phiếu, tự gộp số lượng nếu đã có dòng cũ. | [Bàn kỹ thuật: `http://localhost:3000/technician`](http://localhost:3000/technician) | Trigger bảo vệ kho |
| `sp_checkout_invoice` | `@invoice_id`, `@payment_method` | Thanh toán hóa đơn và tự động giao máy (`delivered`). | [Thu ngân: `http://localhost:3000/cashier`](http://localhost:3000/cashier) | `TRANSACTION` |
| `sp_audit_invoices` | `@auto_fix BIT = 0` | **Cursor T-SQL**: Quét toàn bộ hóa đơn, đối soát và tự sửa sai số. | [Dashboard: `http://localhost:3000/dashboard`](http://localhost:3000/dashboard) | `CURSOR` |
| `sp_alert_delayed_tickets` | `@delay_days INT = 14` | **Cursor T-SQL**: Duyệt tuần tự các phiếu quá hạn SLA, trả về dataset cho Web API. | [Dashboard: `http://localhost:3000/dashboard`](http://localhost:3000/dashboard) | `CURSOR` |
| `sp_backup_database` | `@backup_dir`, `@file_name` | Sao lưu vật lý CSDL nguyên khối nén ra file `.bak`. | [Quản trị CSDL: `http://localhost:3000/database`](http://localhost:3000/database) | File I/O Server |
| `sp_restore_database` | `@backup_path` | Đưa DB về `SINGLE_USER`, khôi phục từ snapshot `.bak`. | [Quản trị CSDL: `http://localhost:3000/database`](http://localhost:3000/database) | Session Isolation |
| `sp_bulk_import_parts` | `@csv_file_path` | `BULK INSERT` nạp linh kiện tốc độ cao, `MERGE` kho. | [Kho linh kiện: `http://localhost:3000/inventory`](http://localhost:3000/inventory) | `BULK INSERT` |
| `sp_bulk_import_tickets` | `@csv_file_path`, `@receptionist_id` | `BULK INSERT` nạp phiếu sửa chữa hàng loạt trạng thái `received`. | [Phiếu sửa: `http://localhost:3000/tickets`](http://localhost:3000/tickets) | `BULK INSERT` |

---

## 2. Chi Tiết Từng Stored Procedure

### 2.1 `dbo.sp_receive_device` — Tiếp Nhận Thiết Bị Tại Quầy POS
- **Mục đích**: Lễ tân (hoặc Quản lý) tạo phiếu mới cho thiết bị khách mang đến.
- **Ràng buộc nghiệp vụ**:
  - Kiểm tra thiết bị có tồn tại trong hệ thống hay không (ném mã lỗi **`50010`** nếu không tìm thấy).
  - Kiểm tra nhân viên tạo phiếu phải có vai trò `receptionist` hoặc `manager` (ném mã lỗi **`50011`** nếu vi phạm).
  - Tự động gọi hàm **`dbo.fn_is_device_under_warranty`**: Nếu thiết bị còn hạn bảo hành và phiếu là `repair`, tự động nâng cấp sang **`warranty`** (miễn phí công).
- **Tham số**:
  - `@device_id INT`: Mã thiết bị.
  - `@receptionist_id INT`: Mã nhân viên lễ tân / quản lý.
  - `@issue_description NVARCHAR(500)`: Mô tả lỗi từ khách.
  - `@initial_condition NVARCHAR(200) = NULL`: Hiện trạng ngoại quan.
  - `@accessories NVARCHAR(200) = NULL`: Phụ kiện gửi kèm.
  - `@ticket_type VARCHAR(20) = 'repair'`: Loại phiếu (`'repair'`, `'warranty'`, hoặc `'re_repair'`).
  - `@ticket_id INT OUTPUT`: Trả về mã phiếu vừa tạo (`SCOPE_IDENTITY()`).
- **Mã thực thi Backend NestJS (`TypeORM Parameterized Query`):**
  *File:* [`core/src/modules/tickets/tickets.service.ts`](file:///Users/lehuyair/Documents/UIT/warranty_management/core/src/modules/tickets/tickets.service.ts)
  ```typescript
  const rawResult: { ticket_id: number }[] = await this.dataSource.query(
    `
    DECLARE @out_id INT;
    EXEC dbo.sp_receive_device
      @device_id = @0,
      @receptionist_id = @1,
      @issue_description = @2,
      @initial_condition = @3,
      @accessories = @4,
      @ticket_type = @5,
      @ticket_id = @out_id OUTPUT;
    SELECT @out_id AS ticket_id;
    `,
    [
      createDto.deviceId,
      receptionistId,
      createDto.issueDescription,
      createDto.initialCondition || null,
      createDto.accessories || null,
      createDto.ticketType || 'repair',
    ],
  );
  const ticketId = rawResult?.[0]?.ticket_id;
  ```

---

### 2.2 `dbo.sp_process_ticket` — Bàn Kỹ Thuật Chẩn Đoán & Chuyển Trạng Thái
- **Mục đích**: Kỹ thuật viên (hoặc Quản lý) cập nhật tiến trình sửa chữa.
- **Ràng buộc nghiệp vụ**:
  - Không cho phép cập nhật phiếu đã giao (`delivered`) hoặc đã hủy (`cancelled`).
  - Phải có KTV phụ trách mới được chuyển sang giai đoạn kiểm tra / sửa chữa.
- **Tham số**:
  - `@ticket_id INT`: Mã phiếu cần xử lý.
  - `@technician_id INT`: KTV thực hiện.
  - `@status VARCHAR(30)`: Trạng thái mới.
  - `@fault_cause NVARCHAR(500)`: Nguyên nhân hư hỏng.
  - `@repair_solution NVARCHAR(500)`: Phương án khắc phục.
  - `@estimated_cost DECIMAL(18,2)`: Chi phí dự tính.
  - `@note NVARCHAR(500)`: Ghi chú nội bộ.
- **Mã thực thi Backend NestJS (`TypeORM Parameterized Query`):**
  *File:* [`core/src/modules/tickets/tickets.service.ts`](file:///Users/lehuyair/Documents/UIT/warranty_management/core/src/modules/tickets/tickets.service.ts)
  ```typescript
  await this.dataSource.query(
    `
    EXEC dbo.sp_process_ticket
      @ticket_id = @0,
      @status = @1,
      @technician_id = @2,
      @fault_cause = @3,
      @repair_solution = @4,
      @estimated_cost = @5;
    `,
    [
      ticketId,
      processDto.status,
      processDto.technicianId || null,
      processDto.faultCause || null,
      processDto.repairSolution || null,
      processDto.estimatedCost !== undefined ? processDto.estimatedCost : null,
    ],
  );
  ```

---

### 2.3 `dbo.sp_create_invoice` — Lập Hóa Đơn & Tự Động Chiết Khấu Bảo Hành
- **Mục đích**: Khởi tạo hóa đơn thanh toán cho phiếu sửa chữa.
- **Logic tự động thông minh**:
  - Thủ tục đọc trường `tickets.ticket_type`:
    - Nếu là `warranty` (Bảo hành chính hãng) hoặc `re_repair` (Bảo hành sửa lại): **Tự động gán `discount_amount = @labor_fee` (Chiết khấu 100% tiền công)**.
    - Nếu là `repair`: Giữ nguyên tiền công, chiết khấu mặc định bằng 0.
- **Tham số**:
  - `@ticket_id INT`: Mã phiếu.
  - `@labor_fee DECIMAL(18,2)`: Tiền công kỹ thuật quy định.
  - `@new_invoice_id INT OUTPUT`: Mã hóa đơn mới tạo.
- **Mã thực thi Backend NestJS (`TypeORM Parameterized Query`):**
  *File:* [`core/src/modules/invoices/invoices.service.ts`](file:///Users/lehuyair/Documents/UIT/warranty_management/core/src/modules/invoices/invoices.service.ts)
  ```typescript
  const rawResult: { invoice_id: number }[] = await this.dataSource.query(
    `
    DECLARE @out_id INT;
    EXEC dbo.sp_create_invoice
      @ticket_id = @0,
      @labor_fee = @1,
      @invoice_id = @out_id OUTPUT;
    SELECT @out_id AS invoice_id;
    `,
    [createDto.ticketId, createDto.laborFee || 0],
  );
  const invoiceId = rawResult?.[0]?.invoice_id;
  ```

---

### 2.4 `dbo.sp_add_invoice_part` — Xuất Linh Kiện Thay Thế
- **Mục đích**: Kỹ thuật viên lấy linh kiện từ kho gắn vào phiếu.
- **Cơ chế chống phân mảnh dữ liệu (Upsert Logic)**:
  - Nếu món linh kiện `@part_id` **chưa có** trong hóa đơn: Thêm mới dòng trong `invoice_items`.
  - Nếu món linh kiện **đã tồn tại sẵn** trong hóa đơn: Tự động cộng dồn số lượng `quantity = quantity + @quantity` (tránh sinh ra 2 dòng cùng 1 món linh kiện).
- **Kiểm soát kho**: Trigger `trg_invoice_items_stock` sẽ tự động trừ kho và rollback nếu tồn kho không đủ.
- **Mã thực thi Backend NestJS (`TypeORM Parameterized Query`):**
  *File:* [`core/src/modules/invoices/invoices.service.ts`](file:///Users/lehuyair/Documents/UIT/warranty_management/core/src/modules/invoices/invoices.service.ts)
  ```typescript
  await this.dataSource.query(
    `
    EXEC dbo.sp_add_invoice_part
      @invoice_id = @0,
      @part_id = @1,
      @quantity = @2;
    `,
    [invoiceId, addDto.partId, addDto.quantity || 1],
  );
  ```

---

### 2.5 `dbo.sp_checkout_invoice` — Thanh Toán Nguyên Tử (Atomic Checkout)
- **Mục đích**: Thu ngân thu tiền và giao trả máy cho khách hàng.
- **Tính nguyên tử (All-or-Nothing Transaction)**:
  1. Cập nhật hóa đơn sang `status = 'paid'`, lưu phương thức thanh toán (`cash`, `bank_transfer`, `credit_card`) và mốc giờ `paid_at`.
  2. Kiểm tra nếu tất cả hóa đơn của phiếu này đều đã được thanh toán xong -> Tự động chuyển trạng thái phiếu `tickets.status` sang `delivered` (Đã giao máy) và điền `completed_at`.
  3. Cả 2 thao tác nằm trong cùng 1 khối `BEGIN TRANSACTION ... COMMIT TRANSACTION`. Nếu có bất kỳ lỗi nào, hệ thống tự `ROLLBACK` an toàn.
- **Mã thực thi Backend NestJS (`TypeORM Parameterized Query`):**
  *File:* [`core/src/modules/invoices/invoices.service.ts`](file:///Users/lehuyair/Documents/UIT/warranty_management/core/src/modules/invoices/invoices.service.ts)
  ```typescript
  await this.dataSource.query(
    `
    EXEC dbo.sp_checkout_invoice
      @invoice_id = @0,
      @payment_method = @1;
    `,
    [invoiceId, checkoutDto.paymentMethod],
  );
  ```

---

### 2.6 `dbo.sp_audit_invoices` — Đối Soát Số Liệu Hóa Đơn Bằng Database Cursor
- **Mục đích**: Giám đốc / Kế toán chạy kiểm toán định kỳ toàn bộ hóa đơn trong hệ thống.
- **Kỹ thuật Cursor**:
  - Sử dụng con trỏ SQL Server `DECLARE invoice_cursor CURSOR` duyệt qua từng hóa đơn.
  - Với mỗi hóa đơn, tính lại giá trị lý thuyết:
    $$\text{Expected Total} = (\text{labor\_fee} - \text{discount\_amount}) + \text{fn\_calculate\_parts\_total(id)}$$
  - So sánh với cột `total_amount` đang lưu trữ.
  - Nếu phát hiện chênh lệch (Discrepancy):
    - Ghi nhận thông tin hóa đơn lỗi và số tiền chênh lệch.
    - Nếu tham số `@auto_fix = 1`: Tự động chạy lệnh `UPDATE` sửa lại số tiền cho đúng với thực tế.
- **Mã thực thi Backend NestJS (`TypeORM Parameterized Query`):**
  *File:* [`core/src/modules/reports/reports.service.ts`](file:///Users/lehuyair/Documents/UIT/warranty_management/core/src/modules/reports/reports.service.ts)
  ```typescript
  const rawResults = await this.dataSource.query(
    `EXEC dbo.sp_audit_invoices @auto_fix = @0;`,
    [autoFix ? 1 : 0], // 1 = Tự động sửa sai lệch doanh thu; 0 = Chỉ đối soát
  );
  ```

---

### 2.7 `dbo.sp_alert_delayed_tickets` — Cảnh Báo Vi Phạm Cam Kết Thời Gian (SLA) Bằng Cursor
- **Mục đích**: Dashboard quản trị quét và phát hiện các phiếu tiếp nhận bị tồn đọng quá lâu so với cam kết dịch vụ.
- **Kỹ thuật Cursor (`cur_delayed_tickets`)**:
  - Khởi tạo con trỏ T-SQL duyệt tuần tự danh sách phiếu chưa hoàn tất mà `DATEDIFF(DAY, received_at, GETDATE()) > @delay_days` (mặc định >14 ngày).
  - Vòng lặp Cursor duyệt từng bản ghi, nạp vào biến bảng `@delayed_tickets` (Table Variable) kết hợp tính toán số ngày quá hạn và phân loại thông tin khách hàng, KTV phụ trách.
  - Trả về Recordset dạng bảng sắp xếp giảm dần theo số ngày trễ hạn để Web API NestJS và Frontend Next.js render trực tiếp lên giao diện Dashboard.
- **Mã thực thi Backend NestJS (`TypeORM Parameterized Query`):**
  *File:* [`core/src/modules/reports/reports.service.ts`](file:///Users/lehuyair/Documents/UIT/warranty_management/core/src/modules/reports/reports.service.ts)
  ```typescript
  const rawResults: DelayedTicketReportRow[] = await this.dataSource.query(
    `EXEC dbo.sp_alert_delayed_tickets @delay_days = @0;`,
    [delayDays], // Mặc định 14 ngày
  );
  ```

---

### 2.8 `dbo.sp_backup_database` — Sao Lưu Toàn Diện CSDL (Physical Full Backup)
- **Mục đích**: Thực thi sao lưu CSDL nguyên khối ra file nhị phân `.bak` trực tiếp trên disk máy chủ.
- **Tham số**:
  - `@backup_dir NVARCHAR(260) = NULL`: Thư mục lưu file (mặc định `/docker-entrypoint-initdb.d/exchange`).
  - `@file_name NVARCHAR(260) = NULL`: Tên file (mặc định theo timestamp).
  - `@out_backup_path NVARCHAR(500) OUTPUT`: Đường dẫn file sinh ra.
- **Kỹ thuật**: Thực hiện `BACKUP DATABASE warranty_management TO DISK = ... WITH FORMAT, INIT, COMPRESSION`.
- **Mã thực thi Backend NestJS (`TypeORM Parameterized Query`):**
  *File:* [`core/src/modules/database-admin/database-admin.service.ts`](file:///Users/lehuyair/Documents/UIT/warranty_management/core/src/modules/database-admin/database-admin.service.ts)
  ```typescript
  const result = await this.dataSource.query(
    `
    DECLARE @out_path NVARCHAR(500);
    EXEC dbo.sp_backup_database
      @backup_dir = '/docker-entrypoint-initdb.d/exchange',
      @file_name = @0,
      @out_backup_path = @out_path OUTPUT;
    `,
    [fileName],
  );
  ```

---

### 2.9 `master.dbo.sp_restore_database` — Khôi Phục CSDL Từ File Snapshot
- **Mục đích**: Ngắt kết nối hiện hành và khôi phục CSDL từ file snapshot `.bak`.
- **Tham số**:
  - `@backup_path NVARCHAR(500)`: Đường dẫn file `.bak` cần restore.
- **Kỹ thuật**: 
  - `ALTER DATABASE warranty_management SET SINGLE_USER WITH ROLLBACK IMMEDIATE;`
  - `RESTORE DATABASE warranty_management FROM DISK = @backup_path WITH REPLACE;`
  - `ALTER DATABASE warranty_management SET MULTI_USER;`
- **Mã thực thi Backend NestJS (`TypeORM Parameterized Query`):**
  *File:* [`core/src/modules/database-admin/database-admin.service.ts`](file:///Users/lehuyair/Documents/UIT/warranty_management/core/src/modules/database-admin/database-admin.service.ts)
  ```typescript
  // Chuyển ngữ cảnh sang 'master' để ngắt lock của chính phiên kết nối hiện hành, rồi chuyển ngược lại
  const result = await this.dataSource.query(
    `USE master; EXEC master.dbo.sp_restore_database @backup_path = @0; USE warranty_management;`,
    [mssqlPath],
  );
  ```

---

### 2.10 `dbo.sp_bulk_import_parts` — Nạp Dữ Liệu Hàng Loạt Bằng BULK INSERT
- **Mục đích**: Nạp dữ liệu danh mục linh kiện trực tiếp từ file CSV vào Database Engine tốc độ cao.
- **Tham số**:
  - `@csv_file_path NVARCHAR(500)`: Đường dẫn file CSV trên máy chủ.
  - `@rows_imported INT OUTPUT`: Số lượng bản ghi bị tác động.
- **Cơ chế Upsert**:
  - Dùng `BULK INSERT #staging_parts FROM ... WITH (FORMAT = 'CSV', TABLOCK)`.
  - Dùng `MERGE dbo.parts` để cộng dồn tồn kho nếu linh kiện đã có, hoặc thêm mới nếu chưa có.
- **Mã thực thi Backend NestJS (`TypeORM Parameterized Query`):**
  *File:* [`core/src/modules/database-admin/database-admin.service.ts`](file:///Users/lehuyair/Documents/UIT/warranty_management/core/src/modules/database-admin/database-admin.service.ts)
  ```typescript
  const result: { rows_affected: number; total_rows_read: number }[] =
    await this.dataSource.query(
      `EXEC dbo.sp_bulk_import_parts @csv_file_path = @0`,
      [mssqlPath],
    );
  ```

---

### 2.11 `dbo.sp_bulk_import_tickets` — Nạp Phiếu Sửa Chữa Hàng Loạt Bằng BULK INSERT
- **Mục đích**: Nạp danh sách phiếu tiếp nhận sửa chữa hàng loạt trực tiếp từ file CSV vào Database Engine tốc độ cao, khởi tạo trạng thái chuẩn và đảm bảo toàn vẹn dữ liệu.
- **Tham số**:
  - `@csv_file_path NVARCHAR(500)`: Đường dẫn file CSV trên máy chủ.
  - `@receptionist_id INT = 1`: Mã nhân viên tiếp nhận phiếu (mặc định lấy Manager/Receptionist đầu tiên nếu ID không tồn tại).
  - `@rows_imported INT OUTPUT`: Số lượng phiếu sửa chữa được nạp thành công.
- **Quy tắc Nghiệp vụ & Toàn vẹn CSDL**:
  - Đọc CSV vào `#staging_tickets` qua `BULK INSERT ... WITH (FORMAT = 'CSV', FIRSTROW = 2, TABLOCK)`.
  - Toàn bộ phiếu nạp tự động đặt trạng thái ban đầu `status = 'received'`, `technician_id = NULL` (chưa phân công kỹ thuật viên phụ trách để phân công thủ công sau).
  - Tự động kích hoạt Trigger `trg_tickets_audit_history` ghi nhận nhật ký ban đầu vào bảng `ticket_status_history`.
  - Thực hiện `INNER JOIN dbo.devices` để triệt tiêu lỗi vi phạm khoá ngoại FK 547 nếu file CSV chứa `device_id` không tồn tại.
- **Mã thực thi Backend NestJS (`TypeORM Parameterized Query`):**
  *File:* [`core/src/modules/database-admin/database-admin.service.ts`](file:///Users/lehuyair/Documents/UIT/warranty_management/core/src/modules/database-admin/database-admin.service.ts)
  ```typescript
  const result: { rows_affected: number; total_rows_read: number }[] =
    await this.dataSource.query(
      `EXEC dbo.sp_bulk_import_tickets @csv_file_path = @0, @receptionist_id = @1`,
      [mssqlPath, receptionistId],
    );
  ```

---

### 2.12 `dbo.sp_export_parts_data`, `dbo.sp_export_invoices_data`, `dbo.sp_export_tickets_data` — Trích Xuất Dữ Liệu Nguyên Khối
- **Mục đích**: Database Engine trực tiếp select và format dataset chuẩn để xuất file CSV cho người dùng.
- **Mã thực thi Backend NestJS (`TypeORM Parameterized Query`):**
  *File:* [`core/src/modules/database-admin/database-admin.service.ts`](file:///Users/lehuyair/Documents/UIT/warranty_management/core/src/modules/database-admin/database-admin.service.ts)
  ```typescript
  // Tùy theo bảng được chọn để xuất CSV:
  const parts = await this.dataSource.query(`EXEC dbo.sp_export_parts_data`);
  const invoices = await this.dataSource.query(`EXEC dbo.sp_export_invoices_data`);
  const tickets = await this.dataSource.query(`EXEC dbo.sp_export_tickets_data`);
  ```

---

## 3. Danh Mục 3 Hàm Người Dùng Định Nghĩa (User-Defined Functions - UDFs)

### 3.1 `dbo.fn_calculate_parts_total` (Scalar Function)
- **Cú pháp**: `dbo.fn_calculate_parts_total(@invoice_id INT) RETURNS DECIMAL(18,2)`
- **Nghiệp vụ**: Tính tổng giá trị toàn bộ linh kiện của một hóa đơn (`SUM(quantity * unit_price)`).
- **Ứng dụng**: Được gọi độc lập trong Trigger tính tiền (`trg_invoices_total_amount`, `trg_invoices_labor_update`) và Procedure đối soát số dư (`sp_audit_invoices`).

### 3.2 `dbo.fn_is_device_under_warranty` (Scalar Function)
- **Cú pháp**: `dbo.fn_is_device_under_warranty(@device_id INT, @check_date DATE) RETURNS BIT`
- **Nghiệp vụ**: Kiểm tra thiết bị có còn hạn bảo hành tại một ngày xác định hay không.
- **Logic**: Trả về `1` nếu `is_under_warranty = 1` VÀ `warranty_expiry_date >= @check_date`; ngược lại trả về `0`.
- **Ứng dụng**: Tự động gọi trong thủ tục tiếp nhận máy `sp_receive_device` để phân loại vé `repair` hay `warranty`.

### 3.3 `dbo.fn_get_device_repair_history` (Table-Valued Function)
- **Cú pháp**: `dbo.fn_get_device_repair_history(@device_id INT) RETURNS TABLE`
- **Nghiệp vụ**: Trả về bảng tổng hợp toàn bộ lịch sử các lần sửa chữa của thiết bị đó từ trước đến nay.
- **Cấu trúc bảng trả về**:
  - `ticket_id`: Mã phiếu.
  - `received_at`: Ngày nhận máy.
  - `status`: Trạng thái xử lý.
  - `technician_name`: KTV thực hiện.
  - `fault_cause`: Lỗi đã từng bị.
  - `repair_solution`: Cách đã từng sửa.
  - `invoice_total`: Tổng chi phí lần sửa đó.
  - `invoice_status`: Trạng thái hóa đơn.

---

## 4. Phân Biệt Chuyên Sâu: Function vs Procedure vs Cursor (Phục Vụ Báo Cáo & Bảo Vệ)

### 4.1 So Sánh Bản Chất Kỹ Thuật

| Tiêu chí | User-Defined Function (UDF) | Stored Procedure (SP) | Cursor (Con trỏ T-SQL) |
| :--- | :--- | :--- | :--- |
| **Bản chất** | Hàm tính toán / chuyển đổi dữ liệu thuần túy (Pure Transformation). | Chương trình con thực thi quy trình nghiệp vụ giao tác (Transaction Orchestrator). | Cơ chế duyệt tuần tự từng dòng dữ liệu (Row-by-row iteration mechanism). |
| **Khả năng thay đổi dữ liệu (Side Effects)** | **CẤM TUYỆT ĐỐI**: Không được `INSERT`, `UPDATE`, `DELETE` bảng vật lý. | **HOÀN TOÀN ĐƯỢC**: Thực hiện thêm, sửa, xóa trên nhiều bảng. | Tùy ngữ cảnh: có thể dùng chỉ đọc (`FAST_FORWARD`) hoặc để cập nhật (`WHERE CURRENT OF`). |
| **Giá trị trả về** | **BẮT BUỘC**: Phải `RETURN` 1 giá trị vô hướng (Scalar) hoặc 1 bảng (Table). | Không bắt buộc `RETURN` (trả về qua Recordset `SELECT`, OUTPUT params hoặc Exit Code). | Không tự trả về giá trị, dùng biến `@variable` để nhận dữ liệu qua `FETCH NEXT`. |
| **Vị trí sử dụng** | Gọi trực tiếp trong `SELECT`, `WHERE`, `HAVING`, `JOIN`, trong Trigger, trong SP. | Chỉ gọi độc lập bằng lệnh `EXEC` hoặc `EXECUTE`. Không gọi được trong `SELECT`. | Nằm bên trong khối lệnh T-SQL (trong SP hoặc Script batch). |
| **Quản lý Giao tác (ACID)** | Không hỗ trợ `BEGIN TRANSACTION`, `COMMIT`, `ROLLBACK`. | Hỗ trợ đầy đủ `TRANSACTION`, `TRY... CATCH`, `SAVEPOINT`. | Chạy trong transaction của SP bao bọc nó. |

### 4.2 Vì sao Function KHÔNG PHẢI "chỉ là một phần của Procedure"?
- **Tính độc lập và đa năng**: Function có thể chạy độc lập hoàn toàn trong bất kỳ câu lệnh SQL nào (ví dụ: `SELECT id, dbo.fn_calculate_parts_total(id) AS parts_cost FROM invoices`).
- **Tính tái sử dụng cao (DRY - Don't Repeat Yourself)**: Trong hệ thống, hàm `fn_calculate_parts_total` được dùng ở 3 nơi hoàn toàn độc lập:
  1. Trong Trigger `trg_invoices_total_amount` để tự động tính tiền khi thợ đổi linh kiện.
  2. Trong Trigger `trg_invoices_labor_update` để cập nhật tiền khi đổi tiền công.
  3. Trong Stored Procedure `sp_audit_invoices` để Cursor đối soát dữ liệu thực tế với số lưu trong bảng.
  -> Nếu viết nhét cứng logic này vào trong Procedure, ta sẽ bị lặp mã (Code Duplication) ở các Trigger khác.

### 4.3 Vòng Đời Chuẩn 5 Bước Của Cursor Trong Dự Án
```sql
-- 1. Khai báo con trỏ gắn với câu SELECT
DECLARE cur_invoices CURSOR LOCAL FAST_FORWARD FOR
    SELECT id, labor_fee, discount_amount, total_amount FROM invoices ORDER BY id;

-- 2. Mở con trỏ nạp tập dữ liệu
OPEN cur_invoices;

-- 3. Đọc bản ghi đầu tiên
FETCH NEXT FROM cur_invoices INTO @inv_id, @labor, @discount, @stored_total;

-- 4. Vòng lặp duyệt tuần tự từng dòng
WHILE @@FETCH_STATUS = 0
BEGIN
    -- Xử lý nghiệp vụ đối soát / kiểm toán từng dòng
    SET @calculated_total = @labor + dbo.fn_calculate_parts_total(@inv_id) - @discount;
    ...
    -- Đọc bản ghi tiếp theo
    FETCH NEXT FROM cur_invoices INTO @inv_id, @labor, @discount, @stored_total;
END

-- 5. Đóng con trỏ và giải phóng tài nguyên bộ nhớ RAM của SQL Server
CLOSE cur_invoices;
DEALLOCATE cur_invoices;
```

