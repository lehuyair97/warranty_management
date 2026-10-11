# 02. Cơ Chế Triggers Nghiệp Vụ & Khóa Bất Biến CSDL

> **Hệ Quản Trị CSDL**: Microsoft SQL Server 2022  
> **Cơ Chế Thực Thi**: DML Triggers (`AFTER INSERT, UPDATE, DELETE`)  
> **Mục Đích**: Tự động hóa kiểm soát luồng trạng thái, quản lý tồn kho nguyên tử, tính toán doanh thu động, ghi vết lịch sử kiểm toán và bảo vệ tính bất biến của hóa đơn tài chính trong mô hình 8 bảng.

---

## 1. Bảng Tổng Hợp Danh Mục Triggers (5 Trọng Tâm + 2 Bổ Trợ)

### 🌟 Nhóm 1: TOP 5 Trigger Trọng Tâm Thuyết Trình (Core Highlights)
| STT | Tên Trigger | Bảng Giám Sát | Sự Kiện Kích Hoạt | Trọng Tâm Nghiệp Vụ | Mã Lỗi |
| :---: | :--- | :--- | :--- | :--- | :---: |
| 1 | `trg_invoice_items_stock` | `invoice_items` | `AFTER INSERT, UPDATE, DELETE` | **Quản lý kho**: Trừ/hoàn tồn kho thời gian thực, cấm âm kho | `50001` |
| 2 | `trg_invoices_total_amount` | `invoice_items` | `AFTER INSERT, UPDATE, DELETE` | **Tài chính**: Tự động tính tổng tiền, chiết khấu 100% nếu là bảo hành | - |
| 3 | `trg_tickets_workflow_guard` | `tickets` | `AFTER INSERT, UPDATE` | **Máy trạng thái**: Chặn nhảy cóc, cấm sửa phiếu đã trả, ép có KTV | `50003`, `50004` |
| 4 | `trg_tickets_audit_history` | `tickets` | `AFTER INSERT, UPDATE` | **Kiểm toán**: Tự động chụp log lịch sử trạng thái & KTV thao tác | - |
| 5 | `trg_invoices_freeze_paid_amounts` | `invoices` | `AFTER UPDATE` | **Khóa tài chính**: Cấm sửa tiền/hoàn trạng thái hóa đơn đã thanh toán | `50036` |

### 🛡️ Nhóm 2: 2 Trigger Bổ Trợ Toàn Vẹn Mở Rộng (Optional / Supplementary)
| STT | Tên Trigger | Bảng Giám Sát | Sự Kiện Kích Hoạt | Mục Đích Nghiệp Vụ Bổ Trợ | Mã Lỗi |
| :---: | :--- | :--- | :--- | :--- | :---: |
| 6 | `trg_invoices_labor_update` | `invoices` | `AFTER INSERT, UPDATE` | Tự động đồng bộ lại tổng tiền khi sửa tiền công hoặc chiết khấu trên hóa đơn | - |
| 7 | `trg_invoice_items_freeze_paid` | `invoice_items` | `AFTER INSERT, UPDATE, DELETE` | Khóa bất biến: cấm thêm/sửa/xóa dòng linh kiện trên hóa đơn đã thanh toán | `50035` |

---

## 2. Chi Tiết Từng Trigger Nghiệp Vụ

### 2.1. TOP 5 Trigger Trọng Tâm Thuyết Trình (Core Presentation Highlights)

> 🎯 **Khuyến nghị bảo vệ**: Tập trung thuyết trình và demo 5 trigger trọng tâm này để đại diện trọn vẹn cho 5 trụ cột bảo mật & nghiệp vụ của hệ thống: **Kho hàng $\rightarrow$ Tài chính $\rightarrow$ State Machine $\rightarrow$ Nhật ký Audit $\rightarrow$ Khóa bất biến tài chính**.

#### 2.1.1. `trg_invoice_items_stock`: Tự động trừ / hoàn kho linh kiện
- **Bảng giám sát**: `invoice_items`
- **Sự kiện**: `AFTER INSERT, UPDATE, DELETE`
- **Nguyên lý hoạt động**:
  1. Khi kỹ thuật viên xuất linh kiện vào hóa đơn (`INSERT`), số lượng cần xuất mang dấu dương ($+\Delta$).
  2. Khi gỡ linh kiện khỏi hóa đơn (`DELETE`), số lượng hoàn kho mang dấu âm ($-\Delta$).
  3. Sử dụng cấu trúc Table Variable `@delta` gom nhóm theo `part_id` bằng mệnh đề `UNION ALL` giữa `inserted` và `deleted`.
  4. Kiểm tra tồn kho khả dụng `p.stock_quantity < d.delta`: nếu không đủ hàng trong kho, lập tức `ROLLBACK TRANSACTION` và ném mã lỗi `50001`.
  5. Cập nhật trừ tồn kho tức thì `stock_quantity = stock_quantity - delta` và cập nhật `updated_at = GETDATE()`.

```sql
CREATE OR ALTER TRIGGER trg_invoice_items_stock
ON invoice_items AFTER INSERT, UPDATE, DELETE
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

#### 2.1.2. `trg_invoices_total_amount`: Tự động tính toán tổng tiền hóa đơn theo linh kiện
- **Bảng giám sát**: `invoice_items`
- **Sự kiện**: `AFTER INSERT, UPDATE, DELETE`
- **Nguyên lý hoạt động**:
  1. Mỗi khi có thao tác thêm, cập nhật số lượng, hoặc xóa linh kiện trong `invoice_items`, trigger thu thập toàn bộ các `invoice_id` bị ảnh hưởng bằng CTE `affected_invoices`.
  2. Gọi hàm nội tại `dbo.fn_calculate_parts_total(inv.id)` để lấy tổng giá trị linh kiện hiện hành.
  3. Nếu phiếu thuộc diện bảo hành (`ticket_type IN ('warranty', 're_repair')`), trigger tự động cập nhật `discount_amount = labor_fee + parts_cost` và `total_amount = 0`.
  4. Ngược lại, cập nhật trường `total_amount = MAX(0, labor_fee + parts_cost - discount_amount)` trên hóa đơn `unpaid` và làm mới `updated_at = GETDATE()`.

```sql
CREATE OR ALTER TRIGGER trg_invoices_total_amount
ON invoice_items AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    ;WITH affected_invoices AS (
        SELECT invoice_id FROM inserted
        UNION
        SELECT invoice_id FROM deleted
    )
    UPDATE inv
    SET inv.discount_amount = CASE 
            WHEN t.ticket_type IN ('warranty', 're_repair') 
            THEN inv.labor_fee + dbo.fn_calculate_parts_total(inv.id)
            ELSE inv.discount_amount 
        END,
        inv.total_amount = CASE 
            WHEN t.ticket_type IN ('warranty', 're_repair') THEN 0
            WHEN (inv.labor_fee + dbo.fn_calculate_parts_total(inv.id) - (CASE WHEN t.ticket_type IN ('warranty', 're_repair') THEN inv.labor_fee + dbo.fn_calculate_parts_total(inv.id) ELSE inv.discount_amount END)) < 0 THEN 0
            ELSE (inv.labor_fee + dbo.fn_calculate_parts_total(inv.id) - (CASE WHEN t.ticket_type IN ('warranty', 're_repair') THEN inv.labor_fee + dbo.fn_calculate_parts_total(inv.id) ELSE inv.discount_amount END))
        END,
        inv.updated_at = GETDATE()
    FROM invoices inv
    JOIN tickets t ON t.id = inv.ticket_id
    JOIN affected_invoices a ON a.invoice_id = inv.id
    WHERE inv.status = 'unpaid';
END;
GO
```

#### 2.1.3. `trg_tickets_workflow_guard`: Người gác cổng State Machine của phiếu
- **Bảng giám sát**: `tickets`
- **Sự kiện**: `AFTER INSERT, UPDATE`
- **Nguyên lý hoạt động**:
  1. **Ràng buộc Kỹ thuật viên**: Nếu phiếu được đẩy sang các trạng thái yêu cầu nghiệp vụ chuyên sâu (`repairing`, `completed`, `delivered`) nhưng `technician_id IS NULL`, trigger sẽ chặn lại và báo lỗi `50003`.
  2. **Bảo vệ luồng tiến trạng thái (Linear forward progression)**:
     - Phiếu đã bàn giao cho khách (`delivered`) là trạng thái kết thúc cuối cùng, cấm tuyệt đối việc mở lại (`reopen`) sang bất kỳ trạng thái nào khác.
     - Phiếu đã hoàn tất sửa chữa (`completed`) có thể được thanh toán thủ công (`sp_checkout_invoice`) để chuyển sang `delivered`.
     - Phiếu chỉ được chuyển sang `delivered` khi đã ở trạng thái `completed`. Nếu nhảy cóc từ `received` sang `delivered` sẽ bị chặn với mã lỗi `50004`.
  3. **Tự động gắn dấu thời gian `completed_at`**: Khi phiếu chuyển sang `completed` hoặc `delivered` mà trường `completed_at` đang rỗng, trigger tự động cập nhật `completed_at = GETDATE()` một cách an toàn không gây vòng lặp đệ quy.

```sql
CREATE OR ALTER TRIGGER trg_tickets_workflow_guard
ON tickets AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Bắt buộc có KTV phụ trách trước khi sửa hoặc hoàn tất
    IF EXISTS (
        SELECT 1 FROM inserted i
        WHERE i.status IN ('repairing', 'completed', 'delivered')
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
              OR (i.status = 'delivered' AND d.status NOT IN ('completed', 'delivered'))
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
        WHERE i.status IN ('completed', 'delivered')
          AND t.completed_at IS NULL;
    END
END;
GO
```

---

#### 2.1.4. `trg_tickets_audit_history`: Tự động ghi vết nhật ký trạng thái
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

#### 2.1.5. `trg_invoices_freeze_paid_amounts`: Khóa bất biến số liệu tài chính hóa đơn đã thanh toán
- **Bảng giám sát**: `invoices`
- **Sự kiện**: `AFTER UPDATE`
- **Mục đích**: Ngăn ngừa gian lận tài chính. Tuyệt đối cấm chỉnh sửa các trường tiền tệ (`labor_fee`, `discount_amount`, `total_amount`) hoặc hoàn ngược trạng thái (`status <> 'paid'`) sau khi hóa đơn đã thanh toán.
- **Xử lý**: So sánh dữ liệu trước (`deleted`) và sau (`inserted`). Nếu phát hiện sai khác ở bất kỳ cột tài chính nào hoặc cố tình đổi trạng thái khi đã `paid`, transaction sẽ bị hủy bỏ ngay lập tức và trả về mã lỗi `50036`.

```sql
CREATE OR ALTER TRIGGER trg_invoices_freeze_paid_amounts
ON invoices AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1 FROM inserted i
        JOIN deleted d ON d.id = i.id
        WHERE d.status = 'paid'
          AND (
            d.labor_fee <> i.labor_fee 
            OR d.discount_amount <> i.discount_amount 
            OR d.total_amount <> i.total_amount
            OR i.status <> 'paid'
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

### 2.2. Các Trigger Bổ Trợ Toàn Vẹn Mở Rộng (Optional / Supplementary Safeguards)

> 💡 **Khuyến nghị sử dụng khi bảo vệ**: Đây là 2 trigger lớp bảo vệ thứ hai (Secondary Guards). Nếu thời gian thuyết trình có hạn, nhóm có thể lướt qua hoặc chỉ trình bày khi thầy cô trong hội đồng hỏi sâu về tính toàn vẹn đa tầng.

#### 2.2.1. `trg_invoices_labor_update`: Đồng bộ tổng tiền khi đổi tiền công / chiết khấu
- **Bảng giám sát**: `invoices`
- **Sự kiện**: `AFTER INSERT, UPDATE`
- **Nguyên lý hoạt động**:
  1. Khi người dùng cập nhật trường tiền công `labor_fee` hoặc trường chiết khấu `discount_amount` trên hóa đơn, trigger tự động tính toán lại `total_amount`.
  2. Nếu phiếu thuộc diện bảo hành (`warranty`, `re_repair`), tự động đồng bộ `discount_amount = labor_fee + parts_cost` và giữ `total_amount = 0`.
  3. Đảm bảo tổng tiền `total_amount` luôn luôn nhất quán với công thức kế toán `total_amount = labor_fee + parts_total - discount_amount` trên các hóa đơn `unpaid`.

```sql
CREATE OR ALTER TRIGGER trg_invoices_labor_update
ON invoices AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM deleted) OR UPDATE(labor_fee) OR UPDATE(discount_amount)
    BEGIN
        UPDATE inv
        SET inv.discount_amount = CASE 
                WHEN t.ticket_type IN ('warranty', 're_repair') 
                THEN inv.labor_fee + dbo.fn_calculate_parts_total(inv.id)
                ELSE inv.discount_amount 
            END,
            inv.total_amount = CASE 
                WHEN t.ticket_type IN ('warranty', 're_repair') THEN 0
                WHEN (inv.labor_fee + dbo.fn_calculate_parts_total(inv.id) - (CASE WHEN t.ticket_type IN ('warranty', 're_repair') THEN inv.labor_fee + dbo.fn_calculate_parts_total(inv.id) ELSE inv.discount_amount END)) < 0 THEN 0
                ELSE (inv.labor_fee + dbo.fn_calculate_parts_total(inv.id) - (CASE WHEN t.ticket_type IN ('warranty', 're_repair') THEN inv.labor_fee + dbo.fn_calculate_parts_total(inv.id) ELSE inv.discount_amount END))
            END,
            inv.updated_at = GETDATE()
        FROM invoices inv
        JOIN tickets t ON t.id = inv.ticket_id
        JOIN inserted i ON i.id = inv.id
        WHERE inv.status = 'unpaid';
    END
END;
GO
```

---

#### 2.2.2. `trg_invoice_items_freeze_paid`: Khóa bất biến linh kiện hóa đơn đã thanh toán
- **Bảng giám sát**: `invoice_items`
- **Sự kiện**: `AFTER INSERT, UPDATE, DELETE`
- **Mục đích**: Bảo đảm tính toàn vẹn kế toán. Một khi hóa đơn đã được thanh toán (`inv.status = 'paid'`), cấm tuyệt đối việc thêm linh kiện, sửa đổi số lượng hoặc xóa linh kiện khỏi hóa đơn.
- **Xử lý**: Nếu phát hiện thao tác `INSERT`, `UPDATE` hoặc `DELETE` tác động vào các linh kiện thuộc hóa đơn có `status = 'paid'`, trigger lập tức `ROLLBACK TRANSACTION` và ném mã lỗi `50035`.

```sql
CREATE OR ALTER TRIGGER trg_invoice_items_freeze_paid
ON invoice_items AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1 
        FROM (SELECT invoice_id FROM inserted UNION SELECT invoice_id FROM deleted) x
        JOIN invoices inv ON inv.id = x.invoice_id
        WHERE inv.status = 'paid'
    )
    BEGIN
        ROLLBACK TRANSACTION;
        THROW 50035, N'Cannot add, modify, or remove spare parts on an already paid invoice.', 1;
    END
END;
GO
```

---

## 3. Bảng Mã Lỗi T-SQL THROW & Phản Hồi Hệ Thống

| THROW Code | Thông Báo Lỗi Từ CSDL | HTTP Code | Giải Thích & Tác Động Giao Diện |
| :---: | :--- | :---: | :--- |
| `50001` | *Insufficient spare part inventory stock.* | `400 Bad Request` | Số lượng tồn kho không đủ để xuất linh kiện. Báo cảnh báo hết hàng cho KTV. |
| `50003` | *A technician must be assigned before advancing to repairing or completed.* | `400 Bad Request` | Chưa gán kỹ thuật viên phụ trách phiếu trước khi bắt đầu sửa chữa hoặc hoàn tất. |
| `50004` | *Invalid ticket status transition.* | `400 Bad Request` | Chuyển đổi trạng thái sai quy trình (ví dụ nhảy cóc, mở lại phiếu đã trả khách). |
| `50035` | *Cannot add, modify, or remove spare parts on an already paid invoice.* | `403 Forbidden` | Cố tình thêm, sửa hoặc xóa phụ tùng trên hóa đơn đã thanh toán. |
| `50036` | *Financial data of a paid invoice is immutable and cannot be altered or reversed.* | `403 Forbidden` | Cố tình sửa tiền công, tiền giảm giá, hoặc hoàn ngược trạng thái hóa đơn đã thanh toán. |
