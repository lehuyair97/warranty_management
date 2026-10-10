# 08. Báo Cáo Thống Kê & Phân Tích Dữ Liệu (Executive Reports)

> **Hệ Quản Trị CSDL**: Microsoft SQL Server 2022  
> **Cơ Chế Trích Xuất**: T-SQL Aggregations, Window Functions, Conditional Grouping & Stored Procedures  
> **Tầng Hiển Thị**: Executive Dashboard ([http://localhost:3000/dashboard](http://localhost:3000/dashboard))

---

## 1. Tổng Quan Danh Mục Báo Cáo Thống Kê

Tài liệu này mô tả chi tiết các nhóm báo cáo thống kê chính được trích xuất từ cơ sở dữ liệu và hiển thị trên Executive Dashboard. Toàn bộ các câu lệnh SQL dưới đây được **trích xuất chính xác 100% từ mã nguồn Backend (`reports.service.ts`)** của hệ thống:

| STT | Báo Cáo Thống Kê | Loại Trực Quan Hóa | Mục Đích Nghiệp Vụ | Kỹ Thuật SQL Sử Dụng |
| :---: | :--- | :--- | :--- | :--- |
| **01** | **Chỉ số Vận hành Tổng quan** | KPI Metrics Cards | Nắm bắt nhanh quy mô, số ca đang xử lý, doanh thu và cảnh báo tồn kho | `COUNT`, `SUM`, Lọc điều kiện `IN` |
| **02** | **Xu hướng Tiếp nhận & Doanh thu** | Dual-axis Line Chart | Đánh giá tăng trưởng qua chuỗi thời gian 6 tháng gần nhất | `FORMAT(..., 'yyyy-MM')`, `DATEADD`, `GROUP BY` |
| **03** | **Cơ cấu Trạng thái Dịch vụ** | Donut / Pie Chart | Kiểm soát tỷ lệ ca sửa chữa phân bổ theo từng giai đoạn vòng đời | `GROUP BY status`, `COUNT(id)` |
| **04** | **Top Linh Kiện Tiêu Hao** | Leaderboard Table | Quản trị tồn kho, lập kế hoạch nhập hàng theo Top phụ tùng thay nhiều nhất | `INNER JOIN`, `SUM(quantity)`, Đa tiêu chí sắp xếp |
| **05** | **Năng suất Kỹ Thuật Viên** | Leaderboard Table | Vinh danh KTV có năng suất sửa chữa cao nhất, tỷ lệ hoàn tất công việc | `Conditional Aggregation (SUM CASE WHEN)` |
| **06** | **Cảnh báo Trễ Hạn Tiến độ SLA** | Overdue Alert Cards | Chỉ đích danh các ca bảo hành xử lý vượt quá thời gian cam kết (> 14 ngày) | `Stored Procedure` + `CURSOR LOCAL FAST_FORWARD` |

---

## 2. Chi Tiết Từng Báo Cáo & Đoạn Mã T-SQL (Snippets)

### 2.1. Report 1: Báo Cáo Chỉ Số Vận Hành Tổng Quan (Executive KPI Overview)
- **Mục đích**: Cung cấp bức tranh toàn cảnh về sức khỏe của trung tâm bảo hành: tổng số phiếu tiếp nhận, số ca đang được xử lý, số ca đã hoàn tất, tổng doanh thu thực thu từ khách và cảnh báo linh kiện chạm ngưỡng an toàn.
- **Dữ liệu hiển thị (Metrics)**:
  - `totalTickets`: Tổng số phiếu tiếp nhận từ trước đến nay.
  - `activeTickets`: Số ca đang trong tiến trình sửa (`received`, `inspecting`, `waiting_for_parts`, `repairing`).
  - `completedTickets`: Số ca đã sửa chữa xong chờ khách lấy.
  - `deliveredTickets`: Số ca đã giao trả máy thành công.
  - `totalRevenue`: Tổng tiền thực thu từ tất cả các hóa đơn.
  - `lowStockPartsCount`: Số mặt hàng linh kiện có tồn kho $\le 5$.

#### Đoạn mã T-SQL (SQL Snippet):
```sql
-- 1. Tổng số phiếu tiếp nhận
SELECT COUNT(*) AS totalTickets FROM dbo.tickets;

-- 2. Số lượng phiếu đang trong quá trình xử lý (Active)
SELECT COUNT(*) AS activeTickets 
FROM dbo.tickets 
WHERE status IN ('received', 'inspecting', 'waiting_for_parts', 'repairing');

-- 3. Số ca đã hoàn thành sửa chữa & Số ca đã bàn giao
SELECT COUNT(*) AS completedTickets FROM dbo.tickets WHERE status = 'completed';
SELECT COUNT(*) AS deliveredTickets FROM dbo.tickets WHERE status = 'delivered';

-- 4. Tổng doanh thu thực tế từ hóa đơn thanh toán
SELECT ISNULL(SUM(total_amount), 0) AS totalRevenue 
FROM dbo.invoices;

-- 5. Số lượng linh kiện chạm ngưỡng cảnh báo sắp hết hàng (<= 5 đơn vị)
SELECT COUNT(*) AS lowStockPartsCount 
FROM dbo.parts 
WHERE stock_quantity <= 5;
```

---

### 2.2. Report 2: Báo Cáo Xu Hướng Hoạt Động & Doanh Thu (Monthly Trends - 6 Tháng)
- **Mục đích**: Phân tích chuỗi thời gian 6 tháng gần nhất để Ban quản trị đánh giá tốc độ tăng trưởng ca sửa chữa so với dòng tiền thực thu.
- **Cơ chế xử lý**: SQL Server trích xuất nhãn tháng `yyyy-MM` bằng hàm `FORMAT()`, kết hợp tính toán lùi 5 tháng so với đầu tháng hiện tại qua `DATEADD()`.

#### Đoạn mã T-SQL (SQL Snippet):
```sql
-- A. Thống kê xu hướng số lượng phiếu tiếp nhận (6 tháng gần nhất)
SELECT 
    FORMAT(received_at, 'yyyy-MM') AS month_label,
    COUNT(id) AS ticket_count
FROM dbo.tickets
WHERE received_at >= DATEADD(month, -5, DATEADD(day, 1 - DAY(GETDATE()), CAST(GETDATE() AS DATE)))
GROUP BY FORMAT(received_at, 'yyyy-MM')
ORDER BY month_label ASC;

-- B. Thống kê xu hướng doanh thu phát sinh (6 tháng gần nhất)
SELECT 
    FORMAT(created_at, 'yyyy-MM') AS month_label,
    SUM(total_amount) AS total_revenue
FROM dbo.invoices
WHERE created_at >= DATEADD(month, -5, DATEADD(day, 1 - DAY(GETDATE()), CAST(GETDATE() AS DATE)))
GROUP BY FORMAT(created_at, 'yyyy-MM')
ORDER BY month_label ASC;
```

---

### 2.3. Report 3: Báo Cáo Cơ Cấu Trạng Thái Phiếu (Ticket Status Distribution)
- **Mục đích**: Đo lường tỷ lệ phân bổ các phiếu bảo hành theo từng trạng thái cụ thể để phát hiện điểm nghẽn (bottleneck) trong quy trình (ví dụ: nghẽn ở khâu chờ linh kiện `waiting_for_parts` hay đang sửa `repairing`).

#### Đoạn mã T-SQL (SQL Snippet):
```sql
SELECT 
    status,
    COUNT(id) AS [count]
FROM dbo.tickets
GROUP BY status
ORDER BY [count] DESC;
```

---

### 2.4. Report 4: Báo Cáo Top Linh Kiện Tiêu Hao (Top Consumed Parts)
- **Mục đích**: Xác định 5 linh kiện được thay thế nhiều nhất trên các hóa đơn đã thanh toán. Dựa vào đây, bộ phận kho sẽ ưu tiên kế hoạch đặt hàng linh kiện, tránh tình trạng đứt gãy phụ tùng thay thế.
- **Đặc điểm tối ưu**: Áp dụng cơ chế sắp xếp thứ cấp: Ưu tiên số lượng linh kiện tiêu hao nhiều nhất (`totalQuantity DESC`); nếu bằng nhau thì sắp xếp tiếp theo tổng giá trị tiền (`totalAmount DESC`).

#### Đoạn mã T-SQL (SQL Snippet):
```sql
SELECT TOP 5
    p.id,
    p.part_name AS partName,
    p.unit,
    SUM(ii.quantity) AS totalQuantity,
    SUM(ii.total_price) AS totalAmount
FROM dbo.invoice_items ii
INNER JOIN dbo.parts p ON ii.part_id = p.id
INNER JOIN dbo.invoices inv ON ii.invoice_id = inv.id
GROUP BY p.id, p.part_name, p.unit
ORDER BY totalQuantity DESC, totalAmount DESC;
```

---

### 2.5. Report 5: Báo Cáo Năng Suất Kỹ Thuật Viên (Top Active Technicians)
- **Mục đích**: Đánh giá năng suất và khối lượng công việc của từng kỹ thuật viên trong xưởng sửa chữa. Báo cáo giúp điều phối viên phân bổ ca trực cân bằng và làm căn cứ đánh giá KPI cuối tháng.
- **Kỹ thuật SQL**: Sử dụng kỹ thuật gom nhóm có điều kiện **`Conditional Aggregation (SUM CASE WHEN)`** để tính số ca đã hoàn thành (`completed`, `delivered`, `paid`) trên tổng số ca được bàn giao.

#### Đoạn mã T-SQL (SQL Snippet):
```sql
SELECT TOP 5
    e.id AS employee_id,
    e.full_name AS technician_name,
    COUNT(t.id) AS total_assigned,
    SUM(CASE WHEN t.status IN ('completed', 'delivered', 'paid') THEN 1 ELSE 0 END) AS completed_count
FROM dbo.employees e
INNER JOIN dbo.tickets t ON e.id = t.technician_id
WHERE e.role = 'technician' 
  AND e.is_active = 1
GROUP BY e.id, e.full_name
ORDER BY completed_count DESC, total_assigned DESC;
```

---

### 2.6. Report 6: Báo Cáo Cảnh Báo Trễ Hạn Tiến Độ SLA (Delayed Tickets Alert)
- **Mục đích**: Tự động phát hiện và cảnh báo các ca bảo hành xử lý chậm quá 14 ngày kể từ lúc tiếp nhận mà chưa xong.
- **Cơ chế xử lý**: Thực thi Stored Procedure `dbo.sp_alert_delayed_tickets` sử dụng **Cursor duyệt từng bản ghi**, tính số ngày quá hạn qua `DATEDIFF` và gắn tên kỹ thuật viên phụ trách.

#### Đoạn mã T-SQL (SQL Snippet):
```sql
-- Gọi Stored Procedure từ ứng dụng
EXEC dbo.sp_alert_delayed_tickets @delay_days = 14;

-- (Mô phỏng truy vấn trích xuất dữ liệu của Cursor trong Stored Procedure):
SELECT 
    t.id AS ticket_id,
    c.full_name AS customer_name,
    c.phone_number,
    d.device_name,
    t.status,
    DATEDIFF(DAY, t.received_at, GETDATE()) AS overdue_days,
    tech.full_name AS assigned_technician
FROM tickets t
JOIN devices d ON d.id = t.device_id
JOIN customers c ON c.id = d.customer_id
LEFT JOIN employees tech ON tech.id = t.technician_id
WHERE t.status NOT IN ('completed', 'delivered', 'cancelled')
  AND DATEDIFF(DAY, t.received_at, GETDATE()) > 14
ORDER BY overdue_days DESC;
```
