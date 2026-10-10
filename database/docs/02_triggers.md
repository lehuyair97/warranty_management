# 02. Cơ Chế Triggers Nghiệp Vụ & Khóa Bất Biến CSDL

> **Hệ Quản Trị CSDL**: Microsoft SQL Server 2022  
> **Cơ Chế Thực Thi**: DML Triggers (`AFTER INSERT, UPDATE, DELETE`)  
> **Mục Đích**: Tự động hóa kiểm soát luồng trạng thái, quản lý tồn kho nguyên tử, ghi vết lịch sử kiểm toán và bảo vệ tính bất biến của hóa đơn tài chính.

---

## 1. Bảng Tổng Hợp Danh Mục Triggers

| Tên Trigger | Bảng Giám Sát | Sự Kiện Kích Hoạt | Mục Đích Nghiệp Vụ | Mã Lỗi THROW |
| :--- | :--- | :--- | :--- | :--- |
| `trg_ticket_items_stock` | `ticket_items` | `AFTER INSERT, UPDATE, DELETE` | Tự động trừ/hoàn tồn kho trong bảng `parts`; cấm âm kho | `50001` |
| `trg_tickets_workflow_guard` | `tickets` | `AFTER INSERT, UPDATE` | Ràng buộc KTV phụ trách; kiểm soát tính hợp lệ của luồng trạng thái | `50003`, `50004` |
| `trg_tickets_audit_history` | `tickets` | `AFTER INSERT, UPDATE` | Tự động ghi vết mọi chuyển đổi trạng thái vào `ticket_status_history` | - |
| `trg_invoice_items_freeze_paid` | `invoice_items` | `AFTER UPDATE, DELETE` | Khóa bất biến: cấm sửa hoặc xóa linh kiện đã xuất trên hóa đơn | `50035` |
| `trg_invoices_freeze_paid_amounts` | `invoices` | `AFTER UPDATE` | Khóa bất biến tài chính: cấm thay đổi công thợ, tiền giảm, tổng tiền | `50036` |

---

## 2. Chi Tiết Từng Trigger Nghiệp Vụ

### 2.1. `trg_ticket_items_stock`: Tự động trừ / hoàn kho linh kiện
- **Bảng giám sát**: `ticket_items`
- **Sự kiện**: `AFTER INSERT, UPDATE, DELETE`
- **Nguyên lý hoạt động**:
  1. Khi kỹ thuật viên thêm linh kiện vào phiếu sửa chữa (`INSERT`), số lượng cần xuất mang dấu dương ($+\Delta$).
  2. Khi gỡ linh kiện khỏi phiếu (`DELETE`), số lượng hoàn kho mang dấu âm ($-\Delta$).
  3. Sử dụng cấu trúc Table Variable `@delta` gom nhóm theo `part_id` bằng mệnh đề `UNION ALL` giữa `inserted` và `deleted`.
  4. Kiểm tra tồn kho khả dụng `p.stock_quantity < d.delta`: nếu không đủ hàng trong kho, lập tức `ROLLBACK TRANSACTION` và ném mã lỗi `50001`.
  5. Cập nhật trừ tồn kho tức thì `stock_quantity = stock_quantity - delta` và cập nhật `updated_at = GETDATE()`.

```sql
CREATE OR ALTER TRIGGER trg_ticket_items_stock
ON ticket_items AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted)
        RETURN;

    DECLARE @delta TABLE (part_id INT PRIMARY KEY, delta INT);

    INSERT INTO @delta (part_id, delta)
    SELECT part_id, SUM(delta)
    FROM (
        SELECT part_id, quantity AS delta FROM inserted
        UNION ALL
        SELECT part_id, -quantity AS delta FROM deleted
    ) x
    GROUP BY part_id
    HAVING SUM(delta) <> 0;

    -- Kiểm tra tồn kho khả dụng
    IF EXISTS (
        SELECT 1 FROM @delta d
        JOIN parts p ON p.id = d.part_id
        WHERE p.stock_quantity < d.delta
    )
    BEGIN
        ROLLBACK TRANSACTION;
        THROW 50001, N'Insufficient spare part inventory stock.', 1;
    END

    -- Cập nhật trừ/hoàn kho nguyên tử
    UPDATE p
    SET stock_quantity = p.stock_quantity - d.delta,
        updated_at = GETDATE()
    FROM parts p
    JOIN @delta d ON d.part_id = p.id;
END;
GO
```

---

### 2.2. `trg_tickets_workflow_guard`: Người gác cổng State Machine
- **Bảng giám sát**: `tickets`
- **Sự kiện**: `AFTER INSERT, UPDATE`
- **Nguyên lý hoạt động**:
  1. **Ràng buộc Kỹ thuật viên**: Nếu phiếu được đẩy sang các trạng thái yêu cầu nghiệp vụ chuyên sâu (`repairing`, `completed`, `paid`, `delivered`) nhưng `technician_id IS NULL`, trigger sẽ chặn lại và báo lỗi `50003`.
  2. **Bảo vệ luồng tiến trạng thái (Linear forward progression)**:
     - Phiếu đã bàn giao cho khách (`delivered`) là trạng thái kết thúc cuối cùng, cấm tuyệt đối việc mở lại (`reopen`) sang bất kỳ trạng thái nào khác.
     - Phiếu chỉ được chuyển sang `delivered` khi đã ở trạng thái `completed` hoặc `paid`. Nếu nhảy cóc từ `received` sang `delivered` sẽ bị chặn với mã lỗi `50004`.
  3. **Tự động gắn dấu thời gian `completed_at`**: Khi phiếu chuyển sang `completed`, `paid`, hoặc `delivered` mà trường `completed_at` đang rỗng, trigger tự động cập nhật `completed_at = GETDATE()` một cách an toàn không gây vòng lặp đệ quy.

```sql
CREATE OR ALTER TRIGGER trg_tickets_workflow_guard
ON tickets AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Bắt buộc có KTV phụ trách trước khi sửa hoặc hoàn tất
    IF EXISTS (
        SELECT 1 FROM inserted i
        WHERE i.status IN ('repairing', 'completed', 'paid', 'delivered')
          AND i.technician_id IS NULL
    )
    BEGIN
        ROLLBACK TRANSACTION;
        THROW 50003, N'A technician must be assigned before advancing to repairing or completed.', 1;
    END

    -- 2. Kiểm soát chuyển đổi trạng thái hợp lệ
    IF UPDATE(status)
       AND EXISTS (
           SELECT 1 FROM inserted i
           JOIN deleted d ON d.id = i.id
           WHERE (d.status = 'delivered' AND i.status <> 'delivered')
              OR (i.status = 'delivered' AND d.status NOT IN ('completed', 'paid', 'delivered'))
       )
    BEGIN
        ROLLBACK TRANSACTION;
        THROW 50004, N'Invalid ticket status transition.', 1;
    END

    -- 3. Tự động gán completed_at an toàn
    IF NOT UPDATE(completed_at)
    BEGIN
        UPDATE t
        SET completed_at = CASE WHEN GETDATE() < t.received_at THEN t.received_at ELSE GETDATE() END,
            updated_at = GETDATE()
        FROM tickets t
        JOIN inserted i ON i.id = t.id
        WHERE i.status IN ('completed', 'paid', 'delivered')
          AND t.completed_at IS NULL;
    END
END;
GO
```

---

### 2.3. `trg_tickets_audit_history`: Tự động ghi vết nhật ký trạng thái
- **Bảng giám sát**: `tickets`
- **Sự kiện**: `AFTER INSERT, UPDATE`
- **Nguyên lý hoạt động**:
  1. Khi một phiếu mới được tạo (`INSERT`), trigger tự động chèn một dòng vào `ticket_status_history` với `old_status = NULL` và `new_status = i.status`.
  2. Khi cập nhật phiếu (`UPDATE`) và trạng thái thay đổi (`d.status <> i.status`), trigger tự động chụp lại `old_status`, `new_status`, mã KTV thực hiện và mốc thời gian `created_at = GETDATE()`.
  3. Hoạt động hoàn toàn tự động ở tầng CSDL, ứng dụng Backend không cần phải viết thêm mã chèn log thủ công.

```sql
CREATE OR ALTER TRIGGER trg_tickets_audit_history
ON tickets AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    -- Trường hợp INSERT: Ghi nhận trạng thái khởi tạo
    IF NOT EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO ticket_status_history (ticket_id, old_status, new_status, technician_id, created_at)
        SELECT i.id, NULL, i.status, i.technician_id, GETDATE()
        FROM inserted i;
    END
    -- Trường hợp UPDATE: Ghi nhận vết chuyển đổi trạng thái
    ELSE IF UPDATE(status)
    BEGIN
        INSERT INTO ticket_status_history (ticket_id, old_status, new_status, technician_id, created_at)
        SELECT i.id, d.status, i.status, i.technician_id, GETDATE()
        FROM inserted i
        JOIN deleted d ON d.id = i.id
        WHERE d.status <> i.status;
    END
END;
GO
```

---

### 2.4. `trg_invoice_items_freeze_paid`: Khóa bất biến linh kiện hóa đơn
- **Bảng giám sát**: `invoice_items`
- **Sự kiện**: `AFTER UPDATE, DELETE`
- **Mục đích**: Bảo đảm tính toàn vẹn kế toán. Một khi hóa đơn đã được lập và ghi nhận, không ai được phép sửa đổi số lượng hoặc xóa linh kiện khỏi hóa đơn.
- **Xử lý**: Nếu phát hiện thao tác `UPDATE` hoặc `DELETE` tác động vào các dòng của bảng `invoice_items`, trigger lập tức `ROLLBACK TRANSACTION` và ném mã lỗi `50035`.

```sql
CREATE OR ALTER TRIGGER trg_invoice_items_freeze_paid
ON invoice_items AFTER UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1 
        FROM (SELECT invoice_id FROM inserted UNION SELECT invoice_id FROM deleted) x
        JOIN invoices inv ON inv.id = x.invoice_id
    )
    BEGIN
        ROLLBACK TRANSACTION;
        THROW 50035, N'Cannot modify or remove spare parts on an already issued invoice.', 1;
    END
END;
GO
```

---

### 2.5. `trg_invoices_freeze_paid_amounts`: Khóa bất biến số liệu tài chính
- **Bảng giám sát**: `invoices`
- **Sự kiện**: `AFTER UPDATE`
- **Mục đích**: Ngăn ngừa gian lận tài chính. Tuyệt đối cấm chỉnh sửa các trường tiền tệ (`labor_fee`, `discount_amount`, `total_amount`) sau khi hóa đơn đã phát hành.
- **Xử lý**: So sánh dữ liệu trước (`deleted`) và sau (`inserted`). Nếu phát hiện sai khác ở bất kỳ cột tài chính nào, transaction sẽ bị hủy bỏ ngay lập tức và trả về mã lỗi `50036`.

```sql
CREATE OR ALTER TRIGGER trg_invoices_freeze_paid_amounts
ON invoices AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1 FROM inserted i
        JOIN deleted d ON d.id = i.id
        WHERE (
            d.labor_fee <> i.labor_fee 
            OR d.discount_amount <> i.discount_amount 
            OR d.total_amount <> i.total_amount
        )
    )
    BEGIN
        ROLLBACK TRANSACTION;
        THROW 50036, N'Financial data of a paid invoice is immutable and cannot be altered or reversed.', 1;
    END
END;
GO
```

---

## 3. Bảng Mã Lỗi T-SQL THROW & Phản Hồi Hệ Thống

| THROW Code | Thông Báo Lỗi Từ CSDL | HTTP Code | Giải Thích & Tác Động Giao Diện |
| :--- | :--- | :--- | :--- |
| `50001` | *Insufficient spare part inventory stock.* | `400 Bad Request` | Số lượng tồn kho không đủ để xuất linh kiện. Toast thông báo cảnh báo hết hàng. |
| `50003` | *A technician must be assigned before advancing to repairing or completed.* | `400 Bad Request` | Chưa gán kỹ thuật viên phụ trách phiếu trước khi bắt đầu sửa chữa. |
| `50004` | *Invalid ticket status transition.* | `400 Bad Request` | Chuyển đổi trạng thái sai quy trình (ví dụ nhảy cóc hoặc mở lại phiếu đã trả máy). |
| `50035` | *Cannot modify or remove spare parts on an already issued invoice.* | `403 Forbidden` | Cố tình sửa đổi hoặc xóa phụ tùng trên hóa đơn đã phát hành. |
| `50036` | *Financial data of a paid invoice is immutable and cannot be altered or reversed.* | `403 Forbidden` | Cố tình sửa tiền công hoặc tổng tiền hóa đơn đã thanh toán. |
