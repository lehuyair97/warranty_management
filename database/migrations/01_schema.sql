-- ============================================================
-- MIGRATION 01: TABLES, INDEXES, CONSTRAINTS
-- ============================================================

USE warranty_management;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- 1. Customers Table
IF OBJECT_ID('customers', 'U') IS NULL
CREATE TABLE customers (
    id INT IDENTITY(1,1) CONSTRAINT pk_customers PRIMARY KEY,
    full_name NVARCHAR(100) NOT NULL,
    phone_number VARCHAR(15) NOT NULL,
    email VARCHAR(100) NULL,
    address NVARCHAR(200) NULL,
    created_at DATETIME NOT NULL CONSTRAINT df_customers_created_at DEFAULT GETDATE(),
    updated_at DATETIME NOT NULL CONSTRAINT df_customers_updated_at DEFAULT GETDATE()
);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_customers_phone_number')
CREATE INDEX ix_customers_phone_number ON customers(phone_number);
GO

-- 2. Employees Table
IF OBJECT_ID('employees', 'U') IS NULL
CREATE TABLE employees (
    id INT IDENTITY(1,1) CONSTRAINT pk_employees PRIMARY KEY,
    username NVARCHAR(50) NOT NULL CONSTRAINT uq_employees_username UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    refresh_token_hash VARCHAR(255) NULL,
    full_name NVARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CONSTRAINT ck_employees_role CHECK (role IN ('receptionist', 'technician', 'manager')),
    phone_number VARCHAR(15) NULL,
    email VARCHAR(100) NULL,
    is_active BIT NOT NULL CONSTRAINT df_employees_is_active DEFAULT 1,
    created_at DATETIME NOT NULL CONSTRAINT df_employees_created_at DEFAULT GETDATE(),
    updated_at DATETIME NOT NULL CONSTRAINT df_employees_updated_at DEFAULT GETDATE()
);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_employees_role_is_active')
CREATE INDEX ix_employees_role_is_active ON employees(role, is_active);
GO

-- 3. Devices Table
IF OBJECT_ID('devices', 'U') IS NULL
CREATE TABLE devices (
    id INT IDENTITY(1,1) CONSTRAINT pk_devices PRIMARY KEY,
    customer_id INT NOT NULL,
    device_name NVARCHAR(100) NOT NULL,
    device_type NVARCHAR(50) NULL,
    brand NVARCHAR(50) NULL,
    serial_number VARCHAR(50) NULL,
    is_under_warranty BIT NOT NULL CONSTRAINT df_devices_is_under_warranty DEFAULT 0,
    warranty_expiry_date DATE NULL,
    created_at DATETIME NOT NULL CONSTRAINT df_devices_created_at DEFAULT GETDATE(),
    updated_at DATETIME NOT NULL CONSTRAINT df_devices_updated_at DEFAULT GETDATE(),
    CONSTRAINT fk_devices_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'uq_devices_serial_number')
CREATE UNIQUE NONCLUSTERED INDEX uq_devices_serial_number ON devices(serial_number) WHERE serial_number IS NOT NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_devices_customer_id')
CREATE INDEX ix_devices_customer_id ON devices(customer_id);
GO

-- 4. Spare Parts Table
IF OBJECT_ID('parts', 'U') IS NULL
CREATE TABLE parts (
    id INT IDENTITY(1,1) CONSTRAINT pk_parts PRIMARY KEY,
    part_name NVARCHAR(100) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    price DECIMAL(18,2) NOT NULL CONSTRAINT ck_parts_price CHECK (price >= 0),
    stock_quantity INT NOT NULL CONSTRAINT ck_parts_stock CHECK (stock_quantity >= 0),
    created_at DATETIME NOT NULL CONSTRAINT df_parts_created_at DEFAULT GETDATE(),
    updated_at DATETIME NOT NULL CONSTRAINT df_parts_updated_at DEFAULT GETDATE()
);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_parts_part_name')
CREATE INDEX ix_parts_part_name ON parts(part_name);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_parts_stock_quantity')
CREATE INDEX ix_parts_stock_quantity ON parts(stock_quantity);
GO

-- 5. Repair Tickets Table
IF OBJECT_ID('tickets', 'U') IS NULL
CREATE TABLE tickets (
    id INT IDENTITY(1,1) CONSTRAINT pk_tickets PRIMARY KEY,
    device_id INT NOT NULL,
    receptionist_id INT NOT NULL,
    technician_id INT NULL,
    ticket_type VARCHAR(20) NOT NULL CONSTRAINT df_tickets_ticket_type DEFAULT 'repair'
        CONSTRAINT ck_tickets_ticket_type CHECK (ticket_type IN ('repair', 'warranty', 're_repair')),
    issue_description NVARCHAR(500) NULL,
    initial_condition NVARCHAR(200) NULL,
    accessories NVARCHAR(200) NULL,
    received_at DATETIME NOT NULL CONSTRAINT df_tickets_received_at DEFAULT GETDATE(),
    fault_cause NVARCHAR(500) NULL,
    repair_solution NVARCHAR(500) NULL,
    estimated_cost DECIMAL(18,2) NOT NULL CONSTRAINT df_tickets_estimated_cost DEFAULT 0,
    status VARCHAR(30) NOT NULL CONSTRAINT ck_tickets_status CHECK (status IN (
        'received', 'inspecting', 'waiting_for_parts', 'repairing', 'completed', 'delivered', 'cancelled'
    )),
    completed_at DATETIME NULL,
    created_at DATETIME NOT NULL CONSTRAINT df_tickets_created_at DEFAULT GETDATE(),
    updated_at DATETIME NOT NULL CONSTRAINT df_tickets_updated_at DEFAULT GETDATE(),
    CONSTRAINT fk_tickets_device FOREIGN KEY (device_id) REFERENCES devices(id),
    CONSTRAINT fk_tickets_receptionist FOREIGN KEY (receptionist_id) REFERENCES employees(id),
    CONSTRAINT fk_tickets_technician FOREIGN KEY (technician_id) REFERENCES employees(id),
    CONSTRAINT ck_tickets_completed_at CHECK (completed_at IS NULL OR completed_at >= received_at)
);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_tickets_device_id')
CREATE INDEX ix_tickets_device_id ON tickets(device_id);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_tickets_receptionist_id')
CREATE INDEX ix_tickets_receptionist_id ON tickets(receptionist_id);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_tickets_technician_id')
CREATE INDEX ix_tickets_technician_id ON tickets(technician_id);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_tickets_status')
CREATE INDEX ix_tickets_status ON tickets(status);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_tickets_received_at')
CREATE INDEX ix_tickets_received_at ON tickets(received_at DESC);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_tickets_status_received_at')
CREATE INDEX ix_tickets_status_received_at ON tickets(status, received_at DESC);
GO

-- 6. Invoices Table
IF OBJECT_ID('invoices', 'U') IS NULL
CREATE TABLE invoices (
    id INT IDENTITY(1,1) CONSTRAINT pk_invoices PRIMARY KEY,
    ticket_id INT NOT NULL,
    created_at DATETIME NOT NULL CONSTRAINT df_invoices_created_at DEFAULT GETDATE(),
    status VARCHAR(30) NOT NULL CONSTRAINT ck_invoices_status CHECK (status IN ('unpaid', 'paid')),
    labor_fee DECIMAL(18,2) NOT NULL CONSTRAINT df_invoices_labor_fee DEFAULT 0,
    discount_amount DECIMAL(18,2) NOT NULL CONSTRAINT df_invoices_discount DEFAULT 0,
    total_amount DECIMAL(18,2) NOT NULL CONSTRAINT df_invoices_total_amount DEFAULT 0,
    payment_method VARCHAR(30) NULL CONSTRAINT ck_invoices_payment_method CHECK (payment_method IN ('cash', 'bank_transfer', 'credit_card')),
    paid_at DATETIME NULL,
    updated_at DATETIME NOT NULL CONSTRAINT df_invoices_updated_at DEFAULT GETDATE(),
    CONSTRAINT fk_invoices_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id)
);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_invoices_ticket_id')
CREATE INDEX ix_invoices_ticket_id ON invoices(ticket_id);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_invoices_status_created_at')
CREATE INDEX ix_invoices_status_created_at ON invoices(status, created_at DESC);
GO

-- 7. Invoice Items Table
IF OBJECT_ID('invoice_items', 'U') IS NULL
CREATE TABLE invoice_items (
    id INT IDENTITY(1,1) CONSTRAINT pk_invoice_items PRIMARY KEY,
    invoice_id INT NOT NULL,
    part_id INT NOT NULL,
    quantity INT NOT NULL CONSTRAINT ck_invoice_items_quantity CHECK (quantity > 0),
    unit_price DECIMAL(18,2) NOT NULL CONSTRAINT ck_invoice_items_unit_price CHECK (unit_price >= 0),
    total_price AS (quantity * unit_price) PERSISTED,
    created_at DATETIME NOT NULL CONSTRAINT df_invoice_items_created_at DEFAULT GETDATE(),
    CONSTRAINT fk_invoice_items_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id),
    CONSTRAINT fk_invoice_items_part FOREIGN KEY (part_id) REFERENCES parts(id)
);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_invoice_items_invoice_id')
CREATE INDEX ix_invoice_items_invoice_id ON invoice_items(invoice_id);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_invoice_items_part_id')
CREATE INDEX ix_invoice_items_part_id ON invoice_items(part_id);
GO

-- 8. Ticket Status History Table (Audit Trail)
IF OBJECT_ID('ticket_status_history', 'U') IS NULL
CREATE TABLE ticket_status_history (
    id INT IDENTITY(1,1) CONSTRAINT pk_ticket_status_history PRIMARY KEY,
    ticket_id INT NOT NULL,
    old_status VARCHAR(30) NULL,
    new_status VARCHAR(30) NOT NULL,
    technician_id INT NULL,
    note NVARCHAR(500) NULL,
    created_at DATETIME NOT NULL CONSTRAINT df_ticket_status_history_created_at DEFAULT GETDATE(),
    CONSTRAINT fk_ticket_status_history_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    CONSTRAINT fk_ticket_status_history_tech FOREIGN KEY (technician_id) REFERENCES employees(id)
);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_ticket_status_history_ticket_id')
CREATE INDEX ix_ticket_status_history_ticket_id ON ticket_status_history(ticket_id);
GO

