# Database Architecture: Stored Procedures & Functions

> **Chiến lược kiến trúc**: Các nghiệp vụ biến đổi trạng thái đa bảng (Multi-table Mutations) và các giao dịch nguyên tử (Atomic Transactions) được đóng gói trong **Stored Procedures** tại SQL Server. Backend NestJS gọi thực thi thông qua Raw SQL `EXEC dbo.<procedure_name>`.

---

## 1. Bảng Tổng Hợp 7 Stored Procedures

| Tên Procedure | Tham Số Chính | Chức Năng Nghiệp Vụ | Đảm Bảo Giao Dịch (ACID) |
|:---|:---|:---|:---:|
| `sp_receive_device` | `@device_id`, `@receptionist_id`, `@ticket_type`, `@issue_description`... | Tiếp nhận máy tại quầy POS, chặn trùng phiếu active. | `TRANSACTION` |
| `sp_process_ticket` | `@ticket_id`, `@technician_id`, `@status`, `@fault_cause`, `@repair_solution`... | Bàn KTV cập nhật chẩn đoán, chi phí và chuyển trạng thái. | Cập nhật nguyên tử |
| `sp_create_invoice` | `@ticket_id`, `@labor_fee` | Khởi tạo hóa đơn, tự chiết khấu 100% tiền công nếu bảo hành. | `TRANSACTION` |
| `sp_add_invoice_part` | `@invoice_id`, `@part_id`, `@quantity` | Gắn linh kiện vào phiếu, tự gộp số lượng nếu đã có dòng cũ. | Trigger bảo vệ kho |
| `sp_checkout_invoice` | `@invoice_id`, `@payment_method` | Thanh toán hóa đơn và tự động giao máy (`delivered`). | `TRANSACTION` |
| `sp_audit_invoices` | `@auto_fix BIT = 0` | **Cursor T-SQL**: Quét toàn bộ hóa đơn, đối soát và tự sửa sai số. | `CURSOR` |
| `sp_alert_delayed_tickets` | `@delay_days INT = 14` | **Cursor T-SQL**: Duyệt tuần tự các phiếu quá hạn SLA, trả về dataset cho Web API. | `CURSOR` |

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

```sql
-- Ví dụ gọi thủ tục từ Backend NestJS
DECLARE @NewId INT;
EXEC dbo.sp_receive_device 
    @device_id = 1, 
    @receptionist_id = 2, 
    @issue_description = N'Máy không lên nguồn',
    @initial_condition = N'Máy trầy nắp đáy',
    @accessories = N'Sạc 65W',
    @ticket_type = 'repair',
    @ticket_id = @NewId OUTPUT;
SELECT @NewId AS ticket_id;
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

---

### 2.4 `dbo.sp_add_invoice_part` — Xuất Linh Kiện Thay Thế
- **Mục đích**: Kỹ thuật viên lấy linh kiện từ kho gắn vào phiếu.
- **Cơ chế chống phân mảnh dữ liệu (Upsert Logic)**:
  - Nếu món linh kiện `@part_id` **chưa có** trong hóa đơn: Thêm mới dòng trong `invoice_items`.
  - Nếu món linh kiện **đã tồn tại sẵn** trong hóa đơn: Tự động cộng dồn số lượng `quantity = quantity + @quantity` (tránh sinh ra 2 dòng cùng 1 món linh kiện).
- **Kiểm soát kho**: Trigger `trg_invoice_items_stock` sẽ tự động trừ kho và rollback nếu tồn kho không đủ.

---

### 2.5 `dbo.sp_checkout_invoice` — Thanh Toán Nguyên Tử (Atomic Checkout)
- **Mục đích**: Thu ngân thu tiền và giao trả máy cho khách hàng.
- **Tính nguyên tử (All-or-Nothing Transaction)**:
  1. Cập nhật hóa đơn sang `status = 'paid'`, lưu phương thức thanh toán (`cash`, `bank_transfer`, `credit_card`) và mốc giờ `paid_at`.
  2. Kiểm tra nếu tất cả hóa đơn của phiếu này đều đã được thanh toán xong -> Tự động chuyển trạng thái phiếu `tickets.status` sang `delivered` (Đã giao máy) và điền `completed_at`.
  3. Cả 2 thao tác nằm trong cùng 1 khối `BEGIN TRANSACTION ... COMMIT TRANSACTION`. Nếu có bất kỳ lỗi nào, hệ thống tự `ROLLBACK` an toàn.

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

```sql
-- Chạy đối soát chỉ xem báo cáo sai lệch (không sửa)
EXEC dbo.sp_audit_invoices @auto_fix = 0;

-- Chạy đối soát và tự động sửa các hóa đơn sai lệch
EXEC dbo.sp_audit_invoices @auto_fix = 1;
```

---

### 2.7 `dbo.sp_alert_delayed_tickets` — Cảnh Báo Vi Phạm Cam Kết Thời Gian (SLA) Bằng Cursor
- **Mục đích**: Dashboard quản trị quét và phát hiện các phiếu tiếp nhận bị tồn đọng quá lâu so với cam kết dịch vụ.
- **Kỹ thuật Cursor (`cur_delayed_tickets`)**:
  - Khởi tạo con trỏ T-SQL duyệt tuần tự danh sách phiếu chưa hoàn tất mà `DATEDIFF(DAY, received_at, GETDATE()) > @delay_days` (mặc định >14 ngày).
  - Vòng lặp Cursor duyệt từng bản ghi, nạp vào biến bảng `@delayed_tickets` (Table Variable) kết hợp tính toán số ngày quá hạn và phân loại thông tin khách hàng, KTV phụ trách.
  - Trả về Recordset dạng bảng sắp xếp giảm dần theo số ngày trễ hạn để Web API NestJS và Frontend Next.js render trực tiếp lên giao diện Dashboard.

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

