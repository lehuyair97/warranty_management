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

## 2. Phân Nhóm 1: Gom Theo Database Triggers (7 Triggers)

| Tên Trigger | Bảng Tác Động | Sự Kiện | Thao Tác Kích Hoạt Trên UI Dashboard | Cơ Chế Kiểm Soát Tự Động & Ràng Buộc | Mã Lỗi Rollback |
|:---|:---|:---:|:---|:---|:---:|
| **`trg_invoice_items_stock`** | `invoice_items` | `INSERT`<br/>`UPDATE`<br/>`DELETE` | • KTV thêm linh kiện vào báo giá (`INSERT`)<br/>• KTV chỉnh sửa số lượng (`UPDATE`)<br/>• KTV bấm icon thùng rác xóa linh kiện (`DELETE`) | • Tự động trừ `parts.stock_quantity`<br/>• Tự động tính delta chênh lệch kho<br/>• Tự động hoàn trả số lượng về kho khi xóa dòng<br/>• Hủy bỏ toàn bộ giao dịch nếu tồn kho âm | **`50001`** *(Kho không đủ số lượng)* |
| **`trg_invoices_total_amount`** | `invoice_items` | `INSERT`<br/>`UPDATE`<br/>`DELETE` | Bất kỳ thao tác thêm mới, sửa số lượng hoặc xóa dòng linh kiện trong hóa đơn | Tự động tính toán lại `invoices.total_amount` bằng cách gọi hàm `fn_calculate_parts_total` | — |
| **`trg_invoices_labor_update`** | `invoices` | `INSERT`<br/>`UPDATE` | Lễ tân / KTV chỉnh sửa tiền công dịch vụ (`labor_fee`) hoặc chiết khấu (`discount_amount`) | Tự động tính lại tổng tiền hóa đơn: `total_amount = MAX(0, labor_fee - discount_amount) + linh_kien` | — |
| **`trg_tickets_workflow_guard`** | `tickets` | `INSERT`<br/>`UPDATE` | • KTV đổi trạng thái phiếu sang `inspecting`, `repairing`, `completed`<br/>• Lễ tân bấm bàn giao máy (`delivered`) | • Bắt buộc phân công KTV trước khi chuyển trạng thái kỹ thuật<br/>• Ngăn nhảy cóc sang `delivered` khi chưa `completed`<br/>• Cấm mở lại phiếu đã bàn giao<br/>• Tự động điền `completed_at = GETDATE()` | **`50003`** *(Thiếu KTV)*<br/>**`50004`** *(Sai tiến trình)* |
| **`trg_tickets_audit_history`** | `tickets` | `INSERT`<br/>`UPDATE` | Bất kỳ thao tác tạo phiếu mới hoặc cập nhật trạng thái phiếu | Tự động ghi vết sự kiện biến động vào `ticket_status_history` (`old_status`, `new_status`, `technician_id`, `created_at`) | — |
| **`trg_invoice_items_freeze_paid`** | `invoice_items` | `INSERT`<br/>`UPDATE`<br/>`DELETE` | Bất kỳ ai cố tình gửi lệnh thêm, sửa hoặc xóa linh kiện của một hóa đơn đã thanh toán | **Khóa tài chính cấp dòng**: Cấm tuyệt đối chỉnh sửa danh mục linh kiện một khi hóa đơn đã `paid` | **`50035`** *(HĐ đã thanh toán)* |
| **`trg_invoices_freeze_paid_amounts`** | `invoices` | `UPDATE` | Bất kỳ ai cố tình sửa tiền hoặc chuyển trạng thái từ `paid` ngược về `unpaid` | **Khóa tài chính cấp hóa đơn**: Đóng băng vĩnh viễn số tiền và cấm đảo ngược trạng thái | **`50036`** *(HĐ đã thanh toán)* |

---

## 3. Phân Nhóm 2: Gom Theo Database Cursors (2 Con Trỏ T-SQL)

| Tên Cursor | Nằm Trong Thủ Tục | Màn Hình / Thao Tác Trên UI | Cơ Chế Duyệt Con Trỏ & Mục Đích Nghiệp Vụ |
|:---|:---|:---|:---|
| **`cur_delayed_tickets`** | `dbo.sp_alert_delayed_tickets` | **Dashboard Giám Đốc (`/dashboard`)**: Mở trang hoặc bấm nút **"Làm mới"** $\rightarrow$ Widget *"Phiếu quá hạn SLA (>14 ngày)"* | Con trỏ duyệt tuần tự qua từng phiếu đang mở quá hạn SLA (>14 ngày), JOIN thông tin khách hàng, thiết bị và KTV phụ trách, tính chính xác số ngày trễ nạp vào dataset cho Dashboard hiển thị cảnh báo đỏ. |
| **`cur_invoices`** | `dbo.sp_audit_invoices` | **Dashboard Giám Đốc (`/dashboard`)**: Bấm nút **"Đối soát hóa đơn & Doanh thu"** $\rightarrow$ Bấm **"Bắt đầu quét đối soát"** | Con trỏ duyệt qua 100% hóa đơn trong CSDL, gọi hàm `fn_calculate_parts_total` để so khớp tổng tiền thực tế với `total_amount`. Nếu bật `auto_fix = 1`, con trỏ tự động sửa đúng số tiền cho từng hóa đơn bị lệch. |

---

## 4. Phân Nhóm 3: Gom Theo User-Defined Functions (3 Functions)

| Tên Function | Loại Hàm | Màn Hình / Vị Trí Gọi Trên Dashboard | Kết Quả Trả Về & Ứng Dụng Thực Tế |
|:---|:---:|:---|:---|
| **`dbo.fn_calculate_parts_total`** | Scalar | Gọi ngầm trong Triggers `trg_invoices_total_amount`, `trg_invoices_labor_update` và Stored Procedure `sp_audit_invoices` | Trả về tổng tiền linh kiện: $\sum(\text{quantity} \times \text{unit\_price})$ dạng `DECIMAL(18,2)`. |
| **`dbo.fn_is_device_under_warranty`** | Scalar | • **Màn hình Tiếp nhận (`/reception`)**: Khi tạo phiếu mới<br/>• **Màn hình Tra cứu (`/tra-cuu`)**: Khách tra cứu thiết bị | Trả về `1` (Còn bảo hành) hoặc `0` (Hết hạn). Tự động phân loại `warranty` (miễn phí) hay `repair` (tính phí); hiển thị badge xanh/vàng. |
| **`dbo.fn_get_device_repair_history`** | Table-Valued | • **Màn hình Tra cứu (`/tra-cuu`)**<br/>• **Modal Chi tiết máy (`/tickets`)** | Trả về bảng lịch sử sửa chữa đa tầng: Ngày nhận, mã phiếu, lỗi, linh kiện đã thay, KTV thực hiện và kết quả bàn giao. |

---

## 5. Phân Nhóm 4: Gom Theo Stored Procedures (7 Thủ Tục)

| Stored Procedure | Màn Hình / Nút Bấm Trên UI | Nghiệp Vụ Thực Thi Nguyên Tử (ACID) |
|:---|:---|:---|
| **`dbo.sp_receive_device`** | Phân hệ Lễ tân (`/reception`) $\rightarrow$ Bấm **"Tạo phiếu tiếp nhận"** | Tạo khách $\rightarrow$ Tạo/cập nhật máy $\rightarrow$ Gọi hàm bảo hành $\rightarrow$ Tạo phiếu `received` $\rightarrow$ Kích hoạt trigger ghi audit. |
| **`dbo.sp_process_ticket`** | Bàn làm việc KTV (`/technician`) $\rightarrow$ Bấm **"Cập nhật tiến độ"** | Cập nhật trạng thái phiếu $\rightarrow$ Ghi nguyên nhân/giải pháp $\rightarrow$ Kích hoạt trigger kiểm tra KTV & tự điền `completed_at`. |
| **`dbo.sp_create_invoice`** | Màn hình Hóa đơn / KTV $\rightarrow$ Khởi tạo hóa đơn báo giá | Tạo hóa đơn cho phiếu $\rightarrow$ Gán tiền công & chiết khấu $\rightarrow$ Kích hoạt trigger tính tổng tiền. |
| **`dbo.sp_add_invoice_part`** | Modal Chẩn đoán $\rightarrow$ Chọn linh kiện kho $\rightarrow$ Bấm **"Thêm vào báo giá"** | Capture giá kho bất biến $\rightarrow$ Gán vào `invoice_items` $\rightarrow$ Kích hoạt trigger trừ kho & trigger tính lại tổng tiền. |
| **`dbo.sp_checkout_invoice`** | Phân hệ Thu ngân (`/cashier`) $\rightarrow$ Bấm **"Xác nhận thanh toán"** | Ghi nhận hình thức thanh toán $\rightarrow$ Gán `paid_at` $\rightarrow$ Đổi sang `paid` $\rightarrow$ Kích hoạt bộ đôi trigger khóa bất biến. |
| **`dbo.sp_alert_delayed_tickets`** | Dashboard Giám đốc (`/dashboard`) $\rightarrow$ Widget Cảnh báo trễ SLA | Sử dụng **Cursor `cur_delayed_tickets`** duyệt tìm các phiếu quá hạn > 14 ngày, trả về danh sách cảnh báo. |
| **`dbo.sp_audit_invoices`** | Dashboard Giám đốc (`/dashboard`) $\rightarrow$ Modal Đối soát doanh thu | Sử dụng **Cursor `cur_invoices`** duyệt đối soát 100% hóa đơn, tự động sửa sai số nếu bật `@auto_fix = 1`. |

---

## 6. Phân Nhóm 5: Gom Theo Thao Tác Người Dùng Trên Từng Phân Hệ Dashboard

### 6.1 Phân Hệ Lễ Tân Tiếp Nhận (`/reception`)
* **Thao tác 1: Tạo phiếu tiếp nhận máy mới**
  * Nút bấm: **"Tạo phiếu tiếp nhận"**
  * REST API: `POST /api/tickets`
  * Thủ tục: `dbo.sp_receive_device`
  * Function: `dbo.fn_is_device_under_warranty`
  * Trigger: `trg_tickets_audit_history`
* **Thao tác 2: Bàn giao máy cho khách**
  * Nút bấm: **"Bàn giao máy"**
  * REST API: `PATCH /api/tickets/:id/process` với `{ status: "delivered" }`
  * Trigger: `trg_tickets_workflow_guard` (kiểm tra phải qua `completed`, ném lỗi `50004` nếu nhảy cóc) & `trg_tickets_audit_history`.

---

### 6.2 Phân Hệ Kỹ Thuật Viên Sửa Chữa (`/technician`)
* **Thao tác 3: Nhận phiếu & Chuyển trạng thái**
  * Nút bấm: **"Cập nhật tiến độ"** (`inspecting`, `waiting_for_parts`, `repairing`)
  * REST API: `PATCH /api/tickets/:id/process`
  * Thủ tục: `dbo.sp_process_ticket`
  * Trigger: `trg_tickets_workflow_guard` (kiểm tra `technician_id`, ném lỗi `50003` nếu thiếu) & `trg_tickets_audit_history`.
* **Thao tác 4: Xuất kho linh kiện vào báo giá**
  * Nút bấm: **"Thêm vào báo giá"** (trong modal chẩn đoán)
  * REST API: `POST /api/invoices/:id/items`
  * Thủ tục: `dbo.sp_add_invoice_part`
  * Trigger: `trg_invoice_items_stock` (trừ kho, chặn âm kho lỗi `50001`), `trg_invoices_total_amount` (tính lại tiền), `trg_invoice_items_freeze_paid`.
  * Function: `dbo.fn_calculate_parts_total`.
* **Thao tác 5: Gỡ bỏ linh kiện khỏi báo giá**
  * Nút bấm: Icon **Thùng rác đỏ** bên cạnh dòng linh kiện
  * REST API: `DELETE /api/invoices/:id/items/:partId`
  * Trigger: `trg_invoice_items_stock` (tự động hoàn trả hàng về kho), `trg_invoices_total_amount` (tự động giảm tổng tiền), `trg_invoice_items_freeze_paid` (chặn nếu đã thanh toán lỗi `50035`).
* **Thao tác 6: Xác nhận hoàn tất sửa chữa**
  * Nút bấm: **"Hoàn tất sửa chữa"** (`completed`)
  * REST API: `PATCH /api/tickets/:id/process` với `{ status: "completed" }`
  * Thủ tục: `dbo.sp_process_ticket`
  * Trigger: `trg_tickets_workflow_guard` (tự động gán `completed_at = GETDATE()`) & `trg_tickets_audit_history`.

---

### 6.3 Phân Hệ Thu Ngân Thanh Toán (`/cashier`)
* **Thao tác 7: Xác nhận thanh toán hóa đơn**
  * Nút bấm: **"Xác nhận thanh toán"** (trong Checkout Modal)
  * REST API: `POST /api/invoices/:id/checkout`
  * Thủ tục: `dbo.sp_checkout_invoice`
  * Trigger: `trg_invoices_freeze_paid_amounts` & `trg_invoice_items_freeze_paid` (đóng băng vĩnh viễn hóa đơn).
* **Thao tác 8: Cố tình chỉnh sửa hóa đơn đã thanh toán**
  * Thao tác: Gửi lệnh sửa tiền hoặc xóa linh kiện của HĐ `paid`
  * Trigger: `trg_invoices_freeze_paid_amounts` (ném lỗi `50036`), `trg_invoice_items_freeze_paid` (ném lỗi `50035`).

---

### 6.4 Phân Hệ Quản Lý / Giám Đốc (`/dashboard`)
* **Thao tác 9: Xem cảnh báo phiếu trễ hạn SLA**
  * Thao tác: Mở trang `/dashboard` hoặc bấm nút **"Làm mới số liệu"**
  * REST API: `GET /api/reports/delayed-tickets?days=14`
  * Thủ tục: `dbo.sp_alert_delayed_tickets`
  * Cursor: **`cur_delayed_tickets`** (duyệt tuần tự từng phiếu vi phạm SLA > 14 ngày).
* **Thao tác 10: Quét đối soát toàn bộ doanh thu & tự sửa sai lệch**
  * Nút bấm: **"Bắt đầu quét đối soát"** (trong Invoice Audit Modal)
  * REST API: `POST /api/reports/audit-invoices` với body `{ autoFix: boolean }`
  * Thủ tục: `dbo.sp_audit_invoices`
  * Cursor: **`cur_invoices`** (duyệt 100% hóa đơn trong CSDL).
  * Function: `dbo.fn_calculate_parts_total`.

---

### 6.5 Phân Hệ Khách Hàng Công Khai (`/tra-cuu`)
* **Thao tác 11: Tra cứu bảo hành & lịch sử sửa chữa**
  * Nút bấm: **"Tra cứu bảo hành"**
  * REST API: `GET /api/tickets/public-tracking?phone=...`
  * Function 1: `dbo.fn_get_device_repair_history` (trả về toàn bộ cây timeline lịch sử sửa chữa).
  * Function 2: `dbo.fn_is_device_under_warranty` (trả về trạng thái còn/hết hạn bảo hành).

---

## 7. Bảng Tra Cứu Nhanh Mã Lỗi Trigger T-SQL (Custom Error Codes)

| Mã Lỗi THROW | Trigger Phát Sinh | HTTP Status Code | Nguyên Nhân Kích Hoạt | Thông Báo Trên Giao Diện Toast |
|:---:|:---|:---:|:---|:---|
| **`50001`** | `trg_invoice_items_stock` | `400 Bad Request` | Số lượng linh kiện xuất dùng vượt quá tồn kho khả dụng (`stock_quantity < 0`). | *Không đủ số lượng linh kiện trong kho để xuất sử dụng!* |
| **`50003`** | `trg_tickets_workflow_guard` | `422 Unprocessable` | Chuyển phiếu sang trạng thái kỹ thuật (`inspecting`, `repairing`...) nhưng chưa phân công KTV (`technician_id IS NULL`). | *Phải phân công kỹ thuật viên trước khi chuyển sang trạng thái này!* |
| **`50004`** | `trg_tickets_workflow_guard` | `422 Unprocessable` | Vi phạm thứ tự tuyến tính: Chuyển sang `delivered` khi chưa `completed`, hoặc cố ý mở lại phiếu đã bàn giao. | *Phiếu sửa chữa phải ở trạng thái [completed] trước khi bàn giao!* |
| **`50035`** | `trg_invoice_items_freeze_paid` | `422 Unprocessable` | Thêm, sửa, hoặc xóa dòng linh kiện (`invoice_items`) của hóa đơn đã thanh toán (`paid`). | *Không thể thêm, sửa, hoặc xóa linh kiện của hóa đơn đã thanh toán!* |
| **`50036`** | `trg_invoices_freeze_paid_amounts` | `422 Unprocessable` | Chỉnh sửa số tiền hoặc cố ý chuyển trạng thái hóa đơn từ `paid` ngược về `unpaid`. | *Hóa đơn đã thanh toán không thể sửa đổi số tiền hoặc đảo ngược trạng thái!* |
