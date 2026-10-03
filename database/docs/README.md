# Database Architecture & Technical Reference

> **Hệ Quản Trị CSDL**: Microsoft SQL Server 2022 (Linux Docker Engine)  
> **Cơ Chế Khởi Tạo**: Migration Scripts tại `database/migrations/` (01_schema -> 02_functions -> 03_triggers -> 04_procedures -> 05_seed_data)  
> **Tầng Kết Nối**: NestJS TypeORM + Stored Procedure Proxy (`this.dataSource.query()`)

---

## 📚 Mục Lục Tài Liệu Cơ Sở Dữ Liệu

Tài liệu chi tiết được chia thành 3 chuyên đề kỹ thuật chuyên sâu:

### 1. [01. Thiết Kế Thực Thể & Sơ Đồ ERD (Entities & ERD)](./01_entities_and_erd.md)
- Sơ đồ quan hệ thực thể **Mermaid ERD** chuẩn hóa.
- Từ điển dữ liệu (**Data Dictionary**) chi tiết cho 8 bảng: `customers`, `employees`, `devices`, `parts`, `tickets`, `invoices`, `invoice_items`, `ticket_status_history`.
- Chi tiết kiểu dữ liệu, các ràng buộc toàn vẹn khóa chính (PK), khóa ngoại (FK), CHECK, UNIQUE và cột tính toán lưu vật lý (`PERSISTED`).

### 2. [02. Triggers Nghiệp Vụ & Khóa Bất Biến Tài Chính (Triggers & Immutability)](./02_triggers_and_immutability.md)
- Phân tích chi tiết **7 Database Triggers** hoạt động ngầm.
- Cơ chế bảo vệ tài chính bất biến (**Financial Immutability**): Khóa cứng số liệu hóa đơn sau khi đã thanh toán (`paid`).
- Quản lý kho thời gian thực (Trừ tồn kho tự động, chống âm kho).
- Bảo vệ máy trạng thái (State Machine Guard) và tự động ghi vết nhật ký chuyển trạng thái (`ticket_status_history`).
- **Bảng tra cứu mã lỗi T-SQL THROW Codes** (`50001` -> `50036`) tương ứng với HTTP Status Codes của API.

### 3. [03. Thủ Tục Lưu Trữ & Hàm Tự Định Nghĩa (Procedures & Functions)](./03_procedures_and_functions.md)
- Chi tiết **7 Stored Procedures**: Tiếp nhận quầy POS, KTV chẩn đoán, Xuất kho linh kiện, Lập hóa đơn tự giảm giá bảo hành, Thanh toán giao máy nguyên tử.
- Thủ tục kiểm toán số dư bằng **Database Cursor** (`sp_audit_invoices`) và tự động khắc phục sai lệch.
- Thủ tục cảnh báo vi phạm thời gian cam kết dịch vụ SLA (`sp_alert_delayed_tickets`).
- Danh mục **3 Hàm người dùng (Functions)**: Tính tổng tiền linh kiện, Kiểm tra hạn bảo hành, Lịch sử sửa chữa thiết bị.

### 4. [04. Sổ Tay Kỹ Thuật: Ánh Xạ Thao Tác Dashboard Đến Database Engine](./04_dashboard_actions_and_sql_execution.md)
- Ma trận ánh xạ chi tiết **10 thao tác nghiệp vụ trên giao diện Web Dashboard** (Tiếp nhận, Chẩn đoán KTV, Xuất/Hủy linh kiện, Thanh toán, Đối soát Cursor, Cảnh báo SLA Cursor).
- Sơ đồ tuần tự **Mermaid Sequence Diagram** toàn diện từ click chuột $\rightarrow$ REST API $\rightarrow$ Database Engine.
- Bảng đối chiếu phản hồi mã lỗi `50001` - `50036` tương ứng với thông báo Toast trên UI.

---

## ⚡ Hướng Dẫn Chạy & Khởi Tạo Database Bằng Docker

```bash
# 1. Khởi động SQL Server và tự động chạy toàn bộ migrations + seed data
docker compose up -d database db-init

# 2. Kiểm tra trạng thái container và logs
docker compose logs -f database

# 3. Kết nối trực tiếp vào SQL Server bằng sqlcmd hoặc DBeaver / Azure Data Studio
# Host: localhost,1433
# User: sa
# Password: Warranty@Pass123
# Database: warranty_management
```
