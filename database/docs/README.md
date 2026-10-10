# Database Architecture & Technical Reference

> **Hệ Quản Trị CSDL**: Microsoft SQL Server 2022 (Linux Docker Engine)  
> **Database Name**: `warranty_management`  
> **Tầng Kết Nối**: NestJS TypeORM + Stored Procedure Proxy (`this.dataSource.query()`)  
> **Mục Đích**: Tài liệu kỹ thuật chi tiết phân rã theo từng thành phần kiến trúc cơ sở dữ liệu.

---

## 📚 Danh Mục Tài Liệu Cơ Sở Dữ Liệu Theo Phân Hệ

Toàn bộ tài liệu kỹ thuật đã được phân rã thành các chuyên đề độc lập, đầy đủ mã nguồn T-SQL, giải thích nguyên lý và hướng dẫn kiểm thử:

| STT | Chuyên Đề Kỹ Thuật | Tệp Tài Liệu Chi Tiết | Mô Tả Trọng Tâm |
| :---: | :--- | :--- | :--- |
| **01** | **Sơ Đồ Thực Thể (ERD)** | [01_erd.md](./01_erd.md) | Sơ đồ Mermaid ERD, Từ điển dữ liệu 9 bảng, khóa chính (PK), khóa ngoại (FK), chỉ mục (Indexes) và ràng buộc toàn vẹn. |
| **02** | **Triggers Nghiệp Vụ** | [02_triggers.md](./02_triggers.md) | 5 DML Triggers: Trừ kho tự động, bảo vệ máy trạng thái (Workflow Guard), ghi vết nhật ký audit log và khóa bất biến tài chính. |
| **03** | **Cơ Chế Con Trỏ (Cursor)** | [03_cursors.md](./03_cursors.md) | Kỹ thuật `CURSOR LOCAL FAST_FORWARD`: Đối soát sai lệch doanh thu (`sp_audit_invoices`) và rà soát cảnh báo vi phạm SLA (`sp_alert_delayed_tickets`). |
| **04** | **Hàm Tự Định Nghĩa (Functions)** | [04_functions.md](./04_functions.md) | Danh mục Scalar UDFs và Inline TVF: Tính tổng tiền linh kiện, kiểm tra hạn bảo hành máy, truy xuất lịch sử sửa chữa thiết bị. |
| **05** | **Thủ Tục Lưu Trữ (Procedures)** | [05_procedures.md](./05_procedures.md) | Các Stored Procedures nghiệp vụ cốt lõi: Tiếp nhận quầy POS, KTV chẩn đoán, xuất kho, quyết toán hóa đơn và Sao lưu / Phục hồi CSDL. |
| **06** | **Nhập Liệu Hàng Loạt (Import)** | [06_import.md](./06_import.md) | Quy trình nạp dữ liệu tốc độ cao qua `BULK INSERT`, bảng tạm staging (`#staging_*`), lệnh hợp nhất `MERGE` và xử lý trùng lặp. |
| **07** | **Xuất Dữ Liệu (Export)** | [07_export.md](./07_export.md) | Trích xuất dữ liệu kho hàng, sổ cái hóa đơn kế toán, xuất CSV/Excel tự động và bảo mật che giấu trường nhạy cảm. |
| **08** | **Báo Cáo Thống Kê (Reports)** | [08_reports.md](./08_reports.md) | 6 Báo cáo Dashboard quản trị: KPI vận hành, xu hướng 6 tháng, phân bổ trạng thái, top linh kiện tiêu hao, năng suất KTV và cảnh báo SLA. |

---

## 🌐 Danh Mục Đường Dẫn Trực Quan Trên Web (UI Dashboard URLs)

Các phân hệ nghiệp vụ trên giao diện Web Next.js được ánh xạ tương ứng trực tiếp với các đối tượng CSDL SQL Server:

| Phân hệ nghiệp vụ | URL Trực Quan (Localhost) | Đối tượng CSDL Thực Thi Trực Tiếp |
| :--- | :--- | :--- |
| **Tổng quan Dashboard** | [http://localhost:3000/dashboard](http://localhost:3000/dashboard) | Cursor `cur_delayed_tickets` (cảnh báo SLA), Cursor `cur_invoices` (đối soát doanh thu) |
| **Bàn tiếp nhận (POS)** | [http://localhost:3000/reception](http://localhost:3000/reception) | Procedure `sp_receive_device`, UDF `fn_is_device_under_warranty`, Trigger `trg_tickets_audit_history` |
| **Bàn kỹ thuật (Sửa chữa)** | [http://localhost:3000/technician](http://localhost:3000/technician) | Procedure `sp_process_ticket`, `sp_add_ticket_part`, Trigger `trg_ticket_items_stock`, `trg_tickets_workflow_guard` |
| **Quầy thu ngân & Hóa đơn** | [http://localhost:3000/cashier](http://localhost:3000/cashier) | Procedure `sp_checkout_ticket`, Trigger `trg_invoices_freeze_paid_amounts` & `trg_invoice_items_freeze_paid` |
| **Danh sách phiếu sửa** | [http://localhost:3000/tickets](http://localhost:3000/tickets) | Procedure `sp_bulk_import_tickets` (Bulk Insert CSV), Trigger `trg_tickets_audit_history`, UDF `fn_get_device_repair_history` |
| **Kho linh kiện** | [http://localhost:3000/inventory](http://localhost:3000/inventory) | Procedure `sp_bulk_import_parts` (Bulk Insert CSV & Merge), Trigger `trg_ticket_items_stock` |
| **Danh sách hóa đơn** | [http://localhost:3000/invoices](http://localhost:3000/invoices) | Procedure `sp_export_invoices_data`, đối soát hóa đơn |
| **Quản trị CSDL (Data & Backup)** | [http://localhost:3000/database](http://localhost:3000/database) | Procedure `sp_backup_database` (.BAK), `sp_restore_database`, `sp_bulk_import_*`, `sp_export_*` |
| **Tra cứu bảo hành công khai** | [http://localhost:3000/tra-cuu](http://localhost:3000/tra-cuu) | UDF `fn_is_device_under_warranty`, UDF `fn_get_device_repair_history` |

---

## ⚡ Hướng Dẫn Chạy & Khởi Tạo Database Bằng Docker

```bash
# 1. Khởi động SQL Server và tự động chạy toàn bộ script khởi tạo
docker compose up -d database db-init

# 2. Kiểm tra trạng thái container và logs
docker compose logs -f database

# 3. Kết nối trực tiếp vào SQL Server bằng sqlcmd hoặc DBeaver / Azure Data Studio
# Host: localhost,1433
# User: sa
# Password: Warranty@Pass123
# Database: warranty_management
```
