# Database Architecture: Triggers & Financial Immutability

> **Mục tiêu kiến trúc**: Chuyển giao các ràng buộc nghiệp vụ quan trọng nhất xuống thẳng tầng Database Engine (SQL Server Triggers).  
> **Nguyên tắc "Zero-Trust Data Integrity"**: Cho dù tầng Backend có bị bỏ qua, lỗi code hoặc bị can thiệp trái phép, Database vẫn đảm bảo không thể sửa số liệu tài chính đã thanh toán, không bị âm kho và không chuyển trạng thái sai quy trình.

---

## 1. Bảng Tổng Hợp 7 Database Triggers

| # | Tên Trigger | Bảng Tác Động | Sự Kiện Kích Hoạt | Mã Lỗi THROW | Mục Đích Nghiệp Vụ |
|:---:|:---|:---|:---|:---:|:---|
| 1 | `trg_invoice_items_stock` | `invoice_items` | `AFTER INSERT, UPDATE, DELETE` | **`50001`** | Tự động cộng/trừ tồn kho `parts.stock_quantity`, hủy giao dịch nếu không đủ hàng xuất. |
| 2 | `trg_invoices_total_amount` | `invoice_items` | `AFTER INSERT, UPDATE, DELETE` | — | Tự động tính toán lại `invoices.total_amount` khi danh mục linh kiện biến động. |
| 3 | `trg_invoices_labor_update` | `invoices` | `AFTER INSERT, UPDATE` | — | Tự động cập nhật `total_amount` khi tiền công (`labor_fee`) hoặc chiết khấu (`discount_amount`) thay đổi. |
| 4 | `trg_tickets_workflow_guard` | `tickets` | `AFTER INSERT, UPDATE` | **`50003`**<br/>**`50004`** | Bảo vệ luồng trạng thái tuyến tính, bắt buộc phân công KTV khi sửa và tự động điền `completed_at`. |
| 5 | `trg_tickets_audit_history` | `tickets` | `AFTER INSERT, UPDATE` | — | Tự động bắt sự kiện đổi trạng thái và ghi vết lịch sử vào bảng `ticket_status_history`. |
| 6 | `trg_invoice_items_freeze_paid` | `invoice_items` | `AFTER INSERT, UPDATE, DELETE` | **`50035`** | **Khóa tài chính cấp dòng**: Cấm tuyệt đối thêm, bớt hoặc sửa linh kiện của hóa đơn đã thanh toán (`paid`). |
| 7 | `trg_invoices_freeze_paid_amounts` | `invoices` | `AFTER UPDATE` | **`50036`** | **Khóa tài chính cấp hóa đơn**: Cấm sửa đổi số tiền và cấm đảo ngược trạng thái hóa đơn từ `paid` về `unpaid`. |

---

## 2. Phân Tích Kỹ Thuật Từng Trigger

### 2.1 Trigger `trg_invoice_items_stock` — Kiểm Soát Xuất/Nhập Kho Tự Động
- **Bảng**: `dbo.invoice_items`
- **Sự kiện**: `AFTER INSERT, UPDATE, DELETE`
- **Logic thực thi**:
  1. Khi một linh kiện được thêm vào hóa đơn (`INSERT`), trigger trừ số lượng tương ứng trong `parts.stock_quantity`.
  2. Khi sửa số lượng (`UPDATE`), trigger tính toán độ chênh lệch (`Delta = new_qty - old_qty`) để điều chỉnh tồn kho.
  3. Khi xóa khỏi hóa đơn (`DELETE`), trigger tự động hoàn trả số lượng linh kiện về kho.
  4. Nếu tồn kho sau điều chỉnh bị âm (`stock_quantity < 0`), giao dịch lập tức bị `ROLLBACK` và ném mã lỗi `50001`.

```sql
-- Đoạn mã kiểm tra điều kiện âm kho
IF EXISTS (SELECT 1 FROM dbo.parts WHERE stock_quantity < 0)
BEGIN
    ROLLBACK TRANSACTION;
    THROW 50001, N'Không đủ số lượng linh kiện trong kho để xuất sử dụng!', 1;
END;
```

---

### 2.2 Trigger `trg_invoices_total_amount` & `trg_invoices_labor_update` — Tự Động Tính Tiền Hóa Đơn
- **Bảng**: `dbo.invoice_items` và `dbo.invoices`
- **Logic thực thi**:
  - Không dựa vào ứng dụng FE/BE tính toán tổng tiền (nhằm chống giả mạo request).
  - Công thức tính toán tại Database:
    $$\text{Total Amount} = \max(0, \text{labor\_fee} - \text{discount\_amount}) + \sum(\text{quantity} \times \text{unit\_price})$$
  - Sử dụng Scalar Function `dbo.fn_calculate_parts_total(invoice_id)` để đảm bảo tính nhất quán.

---

### 2.3 Trigger `trg_tickets_workflow_guard` — State Machine & Tuân Thủ Quy Trình
- **Bảng**: `dbo.tickets`
- **Sự kiện**: `AFTER INSERT, UPDATE`
- **Luật kiểm soát (Business Rules)**:
  1. **Bắt buộc Kỹ thuật viên (Mã lỗi 50003)**:
     - Khi phiếu chuyển sang các trạng thái kỹ thuật: `inspecting` (Kiểm tra), `waiting_for_parts` (Chờ linh kiện), `repairing` (Đang sửa), hoặc `completed` (Hoàn tất) mà trường `technician_id IS NULL`, giao dịch sẽ bị chặn ngay lập tức.
  2. **Tiến trình tuyến tính (Mã lỗi 50004)**:
     - Không cho phép chuyển trực tiếp sang `delivered` (Đã giao máy) nếu trạng thái trước đó chưa phải là `completed` (Đã sửa xong).
     - Không cho phép mở lại phiếu (Re-open) một khi máy đã bàn giao xong cho khách hàng (`status = 'delivered'`).
  3. **Tự động hóa dấu mốc thời gian**:
     - Khi trạng thái chuyển sang `completed` hoặc `delivered`, trigger tự động cập nhật `completed_at = GETDATE()`.

---

### 2.4 Trigger `trg_tickets_audit_history` — Giám Sát Vết Lịch Sử Phiếu
- **Bảng**: `dbo.tickets`
- **Sự kiện**: `AFTER INSERT, UPDATE`
- **Logic thực thi**:
  - So sánh bảng ảo `inserted` và `deleted`.
  - Chỉ khi cột `status` thực sự thay đổi giá trị, trigger mới thực hiện `INSERT` bản ghi mới vào bảng `ticket_status_history` gồm: `ticket_id`, `old_status`, `new_status`, `technician_id` và thời điểm xảy ra.

---

### 2.5 Cặp Trigger "Bất Biến Tài Chính" (Financial Immutability)

> [!IMPORTANT]
> **Đây là tính năng chuẩn ERP/Kế toán doanh nghiệp cao cấp nhất trong hệ thống:**

#### 1. Trigger `trg_invoice_items_freeze_paid` (Khóa dòng chi tiết)
```sql
CREATE OR ALTER TRIGGER dbo.trg_invoice_items_freeze_paid
ON dbo.invoice_items
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Nếu thao tác trên hóa đơn đã PAID -> Chặn toàn bộ
    IF EXISTS (
        SELECT 1
        FROM dbo.invoices i
        WHERE i.id IN (
            SELECT invoice_id FROM inserted UNION SELECT invoice_id FROM deleted
        )
        AND i.status = 'paid'
    )
    BEGIN
        ROLLBACK TRANSACTION;
        THROW 50035, N'Hóa đơn đã được thanh toán! Nghiêm cấm thay đổi hoặc gắn thêm linh kiện.', 1;
    END;
END;
```

#### 2. Trigger `trg_invoices_freeze_paid_amounts` (Khóa số tiền hóa đơn)
```sql
CREATE OR ALTER TRIGGER dbo.trg_invoices_freeze_paid_amounts
ON dbo.invoices
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- 1. Cấm đổi trạng thái từ paid quay lại unpaid
    IF EXISTS (
        SELECT 1 FROM deleted d
        JOIN inserted i ON d.id = i.id
        WHERE d.status = 'paid' AND i.status <> 'paid'
    )
    BEGIN
        ROLLBACK TRANSACTION;
        THROW 50036, N'Không thể hủy trạng thái đã thanh toán của hóa đơn!', 1;
    END;

    -- 2. Cấm can thiệp thay đổi tiền công, chiết khấu hoặc tổng tiền khi đã paid
    IF EXISTS (
        SELECT 1 FROM deleted d
        JOIN inserted i ON d.id = i.id
        WHERE d.status = 'paid'
        AND (d.labor_fee <> i.labor_fee OR d.discount_amount <> i.discount_amount OR d.total_amount <> i.total_amount)
    )
    BEGIN
        ROLLBACK TRANSACTION;
        THROW 50036, N'Hóa đơn đã thanh toán bị khóa số liệu tài chính bất biến!', 1;
    END;
END;
```

---

## 3. Bảng Tra Cứu Mã Lỗi Database (T-SQL Error Mapping Table)

Backend NestJS ([AllExceptionsFilter](file:///Users/lehuyair/Documents/UIT/warranty_management/backend/src/common/filters/all-exceptions.filter.ts)) tự động bắt các mã lỗi do DB ném ra để trả về HTTP status code chuẩn cho Client:

| Mã Lỗi T-SQL | HTTP Status Code | Mã Lỗi Chuẩn API | Thông Điệp Người Dùng |
|:---:|:---:|:---|:---|
| **`50001`** | `422 Unprocessable Entity` | `INSUFFICIENT_STOCK` | Không đủ số lượng linh kiện trong kho để xuất sử dụng! |
| **`50002`** | `400 Bad Request` | `INVALID_ROLE` | Vai trò nhân viên không phù hợp để thực hiện thao tác! |
| **`50003`** | `400 Bad Request` | `TECHNICIAN_REQUIRED` | Phiếu đang ở giai đoạn sửa chữa bắt buộc phải chỉ định kỹ thuật viên! |
| **`50004`** | `409 Conflict` | `INVALID_WORKFLOW_STATE` | Không thể giao máy khi chưa sửa xong hoặc cố tình mở lại phiếu đã hoàn tất! |
| **`50035`** | `422 Unprocessable Entity` | `INVOICE_LOCKED_ITEMS` | Hóa đơn đã được thanh toán! Nghiêm cấm thay đổi hoặc gắn thêm linh kiện. |
| **`50036`** | `422 Unprocessable Entity` | `INVOICE_LOCKED_FINANCIAL` | Hóa đơn đã thanh toán bị khóa số liệu tài chính bất biến! |

---

## 4. Kịch Bản Kiểm Thử Trigger (Trigger Test Scenarios)

### Kịch bản 1: Thử xuất quá tồn kho (Test Trigger 50001)
```sql
-- Giả sử linh kiện ID 1 chỉ còn 2 cái trong kho
INSERT INTO dbo.invoice_items (invoice_id, part_id, quantity, unit_price)
VALUES (1, 1, 9999, 150000);
-- Kết quả kỳ vọng: Giao dịch bị ROLLBACK, lỗi 50001 xuất hiện.
```

### Kịch bản 2: Thử gian lận sửa tiền hóa đơn đã thanh toán (Test Trigger 50036)
```sql
-- Giả sử hóa đơn ID 1 có status = 'paid'
UPDATE dbo.invoices
SET total_amount = 0
WHERE id = 1;
-- Kết quả kỳ vọng: Giao dịch bị ROLLBACK, lỗi 50036 xuất hiện.
```
