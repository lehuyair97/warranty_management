# 04. Hàm Người Dùng Tự Định Nghĩa (User-Defined Functions - UDF)

> **Hệ Quản Trị CSDL**: Microsoft SQL Server 2022  
> **Phân Loại**: Hàm vô hướng (Scalar Functions) & Hàm trả về bảng (Inline Table-Valued Functions - iTVF)  
> **Mục Đích**: Tái sử dụng logic tính toán tiền tệ, kiểm tra điều kiện bảo hành hợp lệ và trích xuất lịch sử sửa chữa thiết bị.

---

## 1. Bảng Tổng Hợp Danh Mục Functions

| Tên Hàm (Function) | Phân Loại | Tham Số Đầu Vào | Kiểu Trả Về | Mục Đích Nghiệp Vụ |
| :--- | :--- | :--- | :--- | :--- |
| `dbo.fn_calculate_ticket_parts_total` | **Scalar UDF** | `@ticket_id INT` | `DECIMAL(18,2)` | Tính tổng tiền các phụ tùng, linh kiện đã dùng trong phiếu sửa chữa |
| `dbo.fn_calculate_parts_total` | **Scalar UDF** | `@invoice_id INT` | `DECIMAL(18,2)` | Tính tổng tiền linh kiện đã xuất trên một hóa đơn thanh toán |
| `dbo.fn_is_device_under_warranty` | **Scalar UDF** | `@device_id INT`, `@check_date DATE` | `BIT` (1/0) | Xác định thiết bị còn trong thời hạn bảo hành chính hãng hay không |
| `dbo.fn_get_device_repair_history` | **Inline TVF** | `@device_id INT` | `TABLE` | Truy xuất toàn bộ lịch sử sửa chữa, KTV phụ trách và trạng thái thanh toán của thiết bị |

---

## 2. Chi Tiết Từng Hàm Nghiệp Vụ

### 2.1. `dbo.fn_calculate_ticket_parts_total`: Tính tổng tiền linh kiện theo phiếu sửa chữa
- **Loại hàm**: Scalar User-Defined Function.
- **Tham số**:
  - `@ticket_id INT`: Mã số phiếu sửa chữa cần tính.
- **Giá trị trả về**: `DECIMAL(18,2)` (Tổng tiền linh kiện VNĐ). Nếu phiếu chưa dùng linh kiện nào, hàm trả về `0.00` thông qua `ISNULL()`.
- **Ứng dụng**: Được gọi khi KTV chẩn đoán, xem chi phí ước tính, hoặc khi chuyển đổi dữ liệu từ phiếu sang hóa đơn quyết toán.

```sql
CREATE OR ALTER FUNCTION dbo.fn_calculate_ticket_parts_total (@ticket_id INT)
RETURNS DECIMAL(18,2)
AS
BEGIN
    RETURN ISNULL((
        SELECT SUM(quantity * unit_price)
        FROM ticket_items
        WHERE ticket_id = @ticket_id
    ), 0);
END;
GO
```

#### Ví dụ truy vấn:
```sql
SELECT id, ticket_type, dbo.fn_calculate_ticket_parts_total(id) AS parts_cost
FROM tickets
WHERE id = 10;
```

---

### 2.2. `dbo.fn_calculate_parts_total`: Tính tổng tiền linh kiện theo hóa đơn
- **Loại hàm**: Scalar User-Defined Function.
- **Tham số**:
  - `@invoice_id INT`: Mã số hóa đơn cần tính.
- **Giá trị trả về**: `DECIMAL(18,2)` (Tổng tiền phụ tùng tính vào hóa đơn).
- **Ứng dụng**: Dùng trong Stored Procedure đối soát tài chính (`sp_audit_invoices`) để kiểm tra xem `total_amount` đã khớp với tổng phụ tùng cộng tiền công trừ đi chiết khấu hay chưa.

```sql
CREATE OR ALTER FUNCTION dbo.fn_calculate_parts_total (@invoice_id INT)
RETURNS DECIMAL(18,2)
AS
BEGIN
    RETURN ISNULL((
        SELECT SUM(quantity * unit_price)
        FROM invoice_items
        WHERE invoice_id = @invoice_id
    ), 0);
END;
GO
```

---

### 2.3. `dbo.fn_is_device_under_warranty`: Kiểm tra hạn bảo hành thiết bị
- **Loại hàm**: Scalar User-Defined Function (Boolean Check).
- **Tham số**:
  - `@device_id INT`: Mã thiết bị cần kiểm tra.
  - `@check_date DATE`: Ngày tiếp nhận thiết bị gửi sửa.
- **Giá trị trả về**: `BIT` (`1` nếu còn hạn bảo hành, `0` nếu đã hết hạn hoặc không có thông tin).
- **Ứng dụng**: Phục vụ màn hình **Bàn tiếp nhận (POS)** khi khách mang máy đến, hệ thống tự động xác định máy có thuộc diện bảo hành miễn phí hay dịch vụ tính phí.

```sql
CREATE OR ALTER FUNCTION dbo.fn_is_device_under_warranty (@device_id INT, @check_date DATE)
RETURNS BIT
AS
BEGIN
    RETURN CAST(CASE WHEN EXISTS (
        SELECT 1 FROM devices
        WHERE id = @device_id
          AND is_under_warranty = 1
          AND warranty_expiry_date IS NOT NULL
          AND warranty_expiry_date >= @check_date
    ) THEN 1 ELSE 0 END AS BIT);
END;
GO
```

#### Ví dụ kiểm tra:
```sql
SELECT id, device_name, 
       dbo.fn_is_device_under_warranty(id, CAST(GETDATE() AS DATE)) AS is_valid_warranty
FROM devices;
```

---

### 2.4. `dbo.fn_get_device_repair_history`: Lịch sử bảo hành & sửa chữa của thiết bị
- **Loại hàm**: Inline Table-Valued Function (iTVF).
- **Tham số**:
  - `@device_id INT`: Mã định danh thiết bị.
- **Giá trị trả về**: Bảng kết hợp (`TABLE`) gồm các cột:
  - `ticket_id`: Mã phiếu sửa chữa.
  - `received_at`: Ngày giờ tiếp nhận.
  - `ticket_type`: Loại dịch vụ bảo hành/tính phí.
  - `issue_description`: Lỗi khách phản ánh.
  - `fault_cause`: Nguyên nhân lỗi do KTV phân tích.
  - `repair_solution`: Phương án đã khắc phục.
  - `ticket_status`: Trạng thái xử lý.
  - `technician_name`: Tên kỹ thuật viên xử lý.
  - `invoice_id`: Hóa đơn phát hành (nếu có).
  - `total_amount`: Số tiền đã thanh toán.
  - `payment_status`: Đã thanh toán (`paid`) hoặc chưa thanh toán (`unpaid`).
- **Ưu điểm kiến trúc**: Vì là **Inline TVF**, Query Optimizer của SQL Server có thể đẩy điều kiện tìm kiếm xuống và biên dịch chung với câu lệnh truy vấn chính (Query Plan Inlining), cho tốc độ vượt trội hơn nhiều so với Multi-statement TVF.

```sql
CREATE OR ALTER FUNCTION dbo.fn_get_device_repair_history (@device_id INT)
RETURNS TABLE
AS
RETURN
(
    SELECT t.id AS ticket_id,
           t.received_at,
           t.ticket_type,
           t.issue_description,
           t.fault_cause,
           t.repair_solution,
           t.status AS ticket_status,
           t.completed_at,
           tech.full_name AS technician_name,
           inv.id AS invoice_id,
           inv.total_amount,
           CASE WHEN inv.id IS NOT NULL THEN 'paid' ELSE 'unpaid' END AS payment_status
    FROM tickets t
    LEFT JOIN employees tech ON tech.id = t.technician_id
    LEFT JOIN invoices inv ON inv.ticket_id = t.id
    WHERE t.device_id = @device_id
);
GO
```

#### Ví dụ truy vấn hồ sơ máy:
```sql
-- Xem toàn bộ lịch sử sửa chữa của máy có id = 5
SELECT * FROM dbo.fn_get_device_repair_history(5)
ORDER BY received_at DESC;
```
