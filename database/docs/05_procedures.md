# 05. Thủ Tục Lưu Trữ (Stored Procedures) Nghiệp Vụ Cốt Lõi

> **Hệ Quản Trị CSDL**: Microsoft SQL Server 2022  
> **Nguyên Tắc Thiết Kế**: Đóng gói toàn bộ nghiệp vụ cốt lõi tại Database Engine, tuân thủ nghiêm ngặt 4 thuộc tính **ACID** (Atomicity, Consistency, Isolation, Durability), bắt lỗi qua `BEGIN TRY...BEGIN CATCH` và ném mã lỗi có cấu trúc `THROW`.

---

## 1. Bảng Tổng Hợp Danh Mục Stored Procedures Nghiệp Vụ

| Tên Stored Procedure | Phân Hệ Nghiệp Vụ | Tham Số Chính | Mã Lỗi THROW | Mục Đích Nghiệp Vụ |
| :--- | :--- | :--- | :--- | :--- |
| `dbo.sp_receive_device` | **Lễ Tân (POS)** | `@device_id`, `@receptionist_id`, `@issue_description`, `@ticket_id OUTPUT` | `50010`, `50011` | Tiếp nhận máy tại quầy, tự động kiểm tra bảo hành và khởi tạo phiếu dịch vụ |
| `dbo.sp_process_ticket` | **Kỹ Thuật Viên** | `@ticket_id`, `@status`, `@technician_id`, `@fault_cause`, `@repair_solution` | `50020` - `50023` | Phân công KTV, cập nhật kết quả chẩn đoán và chuyển trạng thái sửa chữa |
| `dbo.sp_add_ticket_part`| **Kỹ Thuật Viên** | `@ticket_id`, `@part_id`, `@quantity` | `50040` - `50044` | Xuất linh kiện từ kho gắn vào phiếu sửa chữa (kích hoạt trigger trừ kho) |
| `dbo.sp_checkout_ticket`| **Quầy Thu Ngân** | `@ticket_id`, `@labor_fee`, `@payment_method`, `@invoice_id OUTPUT` | `50030`, `50032` | Quyết toán thanh toán, sinh hóa đơn, tự động miễn giảm bảo hành và khóa phiếu |
| `dbo.sp_backup_database`| **Quản Trị Hệ Thống** | `@backup_dir`, `@file_name`, `@full_path OUTPUT` | `50060`, `50062` | Sao lưu toàn vẹn CSDL ra tệp `.bak` chuẩn với nén dữ liệu (`COMPRESSION`) |
| `dbo.sp_restore_database`| **Quản Trị Hệ Thống**| `@backup_path` | `50063`, `50064` | Phục hồi CSDL từ bản sao lưu trong ngữ cảnh `master` với `SINGLE_USER` |

---

## 2. Chi Tiết Từng Stored Procedure Nghiệp Vụ

### 2.1. `dbo.sp_receive_device`: Lập phiếu tiếp nhận thiết bị
- **Phân hệ**: Quầy Tiếp Nhận (Reception POS).
- **Quy trình nghiệp vụ**:
  1. Kiểm tra sự tồn tại của thiết bị (`devices.id`) $\rightarrow$ Báo lỗi `50010` nếu không tìm thấy.
  2. Kiểm tra vai trò nhân viên lập phiếu phải là `receptionist` hoặc `manager` $\rightarrow$ Báo lỗi `50011` nếu sai quyền.
  3. **Tự động nhận diện bảo hành**: Nếu loại phiếu truyền vào là `repair`, procedure sẽ gọi hàm UDF `dbo.fn_is_device_under_warranty`. Nếu máy còn hạn bảo hành hợp lệ, hệ thống tự động đổi loại phiếu thành `warranty` để khách được hưởng chính sách miễn phí 100%.
  4. Chèn dòng mới vào bảng `tickets` với trạng thái ban đầu là `received`.
  5. Trả về mã phiếu vừa tạo qua tham số `OUTPUT @ticket_id`.

```sql
CREATE OR ALTER PROCEDURE dbo.sp_receive_device
    @device_id         INT,
    @receptionist_id   INT,
    @issue_description NVARCHAR(500),
    @initial_condition NVARCHAR(200) = NULL,
    @accessories       NVARCHAR(200) = NULL,
    @ticket_type       VARCHAR(20)   = 'repair',
    @ticket_id         INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM devices WHERE id = @device_id)
        THROW 50010, N'Device not found.', 1;

    IF NOT EXISTS (SELECT 1 FROM employees WHERE id = @receptionist_id AND role IN ('receptionist', 'manager'))
        THROW 50011, N'Invalid receptionist or manager employee.', 1;

    -- Tự động chuyển thành 'warranty' nếu thiết bị còn hạn bảo hành
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

### 2.2. `dbo.sp_process_ticket`: Cập nhật tiến độ & chẩn đoán KTV
- **Phân hệ**: Bàn Kỹ Thuật (Technician Workbench).
- **Quy trình nghiệp vụ**:
  1. Kiểm tra sự tồn tại của phiếu sửa chữa $\rightarrow$ Báo lỗi `50020`.
  2. Kiểm tra danh mục trạng thái hợp lệ $\rightarrow$ Báo lỗi `50021`.
  3. Kiểm tra nhân sự phụ trách có đúng là kỹ thuật viên (`role = 'technician'`) $\rightarrow$ Báo lỗi `50022`.
  4. Ràng buộc KTV: Không cho phép đẩy trạng thái ra khỏi `received` nếu phiếu chưa được phân công kỹ thuật viên phụ trách $\rightarrow$ Báo lỗi `50023`.
  5. Cập nhật các thông tin chẩn đoán kỹ thuật (`fault_cause`, `repair_solution`, `estimated_cost`) và trạng thái mới.

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

    IF @status NOT IN ('received', 'inspecting', 'waiting_for_parts', 'repairing', 'completed', 'paid', 'delivered', 'cancelled')
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

### 2.3. `dbo.sp_add_ticket_part`: Xuất linh kiện vào phiếu sửa chữa
- **Phân hệ**: Bàn Kỹ Thuật (Technician Workbench).
- **Quy trình nghiệp vụ**:
  1. Kiểm tra trạng thái phiếu: Cấm tuyệt đối việc thêm linh kiện vào phiếu đã quyết toán hoặc hủy (`paid`, `delivered`, `cancelled`) $\rightarrow$ Báo lỗi `50041`.
  2. Kiểm tra tính hợp lệ của số lượng xuất (`quantity > 0`) $\rightarrow$ Báo lỗi `50042`.
  3. Kiểm tra linh kiện tồn tại trong kho $\rightarrow$ Báo lỗi `50043`.
  4. Kiểm tra tồn kho khả dụng $\rightarrow$ Báo lỗi `50044` nếu thiếu hàng.
  5. Nếu linh kiện đã có sẵn trong phiếu, tự động cộng dồn số lượng (`quantity = quantity + @quantity`). Nếu chưa có, tạo bản ghi mới trong `ticket_items`.
  6. *Lưu ý*: Lệnh chèn/sửa trên bảng `ticket_items` sẽ kích hoạt Trigger `trg_ticket_items_stock` tự động trừ số lượng tồn kho trong bảng `parts`.

```sql
CREATE OR ALTER PROCEDURE dbo.sp_add_ticket_part
    @ticket_id INT,
    @part_id   INT,
    @quantity  INT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @unit_price DECIMAL(18,2), @stock INT, @ticket_status VARCHAR(30);

    SELECT @ticket_status = status FROM tickets WHERE id = @ticket_id;
    IF @ticket_status IS NULL
        THROW 50040, N'Ticket not found.', 1;
    IF @ticket_status IN ('paid', 'delivered', 'cancelled')
        THROW 50041, N'Cannot add parts to an already settled ticket.', 1;
    IF @quantity <= 0
        THROW 50042, N'Quantity must be greater than zero.', 1;

    SELECT @unit_price = price, @stock = stock_quantity
    FROM parts WHERE id = @part_id;

    IF @unit_price IS NULL
        THROW 50043, N'Spare part not found.', 1;
    IF @stock < @quantity
        THROW 50044, N'Insufficient stock inventory.', 1;

    IF EXISTS (SELECT 1 FROM ticket_items WHERE ticket_id = @ticket_id AND part_id = @part_id)
    BEGIN
        UPDATE ticket_items
        SET quantity = quantity + @quantity
        WHERE ticket_id = @ticket_id AND part_id = @part_id;
    END
    ELSE
    BEGIN
        INSERT INTO ticket_items (ticket_id, part_id, quantity, unit_price)
        VALUES (@ticket_id, @part_id, @quantity, @unit_price);
    END
END;
GO
```

---

### 2.4. `dbo.sp_checkout_ticket`: Quyết toán thanh toán thu ngân
- **Phân hệ**: Quầy Thu Ngân (Cashier Desk).
- **Quy trình nghiệp vụ**:
  1. Kiểm tra phiếu tồn tại $\rightarrow$ Báo lỗi `50030`.
  2. Đảm bảo mỗi phiếu chỉ được xuất đúng 1 hóa đơn duy nhất $\rightarrow$ Báo lỗi `50032` nếu hóa đơn đã tồn tại.
  3. **Chính sách ưu đãi tự động**:
     - Nếu phiếu là `warranty` (bảo hành) hoặc `re_repair` (sửa lại do lỗi cũ), hệ thống tự động thiết lập mức chiết khấu:
       $$\text{discount} = \text{labor\_fee} + \text{parts\_total}$$
       Dẫn đến tổng thực thanh toán $\text{total\_amount} = 0$.
     - Nếu là dịch vụ thông thường (`out_of_warranty`), tính đủ: $\text{labor\_fee} + \text{parts\_total}$.
  4. **Giao dịch nguyên tử (ACID Transaction)**:
     - Tạo hóa đơn mới trong bảng `invoices` với `paid_at = GETDATE()`.
     - Sao chép toàn bộ linh kiện từ bảng `ticket_items` sang bảng quyết toán tài chính `invoice_items`.
     - Cập nhật trạng thái phiếu sửa chữa: `UPDATE tickets SET status = 'paid'`.
     - `COMMIT` giao dịch an toàn; nếu có bất kỳ lỗi nào xảy ra sẽ lập tức `ROLLBACK`.

```sql
CREATE OR ALTER PROCEDURE dbo.sp_checkout_ticket
    @ticket_id      INT,
    @labor_fee      DECIMAL(18,2) = 0,
    @payment_method VARCHAR(30) = 'cash',
    @cashier_id     INT = NULL,
    @invoice_id     INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM tickets WHERE id = @ticket_id)
        THROW 50030, N'Ticket not found.', 1;

    IF EXISTS (SELECT 1 FROM invoices WHERE ticket_id = @ticket_id)
        THROW 50032, N'An invoice already exists for this ticket.', 1;

    DECLARE @ticket_type VARCHAR(20), @discount DECIMAL(18,2) = 0, @parts_total DECIMAL(18,2) = 0;
    SELECT @ticket_type = ticket_type FROM tickets WHERE id = @ticket_id;
    SELECT @parts_total = dbo.fn_calculate_ticket_parts_total(@ticket_id);

    -- Tự động miễn phí 100% tiền công và linh kiện nếu là diện bảo hành
    IF @ticket_type IN ('warranty', 're_repair')
    BEGIN
        SET @discount = @labor_fee + @parts_total;
    END

    DECLARE @total DECIMAL(18,2) = @labor_fee + @parts_total - @discount;
    IF @total < 0 SET @total = 0;

    BEGIN TRY
        BEGIN TRAN;
            INSERT INTO invoices (ticket_id, created_at, labor_fee, discount_amount, total_amount, payment_method, paid_at)
            VALUES (@ticket_id, GETDATE(), @labor_fee, @discount, @total, @payment_method, GETDATE());

            SET @invoice_id = SCOPE_IDENTITY();

            -- Sao chép danh mục linh kiện sang chi tiết hóa đơn
            INSERT INTO invoice_items (invoice_id, part_id, quantity, unit_price)
            SELECT @invoice_id, part_id, quantity, unit_price
            FROM ticket_items
            WHERE ticket_id = @ticket_id;

            -- Cập nhật trạng thái phiếu đã thanh toán
            UPDATE tickets 
            SET status = 'paid', updated_at = GETDATE() 
            WHERE id = @ticket_id;

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

### 2.5. `dbo.sp_backup_database` & `dbo.sp_restore_database`: Quản trị an toàn dữ liệu

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
