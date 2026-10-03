-- ============================================================
-- MIGRATION 05: SEED DATA (20 ROWS PER TABLE)
-- ============================================================

USE warranty_management;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- Temporarily bypass validation triggers during initial system seeding
ALTER TABLE tickets DISABLE TRIGGER ALL;
ALTER TABLE invoices DISABLE TRIGGER ALL;
ALTER TABLE invoice_items DISABLE TRIGGER ALL;
GO

-- 5.1. Seed Customers (20 rows)
IF NOT EXISTS (SELECT 1 FROM customers)
BEGIN
    INSERT INTO customers (full_name, phone_number, email, address) VALUES
    (N'Nguyen Van An', '0901234501', 'an.nguyen@gmail.com', N'12 Nguyen Hue, District 1, HCMC'),
    (N'Tran Thi Bich', '0912345602', 'bich.tran@gmail.com', N'45 Le Loi, District 1, HCMC'),
    (N'Le Hoang Cuong', '0923456703', 'cuong.le@gmail.com', N'78 CMT8, District 3, HCMC'),
    (N'Pham Minh Dung', '0934567804', 'dung.pham@gmail.com', N'23 Nguyen Trai, District 5, HCMC'),
    (N'Hoang Thi Em', '0945678905', 'em.hoang@gmail.com', N'56 Ly Thuong Kiet, District 10, HCMC'),
    (N'Vu Quoc Phong', '0956789006', 'phong.vu@gmail.com', N'89 Phan Van Tri, Go Vap District, HCMC'),
    (N'Dang Thu Giang', '0967890107', 'giang.dang@gmail.com', N'34 Xo Viet Nghe Tinh, Binh Thanh, HCMC'),
    (N'Bui Thanh Hai', '0978901208', 'hai.bui@gmail.com', N'67 Hoang Van Thu, Phu Nhuan, HCMC'),
    (N'Ngo Thi Huong', '0989012309', 'huong.ngo@gmail.com', N'15 Truong Chinh, Tan Binh, HCMC'),
    (N'Do Anh Khoa', '0990123410', 'khoa.do@gmail.com', N'102 Luy Ban Bich, Tan Phu, HCMC'),
    (N'Ly Thi Lan', '0901234511', 'lan.ly@gmail.com', N'28 Kha Van Can, Thu Duc City, HCMC'),
    (N'Trinh Van Minh', '0912345612', 'minh.trinh@gmail.com', N'91 Vo Van Ngan, Thu Duc City, HCMC'),
    (N'Phan Thi Ngoc', '0923456713', 'ngoc.phan@gmail.com', N'5 Nguyen Thi Thap, District 7, HCMC'),
    (N'Duong Quang Phuc', '0934567814', 'phuc.duong@gmail.com', N'73 Huynh Tan Phat, District 7, HCMC'),
    (N'Vo Thi Quyen', '0945678915', 'quyen.vo@gmail.com', N'19 Le Van Viet, Thu Duc City, HCMC'),
    (N'Cao Minh Son', '0956789016', 'son.cao@gmail.com', N'64 Quang Trung, Go Vap, HCMC'),
    (N'Ta Thi Thao', '0967890117', 'thao.ta@gmail.com', N'38 To Ky, District 12, HCMC'),
    (N'Lam Van Tuan', '0978901218', 'tuan.lam@gmail.com', N'82 Kinh Duong Vuong, Binh Tan, HCMC'),
    (N'Mai Thi Uyen', '0989012319', 'uyen.mai@gmail.com', N'11 Nguyen Van Linh, Binh Chanh, HCMC'),
    (N'Chau Duc Vinh', '0990123420', 'vinh.chau@gmail.com', N'57 Nguyen Oanh, Go Vap, HCMC');
END
GO

-- 5.2. Seed Employees (20 rows)
IF NOT EXISTS (SELECT 1 FROM employees)
BEGIN
    DECLARE @pwd VARCHAR(255) = '$2a$10$vIqqskJtDrtE1OFQqLiaSuYe0uiKGsnr4mpc9VJajcPLlbE9OUzoa';

    INSERT INTO employees (username, password_hash, full_name, role, phone_number, email) VALUES
    ('admin', @pwd, N'Admin Manager', 'manager', '0281000000', 'admin@warranty.vn'),
    ('reception1', @pwd, N'Nguyen Thi Thu Ha', 'receptionist', '0281000101', 'ha.nguyen@warranty.vn'),
    ('reception2', @pwd, N'Tran Van Khanh', 'receptionist', '0281000102', 'khanh.tran@warranty.vn'),
    ('reception3', @pwd, N'Le Thi My Linh', 'receptionist', '0281000103', 'linh.le@warranty.vn'),
    ('reception4', @pwd, N'Pham Quoc Nam', 'receptionist', '0281000104', 'nam.pham@warranty.vn'),
    ('reception5', @pwd, N'Hoang Thi Oanh', 'receptionist', '0281000105', 'oanh.hoang@warranty.vn'),
    ('tech1', @pwd, N'Dang Van Quan', 'technician', '0281000107', 'quan.dang@warranty.vn'),
    ('tech2', @pwd, N'Bui Minh Rang', 'technician', '0281000108', 'rang.bui@warranty.vn'),
    ('tech3', @pwd, N'Ngo Thanh Sang', 'technician', '0281000109', 'sang.ngo@warranty.vn'),
    ('tech4', @pwd, N'Do Huu Tai', 'technician', '0281000110', 'tai.do@warranty.vn'),
    ('tech5', @pwd, N'Ly Van Thang', 'technician', '0281000111', 'thang.ly@warranty.vn'),
    ('tech6', @pwd, N'Trinh Quang Uy', 'technician', '0281000112', 'uy.trinh@warranty.vn'),
    ('tech7', @pwd, N'Phan Anh Viet', 'technician', '0281000113', 'viet.phan@warranty.vn'),
    ('tech8', @pwd, N'Duong Van Xuan', 'technician', '0281000114', 'xuan.duong@warranty.vn'),
    ('tech9', @pwd, N'Vo Thanh Yen', 'technician', '0281000115', 'yen.vo@warranty.vn'),
    ('tech10', @pwd, N'Cao Duc Anh', 'technician', '0281000116', 'anh.cao@warranty.vn'),
    ('tech11', @pwd, N'Ta Minh Bao', 'technician', '0281000117', 'bao.ta@warranty.vn'),
    ('tech12', @pwd, N'Lam Hoai Chung', 'technician', '0281000118', 'chung.lam@warranty.vn'),
    ('manager2', @pwd, N'Mai Thi Dieu', 'manager', '0281000119', 'dieu.mai@warranty.vn'),
    ('manager3', @pwd, N'Chau Van Duoc', 'manager', '0281000120', 'duoc.chau@warranty.vn');
END
GO

-- 5.3. Seed Spare Parts (20 rows)
IF NOT EXISTS (SELECT 1 FROM parts)
BEGIN
    INSERT INTO parts (part_name, unit, price, stock_quantity) VALUES
    (N'RAM DDR4 8GB 3200MHz', 'piece', 650000, 25),
    (N'SSD NVMe 512GB', 'piece', 1150000, 18),
    (N'Laptop Battery 4-Cell', 'piece', 950000, 12),
    (N'Laptop Keyboard Backlit', 'piece', 450000, 15),
    (N'Laptop Cooling Fan Module', 'piece', 280000, 20),
    (N'Laptop Screen 14 inch Full HD', 'piece', 1850000, 6),
    (N'OLED Phone Display Assembly', 'piece', 2500000, 8),
    (N'Smartphone Battery Li-Po', 'piece', 450000, 30),
    (N'USB Type-C Charging Port', 'piece', 180000, 40),
    (N'TV Mainboard 4K HDR', 'piece', 1400000, 4),
    (N'TV LED Backlight Strip Kit', 'set', 950000, 7),
    (N'Printer Printhead Nozzle', 'piece', 780000, 9),
    (N'Printer Ink Cartridge Pack', 'pack', 520000, 14),
    (N'Printer Paper Pickup Roller', 'piece', 240000, 22),
    (N'Monitor Power Supply Board', 'piece', 620000, 10),
    (N'Air Conditioner Capacitor 35uF', 'piece', 120000, 50),
    (N'Refrigerant Gas R32', 'kg', 250000, 35),
    (N'AC Inverter Control PCB', 'piece', 1350000, 5),
    (N'Washing Machine Drain Pump', 'piece', 380000, 11),
    (N'Refrigerator Defrost Thermostat', 'piece', 210000, 16);
END
GO

-- 5.4. Seed Devices (20 rows)
IF NOT EXISTS (SELECT 1 FROM devices)
BEGIN
    INSERT INTO devices (customer_id, device_name, device_type, brand, serial_number, is_under_warranty, warranty_expiry_date) VALUES
    (1, N'Dell Inspiron 15 3520', 'Laptop', 'Dell', 'DL3520A1001', 0, '2025-03-15'),
    (2, N'Asus VivoBook 14 X1404', 'Laptop', 'Asus', 'AS1404B2002', 1, '2027-11-20'),
    (3, N'HP Pavilion 15 eg2081', 'Laptop', 'HP', 'HP15EG3003', 0, '2025-09-10'),
    (4, N'Lenovo IdeaPad Slim 3', 'Laptop', 'Lenovo', 'LN3SLM4004', 1, '2027-02-05'),
    (5, N'Acer Aspire 5 A515', 'Laptop', 'Acer', 'AC515A5005', 0, '2025-06-30'),
    (6, N'iPhone 13 128GB', 'Phone', 'Apple', 'IP13F6006', 1, '2027-12-01'),
    (7, N'Samsung Galaxy S22', 'Phone', 'Samsung', 'SS22R7007', 0, '2025-04-18'),
    (8, N'Xiaomi Redmi Note 11', 'Phone', 'Xiaomi', 'XM11N8008', 0, '2025-01-25'),
    (9, N'OPPO Reno8 5G', 'Phone', 'OPPO', 'OP8R59009', 1, '2027-10-12'),
    (10, N'iPhone 12 64GB', 'Phone', 'Apple', 'IP12F1010', 0, '2024-10-09'),
    (11, N'iPad Gen 9 10.2 inch', 'Tablet', 'Apple', 'IPD9G1111', 0, '2026-05-22'),
    (12, N'Epson L3210 Ink Tank', 'Printer', 'Epson', 'EP3210L1212', 0, '2026-08-08'),
    (13, N'HP LaserJet M111a', 'Printer', 'HP', 'HPM111A1313', 0, '2025-12-03'),
    (14, N'Samsung Smart TV 43 inch', 'TV', 'Samsung', 'SSTV43A1414', 1, '2027-01-15'),
    (15, N'LG OLED 50 inch 4K', 'TV', 'LG', 'LGTV50B1515', 0, '2026-07-19'),
    (16, N'Dell UltraSharp U2422H', 'Monitor', 'Dell', 'DLU2422H1616', 1, '2027-03-30'),
    (17, N'Daikin Inverter 1HP', 'Air Conditioner', 'Daikin', 'DKN1HP1717', 0, '2025-11-11'),
    (18, N'Panasonic Inverter 1.5HP', 'Air Conditioner', 'Panasonic', 'PNS15HP1818', 0, '2026-09-25'),
    (1, N'LG Inverter 9kg Direct Drive', 'Washing Machine', 'LG', 'LGW9KG1919', 1, '2027-04-04'),
    (5, N'Panasonic NR-BX471 Refrigerator', 'Refrigerator', 'Panasonic', 'PNRBX4712020', 1, '2027-12-28');
END
GO

-- 5.5. Seed Tickets (20 rows)
IF NOT EXISTS (SELECT 1 FROM tickets)
BEGIN
    INSERT INTO tickets (
        device_id, receptionist_id, technician_id, ticket_type, issue_description,
        initial_condition, accessories, received_at, fault_cause, repair_solution,
        estimated_cost, status, completed_at
    ) VALUES
    (1, 2, 7, 'repair', N'Device overheating, fan noisy, unexpected shutdown', N'Minor chassis scratches', N'Charger', '2026-08-03 11:37:00', N'Defective fan, thick dust accumulated', N'Replaced fan module and thermal paste', 530000, 'delivered', '2026-08-06 15:37:00'),
    (2, 3, 8, 'repair', N'Several keyboard keys unresponsive', N'Keyboard liquid spill', N'Charger, Sleeve', '2026-08-05 14:44:00', N'Short circuit on keyboard membrane', N'Replaced keyboard module', 650000, 'delivered', '2026-08-09 18:44:00'),
    (3, 4, 9, 'repair', N'Battery drains rapidly, lasts only 20 min', N'Normal condition, slight dent on corner', N'Charger', '2026-08-06 09:51:00', N'Battery aged over life cycle', N'Replaced laptop battery', 1100000, 'delivered', '2026-08-11 13:51:00'),
    (4, 5, 10, 'repair', N'System sluggish and freezes often', N'Very slow response', N'Charger', '2026-08-08 12:58:00', N'Insufficient RAM, full storage disk', N'Upgraded DDR4 8GB RAM', 750000, 'delivered', '2026-08-10 16:58:00'),
    (5, 6, 11, 'repair', N'Cracked screen with vertical lines', N'Screen crack at top right', N'Charger', '2026-08-10 16:05:00', N'Physical impact damaged LCD panel', N'Replaced LCD screen assembly', 2150000, 'delivered', '2026-08-13 20:05:00'),
    (6, 2, 7, 'repair', N'Battery drains fast, phone warms up', N'Good condition, small bezel scratch', N'None', '2026-08-11 11:12:00', N'Degraded battery health 72%', N'Replaced OEM phone battery', 600000, 'delivered', '2026-08-15 15:12:00'),
    (7, 3, 8, 'repair', N'Shattered glass, touch erratic', N'Shattered front glass, ghost touch', N'Phone case', '2026-08-13 14:19:00', N'Droppage shattered OLED display', N'Replaced OLED screen panel', 2850000, 'delivered', '2026-08-18 18:19:00'),
    (8, 4, 9, 'repair', N'Charging cable loose, not charging', N'Loose port, working fine otherwise', N'Charging Cable', '2026-08-15 08:36:00', N'Oxidized Type-C connector pins', N'Replaced Type-C charging port', 300000, 'delivered', '2026-08-17 12:36:00'),
    (9, 5, 10, 'repair', N'Slow charging, fast drain', N'Minor corner nick', N'Protective Case', '2026-08-17 11:43:00', N'Battery cycle limit exceeded', N'Replaced phone battery', 600000, 'delivered', '2026-08-20 15:43:00'),
    (10, 6, 7, 'repair', N'Dropped in water, will not turn on', N'Damp internals, no power', N'None', '2026-08-19 14:50:00', NULL, NULL, 0, 'inspecting', NULL),
    (11, 2, 8, 'repair', N'Cannot recharge battery', N'Charging connector wobbly', N'Case', '2026-08-22 09:57:00', N'Dust buildup and worn port', N'Replaced charging port', 330000, 'completed', '2026-08-27 13:57:00'),
    (12, 3, 9, 'repair', N'Printed pages blurry with horizontal stripes', N'Ink full, feed mechanism works', N'Power cord, USB cable', '2026-08-25 13:04:00', N'Clogged printer nozzle', N'Replaced printhead nozzle', 980000, 'completed', '2026-08-27 17:04:00'),
    (13, 4, 10, 'repair', N'Frequent paper jams', N'Uneven paper feeding', N'Power cord', '2026-08-28 16:11:00', N'Worn rubber pickup roller', N'Replaced paper pickup roller', 340000, 'completed', '2026-08-31 20:11:00'),
    (14, 5, 11, 'repair', N'Power LED on, sound works, no picture', N'Black screen, power on', N'Remote Control', '2026-08-30 11:18:00', N'Power surge fried mainboard', N'Replaced TV 4K mainboard', 1800000, 'completed', '2026-09-03 15:18:00'),
    (15, 6, 7, 'repair', N'Dim display, screen flickering', N'Dim image, poor contrast', N'Remote Control', '2026-09-03 13:35:00', N'Burnt LED backlight strips', N'Replaced LED backlight strip kit', 1400000, 'repairing', NULL),
    (16, 2, 8, 'repair', N'Monitor will not power on', N'Power indicator unlit', N'Power cable, HDMI', '2026-09-06 08:42:00', N'Blown capacitors on power board', N'Replaced monitor power supply board', 800000, 'repairing', NULL),
    (17, 3, 9, 'repair', N'Outdoor unit runs but no cool air', N'Air blower works, no cold air', N'None', '2026-09-10 11:49:00', N'Low refrigerant gas and weak capacitor', N'Recharged R32 gas and replaced capacitor', 720000, 'waiting_for_parts', NULL),
    (18, 4, 10, 'repair', N'Indoor AC blinking error code H11', N'Unit halts on error code', N'Remote', '2026-09-24 14:56:00', N'Faulty inverter PCB', N'Replaced inverter control PCB', 1850000, 'waiting_for_parts', NULL),
    (19, 5, 11, 'repair', N'Washing machine not draining water', N'Water retained inside drum', N'None', '2026-09-26 10:03:00', N'Burnt drain pump motor', N'Replaced drain pump assembly', 630000, 'repairing', NULL),
    (20, 6, 7, 'repair', N'Fridge not cooling, frost buildup', N'Continuous humming sound', N'None', '2026-09-29 09:15:00', NULL, NULL, 0, 'received', NULL);
END
GO

-- 5.6. Seed Invoices (20 rows)
IF NOT EXISTS (SELECT 1 FROM invoices)
BEGIN
    INSERT INTO invoices (ticket_id, created_at, status, labor_fee, discount_amount, total_amount, payment_method, paid_at) VALUES
    (1, '2026-08-06 15:37:00', 'paid', 250000, 0, 530000, 'cash', '2026-08-06 15:37:00'),
    (2, '2026-08-09 18:44:00', 'paid', 200000, 0, 650000, 'bank_transfer', '2026-08-09 18:44:00'),
    (3, '2026-08-11 13:51:00', 'paid', 150000, 0, 1100000, 'credit_card', '2026-08-11 13:51:00'),
    (4, '2026-08-10 16:58:00', 'paid', 100000, 0, 750000, 'cash', '2026-08-10 16:58:00'),
    (5, '2026-08-13 20:05:00', 'paid', 300000, 0, 2150000, 'bank_transfer', '2026-08-13 20:05:00'),
    (6, '2026-08-15 15:12:00', 'paid', 150000, 0, 600000, 'cash', '2026-08-15 15:12:00'),
    (7, '2026-08-18 18:19:00', 'paid', 350000, 0, 2850000, 'bank_transfer', '2026-08-18 18:19:00'),
    (8, '2026-08-17 12:36:00', 'paid', 120000, 0, 300000, 'cash', '2026-08-17 12:36:00'),
    (9, '2026-08-20 15:43:00', 'paid', 150000, 0, 600000, 'bank_transfer', '2026-08-20 15:43:00'),
    (10, '2026-08-20 14:50:00', 'unpaid', 0, 0, 0, NULL, NULL),
    (11, '2026-08-27 13:57:00', 'unpaid', 150000, 0, 330000, NULL, NULL),
    (12, '2026-08-27 17:04:00', 'unpaid', 200000, 0, 980000, NULL, NULL),
    (13, '2026-08-31 20:11:00', 'unpaid', 100000, 0, 340000, NULL, NULL),
    (14, '2026-09-03 15:18:00', 'unpaid', 400000, 0, 1800000, NULL, NULL),
    (15, '2026-09-04 13:35:00', 'unpaid', 450000, 0, 1400000, NULL, NULL),
    (16, '2026-09-07 08:42:00', 'unpaid', 180000, 0, 800000, NULL, NULL),
    (17, '2026-09-11 11:49:00', 'unpaid', 350000, 0, 720000, NULL, NULL),
    (18, '2026-09-25 14:56:00', 'unpaid', 500000, 0, 1850000, NULL, NULL),
    (19, '2026-09-27 10:03:00', 'unpaid', 250000, 0, 630000, NULL, NULL),
    (20, '2026-09-30 09:15:00', 'unpaid', 0, 0, 210000, NULL, NULL);
END
GO

-- 5.7. Seed Invoice Items (20 rows)
IF NOT EXISTS (SELECT 1 FROM invoice_items)
BEGIN
    INSERT INTO invoice_items (invoice_id, part_id, quantity, unit_price) VALUES
    (1, 5, 1, 280000),
    (2, 4, 1, 450000),
    (3, 3, 1, 950000),
    (4, 1, 1, 650000),
    (5, 6, 1, 1850000),
    (6, 8, 1, 450000),
    (7, 7, 1, 2500000),
    (8, 9, 1, 180000),
    (9, 8, 1, 450000),
    (11, 9, 1, 180000),
    (12, 12, 1, 780000),
    (13, 14, 1, 240000),
    (14, 10, 1, 1400000),
    (15, 11, 1, 950000),
    (16, 15, 1, 620000),
    (17, 17, 1, 250000),
    (17, 16, 1, 120000),
    (18, 18, 1, 1350000),
    (19, 19, 1, 380000),
    (20, 20, 1, 210000);
END
GO

-- Re-enable operational triggers for live runtime enforcement
ALTER TABLE tickets ENABLE TRIGGER ALL;
ALTER TABLE invoices ENABLE TRIGGER ALL;
ALTER TABLE invoice_items ENABLE TRIGGER ALL;
GO

