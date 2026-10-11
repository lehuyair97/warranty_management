# 05. Thủ Tục Lưu Trữ (Stored Procedures) Nghiệp Vụ Cốt Lõi

> **Hệ Quản Trị CSDL**: Microsoft SQL Server 2022  
> **Nguyên Tắc Thiết Kế**: Đóng gói toàn bộ nghiệp vụ cốt lõi tại Database Engine, tuân thủ nghiêm ngặt 4 thuộc tính **ACID** (Atomicity, Consistency, Isolation, Durability), bắt lỗi qua `BEGIN TRY...BEGIN CATCH` và ném mã lỗi có cấu trúc `THROW`.

---

## 1. Bảng Tổng Hợp Danh Mục Stored Procedures Nghiệp Vụ

| Tên Stored Procedure | Phân Hệ Nghiệp Vụ | Tham Số Chính | Mã Lỗi THROW | Mục Đích Nghiệp Vụ |
| :--- | :--- | :--- | :--- | :--- |
| `dbo.sp_receive_device` | **Lễ Tân (POS)** | `@device_id`, `@receptionist_id`, `@issue_description`, `@ticket_id OUTPUT` | `50010`, `50011` | Tiếp nhận máy tại quầy, tự động kiểm tra bảo hành và khởi tạo phiếu dịch vụ |
| `dbo.sp_process_ticket` | **Kỹ Thuật Viên** | `@ticket_id`, `@status`, `@technician_id`, `@fault_cause`, `@repair_solution`, `@estimated_cost` | `50020` - `50023` | Phân công KTV, cập nhật kết quả chẩn đoán và chuyển trạng thái sửa chữa |
| `dbo.sp_create_invoice` | **Thu Ngân / KTV** | `@ticket_id`, `@labor_fee`, `@invoice_id OUTPUT` | `50030` - `50032` | Khởi tạo hóa đơn thanh toán cho phiếu sửa chữa, tự động miễn giảm 100% nếu là bảo hành |
| `dbo.sp_add_invoice_part`| **Kỹ Thuật Viên** | `@invoice_id`, `@part_id`, `@quantity` | `50040` - `50044` | Xuất linh kiện từ kho vào hóa đơn (kích hoạt trigger trừ kho và cập nhật tổng tiền) |
| `dbo.sp_checkout_invoice`| **Quầy Thu Ngân** | `@invoice_id`, `@payment_method` | `50050`, `50052` | Quyết toán hóa đơn (`unpaid` $\rightarrow$ `paid`), lưu phương thức thanh toán và chuyển phiếu sang `delivered` |
| `dbo.sp_backup_database`| **Quản Trị Hệ Thống** | `@backup_dir`, `@file_name`, `@full_path OUTPUT` | `50060`, `50062` | Sao lưu toàn vẹn CSDL ra tệp `.bak` chuẩn với nén dữ liệu (`COMPRESSION`) |
| `dbo.sp_restore_database`| **Quản Trị Hệ Thống**| `@backup_path` | `50063`, `50064` | Phục hồi CSDL từ bản sao lưu trong ngữ cảnh `master` với `SINGLE_USER` |

---

## 2. Chi Tiết Từng Stored Procedure Nghiệp Vụ

### 2.1. `dbo.sp_receive_device`: Lập phiếu tiếp nhận thiết bị
- **Phân hệ**: Quầy Tiếp Nhận (Reception POS).
- **Quy trình nghiệp vụ**:
  1. Kiểm tra sự tồn tại của thiết bị (`devices.id`) $\rightarrow$ Báo lỗi `50010` nếu không tìm thấy.
  2. Kiểm tra vai trò nhân viên lập phiếu phải là `receptionist` hoặc `manager` $\rightarrow$ Báo lỗi `50011` nếu sai quyền.
  3. **Tự động nhận diện bảo hành**: Nếu loại phiếu truyền vào là `repair`, procedure sẽ gọi hàm UDF `dbo.fn_is_device_under_warranty`. Nếu máy còn hạn bảo hành hợp lệ, hệ thống tự động đổi loại phiếu thành `warranty` để khách được hưởng chính sách bảo hành miễn phí.
  4. Chèn dòng mới vào bảng `tickets` với trạng thái ban đầu là `received`.
  5. Trả về mã phiếu vừa tạo qua tham số `OUTPUT @ticket_id`.

```sql
CREATE OR ALTER PROCEDURE dbo.sp_receive_device
    @device_id         INT,
    @receptionist_id   INT,
    @issue_description NVARCHAR(500),
    @initial_condition NVARCHAR(200) = NULL,
    @accessories      NVARCHAR(200) = NULL,
    @ticket_type       VARCHAR(20)   = 'repair',
    @ticket_id         INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM devices WHERE id = @device_id)
        THROW 50010, N'Device not found.', 1;

    IF NOT EXISTS (SELECT 1 FROM employees WHERE id = @receptionist_id AND role IN ('receptionist', 'manager'))
        THROW 50011, N'Invalid receptionist or manager employee.', 1;

    -- Tự động nhận diện bảo hành
    IF @ticket_type = 'repair' AND dbo.fn_is_device_under_warranty(@device_id, CAST(GETDATE() AS DATE)) = 1
        SET @ticket_type = 'warranty';

    INSERT INTO tickets (
        device_id, receptionist_id, ticket_type, issue_description,
        initial_condition, accessories, received_at, status
    )
    VALUES (
        @device_id, @receptionist_id, @ticket_type, @issue_description,
        @initial_condition, @accessories, GETDATE(), 'received'
    );

    SET @ticket_id = SCOPE_IDENTITY();
END;
GO
```

---

### 2.2. `dbo.sp_process_ticket`: Phân công & cập nhật tiến trình sửa chữa
- **Phân hệ**: Bàn Kỹ Thuật (Technician Workbench) & Quản lý kỹ thuật.
- **Quy trình nghiệp vụ**:
  1. Kiểm tra phiếu tồn tại $\rightarrow$ Báo lỗi `50020`.
  2. Xác thực tính hợp lệ của trạng thái mới thuộc danh mục cho phép (`received`, `inspecting`, `waiting_for_parts`, `repairing`, `completed`, `delivered`, `cancelled`) $\rightarrow$ Báo lỗi `50021`.
  3. Kiểm tra nhân viên được phân công phải có vai trò `technician` $\rightarrow$ Báo lỗi `50022`.
  4. Ràng buộc: Không được chuyển trạng thái vượt khỏi `received` nếu phiếu chưa được phân công kỹ thuật viên $\rightarrow$ Báo lỗi `50023`.
  5. Cập nhật các trường chẩn đoán (`fault_cause`), phương án (`repair_solution`), chi phí ước tính (`estimated_cost`) và trạng thái phiếu.

```sql
CREATE OR ALTER PROCEDURE dbo.sp_process_ticket
    @ticket_id         INT,
    @status            VARCHAR(30),
    @technician_id     INT           = NULL,
    @fault_cause       NVARCHAR(500) = NULL,
    @repair_solution   NVARCHAR(500) = NULL,
    @estimated_cost    DECIMAL(18,2) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @current_tech INT, @current_status VARCHAR(30);

    SELECT @current_tech = technician_id, @current_status = status
    FROM tickets WHERE id = @ticket_id;

    IF @current_status IS NULL
        THROW 50020, N'Ticket not found.', 1;

    IF @status NOT IN ('received', 'inspecting', 'waiting_for_parts', 'repairing', 'completed', 'delivered', 'cancelled')
        THROW 50021, N'Invalid ticket status.', 1;

    IF @technician_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM employees WHERE id = @technician_id AND role = 'technician')
        THROW 50022, N'Invalid technician employee.', 1;

    IF @status <> 'received' AND @current_tech IS NULL AND @technician_id IS NULL
        THROW 50023, N'A technician must be assigned before advancing ticket status.', 1;

    UPDATE tickets
    SET technician_id   = ISNULL(@technician_id, technician_id),
        fault_cause     = ISNULL(@fault_cause, fault_cause),
        repair_solution = ISNULL(@repair_solution, repair_solution),
        estimated_cost  = ISNULL(@estimated_cost, estimated_cost),
        status          = @status,
        updated_at      = GETDATE()
    WHERE id = @ticket_id;
END;
GO
```

---

### 2.3. `dbo.sp_create_invoice`: Khởi tạo hóa đơn cho phiếu sửa chữa
- **Phân hệ**: Quản lý Hóa đơn & Bàn Kỹ thuật.
- **Quy trình nghiệp vụ**:
  1. Kiểm tra sự tồn tại của phiếu sửa chữa $\rightarrow$ Báo lỗi `50030`.
  2. Tiền công kỹ thuật không được là số âm (`labor_fee >= 0`) $\rightarrow$ Báo lỗi `50031`.
  3. Đảm bảo mỗi phiếu chỉ có duy nhất 1 hóa đơn đang ở trạng thái chưa thanh toán (`status = 'unpaid'`) $\rightarrow$ Báo lỗi `50032`.
  4. **Chính sách ưu đãi tự động**: Nếu phiếu thuộc diện bảo hành (`warranty`) hoặc sửa lại (`re_repair`), tự động miễn giảm 100% tiền công (`discount_amount = labor_fee`).
  5. Chèn bản ghi hóa đơn mới vào bảng `invoices` với trạng thái `unpaid`.

```sql
CREATE OR ALTER PROCEDURE dbo.sp_create_invoice
    @ticket_id    INT,
    @labor_fee    DECIMAL(18,2) = 0,
    @invoice_id   INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM tickets WHERE id = @ticket_id)
        THROW 50030, N'Ticket not found.', 1;

    IF @labor_fee < 0
        THROW 50031, N'Labor fee cannot be negative.', 1;

    IF EXISTS (SELECT 1 FROM invoices WHERE ticket_id = @ticket_id AND status = 'unpaid')
        THROW 50032, N'An unpaid invoice already exists for this ticket.', 1;

    DECLARE @ticket_type VARCHAR(20), @discount DECIMAL(18,2) = 0;
    SELECT @ticket_type = ticket_type FROM tickets WHERE id = @ticket_id;

    -- Tự động miễn phí 100% tiền công nếu là diện bảo hành hoặc sửa lại
    IF @ticket_type IN ('warranty', 're_repair')
        SET @discount = @labor_fee;

    INSERT INTO invoices (ticket_id, created_at, status, labor_fee, discount_amount, total_amount)
    VALUES (@ticket_id, GETDATE(), 'unpaid', @labor_fee, @discount, @labor_fee - @discount);

    SET @invoice_id = SCOPE_IDENTITY();
END;
GO
```

---

### 2.4. `dbo.sp_add_invoice_part`: Xuất linh kiện vào hóa đơn
- **Phân hệ**: Bàn Kỹ Thuật (Technician Workbench).
- **Quy trình nghiệp vụ**:
  1. Kiểm tra hóa đơn tồn tại $\rightarrow$ Báo lỗi `50040`.
  2. Cấm thêm linh kiện vào hóa đơn đã hoàn tất thanh toán (`status = 'paid'`) $\rightarrow$ Báo lỗi `50041`.
  3. Kiểm tra tính hợp lệ của số lượng xuất (`quantity > 0`) $\rightarrow$ Báo lỗi `50042`.
  4. Kiểm tra linh kiện tồn tại trong kho $\rightarrow$ Báo lỗi `50043`.
  5. Kiểm tra tồn kho khả dụng $\rightarrow$ Báo lỗi `50044` nếu thiếu hàng trong kho.
  6. Nếu linh kiện đã có sẵn trong hóa đơn, tự động cộng dồn số lượng (`quantity = quantity + @quantity`). Nếu chưa có, tạo bản ghi mới trong `invoice_items`.
  7. *Lưu ý*: Lệnh chèn/sửa trên bảng `invoice_items` sẽ kích hoạt Trigger `trg_invoice_items_stock` tự động trừ số lượng tồn kho trong bảng `parts`, đồng thời kích hoạt `trg_invoices_total_amount` tự động tính lại tổng tiền hóa đơn.

```sql
CREATE OR ALTER PROCEDURE dbo.sp_add_invoice_part
    @invoice_id INT,
    @part_id    INT,
    @quantity   INT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @unit_price DECIMAL(18,2), @stock INT, @inv_status VARCHAR(30);

    SELECT @inv_status = status FROM invoices WHERE id = @invoice_id;
    IF @inv_status IS NULL
        THROW 50040, N'Invoice not found.', 1;
    IF @inv_status = 'paid'
        THROW 50041, N'Cannot add parts to an already paid invoice.', 1;
    IF @quantity <= 0
        THROW 50042, N'Quantity must be greater than zero.', 1;

    SELECT @unit_price = price, @stock = stock_quantity
    FROM parts WHERE id = @part_id;

    IF @unit_price IS NULL
        THROW 50043, N'Spare part not found.', 1;
    IF @stock < @quantity
        THROW 50044, N'Insufficient stock inventory.', 1;

    -- Nếu đã có linh kiện thì cộng dồn số lượng, ngược lại chèn mới
    IF EXISTS (SELECT 1 FROM invoice_items WHERE invoice_id = @invoice_id AND part_id = @part_id)
    BEGIN
        UPDATE invoice_items
        SET quantity = quantity + @quantity
        WHERE invoice_id = @invoice_id AND part_id = @part_id;
    END
    ELSE
    BEGIN
        INSERT INTO invoice_items (invoice_id, part_id, quantity, unit_price)
        VALUES (@invoice_id, @part_id, @quantity, @unit_price);
    END

    SELECT id AS invoice_id, labor_fee, discount_amount, total_amount 
    FROM invoices WHERE id = @invoice_id;
END;
GO
```

---

### 2.5. `dbo.sp_checkout_invoice`: Quyết toán thanh toán thu ngân
- **Phân hệ**: Quầy Thu Ngân (Cashier Desk).
- **Quy trình nghiệp vụ**:
  1. Kiểm tra hóa đơn tồn tại $\rightarrow$ Báo lỗi `50050`.
  2. Ràng buộc: Chỉ cho phép quyết toán thanh toán khi quá trình sửa chữa đã hoàn thành (`ticket.status IN ('completed', 'delivered')`) $\rightarrow$ Báo lỗi `50052`.
  3. **Giao dịch nguyên tử (ACID Transaction)**:
     - Cập nhật hóa đơn sang trạng thái `paid`, lưu phương thức thanh toán (`cash`, `bank_transfer`, `credit_card`) và mốc thời gian `paid_at = GETDATE()`.
     - Tự động chuyển trạng thái phiếu sang `delivered` (đã bàn giao khách).
     - `COMMIT` giao dịch an toàn; nếu có bất kỳ lỗi nào xảy ra sẽ lập tức `ROLLBACK`.

```sql
CREATE OR ALTER PROCEDURE dbo.sp_checkout_invoice
    @invoice_id     INT,
    @payment_method VARCHAR(30) = 'cash'
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @ticket_id INT, @inv_status VARCHAR(30), @ticket_status VARCHAR(30);

    SELECT @ticket_id = inv.ticket_id, @inv_status = inv.status, @ticket_status = t.status
    FROM invoices inv
    JOIN tickets t ON t.id = inv.ticket_id
    WHERE inv.id = @invoice_id;

    IF @ticket_id IS NULL
        THROW 50050, N'Invoice not found.', 1;
    IF @ticket_status NOT IN ('completed', 'delivered')
        THROW 50052, N'Checkout only allowed when repair is completed.', 1;

    BEGIN TRY
        BEGIN TRAN;
            UPDATE invoices 
            SET status = 'paid', 
                payment_method = @payment_method, 
                paid_at = ISNULL(paid_at, GETDATE()),
                updated_at = GETDATE()
            WHERE id = @invoice_id;

            -- Chuyển trạng thái phiếu sang delivered
            UPDATE tickets 
            SET status = 'delivered', updated_at = GETDATE() 
            WHERE id = @ticket_id AND status <> 'delivered';
        COMMIT;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK;
        THROW;
    END CATCH
END;
GO
```

---

### 2.6. `dbo.sp_backup_database` & `dbo.sp_restore_database`: Quản trị an toàn dữ liệu

#### A. Sao lưu CSDL (`dbo.sp_backup_database`):
- Thực hiện sao lưu Full Backup ra ổ đĩa với cờ nén `COMPRESSION` giúp tiết kiệm 70% dung lượng đĩa và tăng tốc độ I/O.
- Tự động sinh tên file theo định dạng: `warranty_management_YYYYMMDD_HHMMSS.bak`.

```sql
CREATE OR ALTER PROCEDURE dbo.sp_backup_database
    @backup_dir  NVARCHAR(260) = NULL,
    @file_name   NVARCHAR(260) = NULL,
    @full_path   NVARCHAR(500) = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @backup_dir = ISNULL(@backup_dir, N'/var/opt/mssql/backup');
    
    IF @file_name IS NULL
    BEGIN
        DECLARE @dt VARCHAR(30) = CONVERT(VARCHAR(8), GETDATE(), 112) + '_' + REPLACE(CONVERT(VARCHAR(8), GETDATE(), 108), ':', '');
        SET @file_name = N'warranty_management_' + @dt + N'.bak';
    END

    SET @full_path = @backup_dir + N'/' + @file_name;

    BEGIN TRY
        BACKUP DATABASE warranty_management
        TO DISK = @full_path
        WITH FORMAT, INIT, COMPRESSION, STATS = 10;
        
        SELECT @full_path AS backup_file_path, GETDATE() AS backed_up_at;
    END TRY
    BEGIN CATCH
        DECLARE @err NVARCHAR(2048) = ERROR_MESSAGE();
        THROW 50062, @err, 1;
    END CATCH
END;
GO
```

#### B. Khôi phục CSDL (`dbo.sp_restore_database`):
- Chạy trong ngữ cảnh cơ sở dữ liệu `master`.
- Tự động chuyển CSDL sang chế độ `SINGLE_USER WITH ROLLBACK IMMEDIATE` để ngắt toàn bộ kết nối hiện hữu của backend, tránh lỗi xung đột tài nguyên khi phục hồi.
- Sau khi `RESTORE DATABASE` hoàn tất thành công, tự động mở lại chế độ `MULTI_USER`.

```sql
USE master;
GO

CREATE OR ALTER PROCEDURE dbo.sp_restore_database
    @backup_path NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;

    IF @backup_path IS NULL OR LEN(@backup_path) = 0
        THROW 50063, N'Backup path cannot be empty.', 1;

    BEGIN TRY
        -- Ngắt kết nối hiện tại để độc quyền phục hồi
        ALTER DATABASE warranty_management SET SINGLE_USER WITH ROLLBACK IMMEDIATE;

        RESTORE DATABASE warranty_management 
        FROM DISK = @backup_path 
        WITH REPLACE;

        -- Khôi phục chế độ đa người dùng
        ALTER DATABASE warranty_management SET MULTI_USER;

        SELECT 
            'Database warranty_management restored successfully' AS message,
            @backup_path AS restored_from,
            GETDATE() AS restored_at;
    END TRY
    BEGIN CATCH
        IF DB_ID('warranty_management') IS NOT NULL
        BEGIN
            BEGIN TRY
                ALTER DATABASE warranty_management SET MULTI_USER;
            END TRY
            BEGIN CATCH
            END CATCH;
        END;

        DECLARE @restore_err NVARCHAR(2048) = ERROR_MESSAGE();
        THROW 50064, @restore_err, 1;
    END CATCH;
END;
GO

USE warranty_management;
GO
```
