-- ============================================================
-- DATABASE: warranty_management (Enterprise English Edition)
-- RDBMS: Microsoft SQL Server 2016+ / 2019 / 2022
-- Standard: 100% English Schema, Clean Architecture & Audit Ready
-- ============================================================

USE master;
GO

IF DB_ID(N'warranty_management') IS NOT NULL
BEGIN
    ALTER DATABASE warranty_management SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE warranty_management;
END
GO

CREATE DATABASE warranty_management;
GO

USE warranty_management;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- ============================================================
-- 1. TABLE DEFINITIONS (DDL)
-- ============================================================

-- 1.1. Customers Table
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

-- Index for fast phone number search
CREATE INDEX ix_customers_phone_number ON customers(phone_number);
GO

-- 1.2. Employees Table
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

CREATE INDEX ix_employees_role_is_active ON employees(role, is_active);
GO

-- 1.3. Devices Table
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

-- Filtered Unique Index: Allows multiple NULLs without collision
CREATE UNIQUE NONCLUSTERED INDEX uq_devices_serial_number ON devices(serial_number) WHERE serial_number IS NOT NULL;
CREATE INDEX ix_devices_customer_id ON devices(customer_id);
GO

-- 1.4. Spare Parts Inventory Table
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

CREATE INDEX ix_parts_part_name ON parts(part_name);
CREATE INDEX ix_parts_stock_quantity ON parts(stock_quantity);
GO

-- 1.5. Repair Tickets Table
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

CREATE INDEX ix_tickets_device_id ON tickets(device_id);
CREATE INDEX ix_tickets_receptionist_id ON tickets(receptionist_id);
CREATE INDEX ix_tickets_technician_id ON tickets(technician_id);
CREATE INDEX ix_tickets_status ON tickets(status);
CREATE INDEX ix_tickets_received_at ON tickets(received_at DESC);
CREATE INDEX ix_tickets_status_received_at ON tickets(status, received_at DESC);
GO

-- 1.6. Invoices Table
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

CREATE INDEX ix_invoices_ticket_id ON invoices(ticket_id);
CREATE INDEX ix_invoices_status_created_at ON invoices(status, created_at DESC);
GO

-- 1.7. Invoice Items Table (Replaces ChiTietPhieu)
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

CREATE INDEX ix_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX ix_invoice_items_part_id ON invoice_items(part_id);
GO

-- 1.8. Ticket Status History Table (Audit Trail)
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

-- ============================================================
-- 2. USER-DEFINED FUNCTIONS
-- ============================================================

-- 2.1. Calculate total parts cost for a given invoice
CREATE OR ALTER FUNCTION dbo.fn_calculate_parts_total (@invoice_id INT)
RETURNS DECIMAL(18,2)
AS
BEGIN
    RETURN ISNULL((SELECT SUM(quantity * unit_price)
                   FROM invoice_items
                   WHERE invoice_id = @invoice_id), 0);
END;
GO

-- 2.2. Check if a device is under warranty at a specific date
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

-- 2.3. Retrieve full repair history for a device
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
           inv.status AS payment_status
    FROM tickets t
    LEFT JOIN employees tech ON tech.id = t.technician_id
    LEFT JOIN invoices inv ON inv.ticket_id = t.id
    WHERE t.device_id = @device_id
);
GO

-- ============================================================
-- 3. TRIGGERS
-- ============================================================

-- 3.1. Inventory stock reduction / refund on invoice item modification
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

    -- Check if inventory has enough stock
    IF EXISTS (
        SELECT 1 FROM @delta d
        JOIN parts p ON p.id = d.part_id
        WHERE p.stock_quantity < d.delta
    )
    BEGIN
        ROLLBACK TRANSACTION;
        THROW 50001, N'Insufficient spare part inventory stock.', 1;
    END

    -- Update inventory stock
    UPDATE p
    SET stock_quantity = p.stock_quantity - d.delta,
        updated_at = GETDATE()
    FROM parts p
    JOIN @delta d ON d.part_id = p.id;
END;
GO

-- 3.2. Update invoice total_amount on item changes
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
    SET total_amount = CASE 
            WHEN (inv.labor_fee + dbo.fn_calculate_parts_total(inv.id) - inv.discount_amount) < 0 THEN 0
            ELSE (inv.labor_fee + dbo.fn_calculate_parts_total(inv.id) - inv.discount_amount)
        END,
        updated_at = GETDATE()
    FROM invoices inv
    JOIN affected_invoices a ON a.invoice_id = inv.id;
END;
GO

-- 3.3. Update invoice total_amount when labor_fee or discount_amount changes
CREATE OR ALTER TRIGGER trg_invoices_labor_update
ON invoices AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM deleted) OR UPDATE(labor_fee) OR UPDATE(discount_amount)
    BEGIN
        UPDATE inv
        SET total_amount = CASE 
                WHEN (inv.labor_fee + dbo.fn_calculate_parts_total(inv.id) - inv.discount_amount) < 0 THEN 0
                ELSE (inv.labor_fee + dbo.fn_calculate_parts_total(inv.id) - inv.discount_amount)
            END,
            updated_at = GETDATE()
        FROM invoices inv
        JOIN inserted i ON i.id = inv.id;
    END
END;
GO

-- 3.4. Tickets workflow guard & state machine validation
CREATE OR ALTER TRIGGER trg_tickets_workflow_guard
ON tickets AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    -- Validate technician assignment: Cannot repair or complete without technician
    IF EXISTS (
        SELECT 1 FROM inserted i
        WHERE i.status IN ('repairing', 'completed', 'delivered')
          AND i.technician_id IS NULL
    )
    BEGIN
        ROLLBACK TRANSACTION;
        THROW 50003, N'A technician must be assigned before advancing to repairing or completed.', 1;
    END

    -- Validate state transitions (Linear forward progression)
    IF UPDATE(status)
       AND EXISTS (
           SELECT 1 FROM inserted i
           JOIN deleted d ON d.id = i.id
           WHERE (d.status = 'delivered' AND i.status <> 'delivered') -- Cannot reopen delivered ticket
              OR (i.status = 'delivered' AND d.status NOT IN ('completed', 'delivered')) -- Only completed can be delivered
       )
    BEGIN
        ROLLBACK TRANSACTION;
        THROW 50004, N'Invalid ticket status transition.', 1;
    END

    -- Auto assign completed_at timestamp without triggering recursive loop
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

-- 3.5. Ticket Status History Audit Trail Trigger
CREATE OR ALTER TRIGGER trg_tickets_audit_history
ON tickets AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    -- On INSERT: Record initial status
    IF NOT EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO ticket_status_history (ticket_id, old_status, new_status, technician_id, created_at)
        SELECT i.id, NULL, i.status, i.technician_id, GETDATE()
        FROM inserted i;
    END
    -- On UPDATE: Record state transition if status changed
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

-- 3.6. Financial Immutability: Freeze spare parts modifications on paid invoices
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

-- 3.7. Financial Immutability: Freeze financial fee edits on paid invoices
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

-- ============================================================
-- 4. STORED PROCEDURES
-- ============================================================

-- 4.1. Receive device and create new ticket
CREATE OR ALTER PROCEDURE dbo.sp_receive_device
    @device_id         INT,
    @receptionist_id   INT,
    @issue_description NVARCHAR(500),
    @initial_condition NVARCHAR(200) = NULL,
    @accessories      NVARCHAR(200) = NULL,
    @ticket_type       VARCHAR(20)   = 'repair',
    @ticket_id         INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM devices WHERE id = @device_id)
        THROW 50010, N'Device not found.', 1;

    IF NOT EXISTS (SELECT 1 FROM employees WHERE id = @receptionist_id AND role IN ('receptionist', 'manager'))
        THROW 50011, N'Invalid receptionist or manager employee.', 1;

    -- Automatically detect warranty
    IF @ticket_type = 'repair' AND dbo.fn_is_device_under_warranty(@device_id, CAST(GETDATE() AS DATE)) = 1
        SET @ticket_type = 'warranty';

    INSERT INTO tickets (
        device_id, receptionist_id, ticket_type, issue_description,
        initial_condition, accessories, received_at, status
    )
    VALUES (
        @device_id, @receptionist_id, @ticket_type, @issue_description,
        @initial_condition, @accessories, GETDATE(), 'received'
    );

    SET @ticket_id = SCOPE_IDENTITY();
END;
GO

-- 4.2. Process ticket: Assign technician, diagnosis, and update status
CREATE OR ALTER PROCEDURE dbo.sp_process_ticket
    @ticket_id         INT,
    @status            VARCHAR(30),
    @technician_id     INT           = NULL,
    @fault_cause       NVARCHAR(500) = NULL,
    @repair_solution   NVARCHAR(500) = NULL,
    @estimated_cost    DECIMAL(18,2) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @current_tech INT, @current_status VARCHAR(30);

    SELECT @current_tech = technician_id, @current_status = status
    FROM tickets WHERE id = @ticket_id;

    IF @current_status IS NULL
        THROW 50020, N'Ticket not found.', 1;

    IF @status NOT IN ('received', 'inspecting', 'waiting_for_parts', 'repairing', 'completed', 'delivered', 'cancelled')
        THROW 50021, N'Invalid ticket status.', 1;

    IF @technician_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM employees WHERE id = @technician_id AND role = 'technician')
        THROW 50022, N'Invalid technician employee.', 1;

    IF @status <> 'received' AND @current_tech IS NULL AND @technician_id IS NULL
        THROW 50023, N'A technician must be assigned before advancing ticket status.', 1;

    UPDATE tickets
    SET technician_id   = ISNULL(@technician_id, technician_id),
        fault_cause     = ISNULL(@fault_cause, fault_cause),
        repair_solution = ISNULL(@repair_solution, repair_solution),
        estimated_cost  = ISNULL(@estimated_cost, estimated_cost),
        status          = @status,
        updated_at      = GETDATE()
    WHERE id = @ticket_id;
END;
GO

-- 4.3. Create invoice for ticket
CREATE OR ALTER PROCEDURE dbo.sp_create_invoice
    @ticket_id    INT,
    @labor_fee    DECIMAL(18,2) = 0,
    @invoice_id   INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM tickets WHERE id = @ticket_id)
        THROW 50030, N'Ticket not found.', 1;

    IF @labor_fee < 0
        THROW 50031, N'Labor fee cannot be negative.', 1;

    IF EXISTS (SELECT 1 FROM invoices WHERE ticket_id = @ticket_id AND status = 'unpaid')
        THROW 50032, N'An unpaid invoice already exists for this ticket.', 1;

    DECLARE @ticket_type VARCHAR(20), @discount DECIMAL(18,2) = 0;
    SELECT @ticket_type = ticket_type FROM tickets WHERE id = @ticket_id;

    -- If warranty or re_repair, auto discount 100% labor fee
    IF @ticket_type IN ('warranty', 're_repair')
        SET @discount = @labor_fee;

    INSERT INTO invoices (ticket_id, created_at, status, labor_fee, discount_amount, total_amount)
    VALUES (@ticket_id, GETDATE(), 'unpaid', @labor_fee, @discount, @labor_fee - @discount);

    SET @invoice_id = SCOPE_IDENTITY();
END;
GO

-- 4.4. Add spare part to invoice (handles existing item aggregation)
CREATE OR ALTER PROCEDURE dbo.sp_add_invoice_part
    @invoice_id INT,
    @part_id    INT,
    @quantity   INT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @unit_price DECIMAL(18,2), @stock INT, @inv_status VARCHAR(30);

    SELECT @inv_status = status FROM invoices WHERE id = @invoice_id;
    IF @inv_status IS NULL
        THROW 50040, N'Invoice not found.', 1;
    IF @inv_status = 'paid'
        THROW 50041, N'Cannot add parts to an already paid invoice.', 1;
    IF @quantity <= 0
        THROW 50042, N'Quantity must be greater than zero.', 1;

    SELECT @unit_price = price, @stock = stock_quantity
    FROM parts WHERE id = @part_id;

    IF @unit_price IS NULL
        THROW 50043, N'Spare part not found.', 1;
    IF @stock < @quantity
        THROW 50044, N'Insufficient stock inventory.', 1;

    -- If part already exists in invoice, increment quantity; otherwise insert
    IF EXISTS (SELECT 1 FROM invoice_items WHERE invoice_id = @invoice_id AND part_id = @part_id)
    BEGIN
        UPDATE invoice_items
        SET quantity = quantity + @quantity
        WHERE invoice_id = @invoice_id AND part_id = @part_id;
    END
    ELSE
    BEGIN
        INSERT INTO invoice_items (invoice_id, part_id, quantity, unit_price)
        VALUES (@invoice_id, @part_id, @quantity, @unit_price);
    END

    SELECT id AS invoice_id, labor_fee, discount_amount, total_amount 
    FROM invoices WHERE id = @invoice_id;
END;
GO

-- 4.5. Checkout invoice and mark ticket as delivered
CREATE OR ALTER PROCEDURE dbo.sp_checkout_invoice
    @invoice_id     INT,
    @payment_method VARCHAR(30) = 'cash'
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @ticket_id INT, @inv_status VARCHAR(30), @ticket_status VARCHAR(30);

    SELECT @ticket_id = inv.ticket_id, @inv_status = inv.status, @ticket_status = t.status
    FROM invoices inv
    JOIN tickets t ON t.id = inv.ticket_id
    WHERE inv.id = @invoice_id;

    IF @ticket_id IS NULL
        THROW 50050, N'Invoice not found.', 1;
    IF @inv_status = 'paid'
        THROW 50051, N'Invoice is already paid.', 1;
    IF @ticket_status NOT IN ('completed', 'delivered')
        THROW 50052, N'Checkout only allowed when repair is completed.', 1;

    BEGIN TRY
        BEGIN TRAN;
            UPDATE invoices 
            SET status = 'paid', 
                payment_method = @payment_method, 
                paid_at = GETDATE(),
                updated_at = GETDATE()
            WHERE id = @invoice_id;

            -- If all invoices of this ticket are paid, advance ticket to delivered
            IF NOT EXISTS (SELECT 1 FROM invoices WHERE ticket_id = @ticket_id AND status <> 'paid')
            BEGIN
                UPDATE tickets 
                SET status = 'delivered', updated_at = GETDATE() 
                WHERE id = @ticket_id;
            END
        COMMIT;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK;
        THROW;
    END CATCH
END;
GO

-- ============================================================
-- 5. CURSORS (AUDITING & REPORTING)
-- ============================================================

-- 5.1. Audit invoices for discrepancy reconciliation
CREATE OR ALTER PROCEDURE dbo.sp_audit_invoices
    @auto_fix BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @inv_id INT, @labor DECIMAL(18,2), @discount DECIMAL(18,2), @stored_total DECIMAL(18,2), @calculated_total DECIMAL(18,2);
    DECLARE @error_count INT = 0;

    DECLARE cur_invoices CURSOR LOCAL FAST_FORWARD FOR
        SELECT id, labor_fee, discount_amount, total_amount FROM invoices ORDER BY id;

    OPEN cur_invoices;
    FETCH NEXT FROM cur_invoices INTO @inv_id, @labor, @discount, @stored_total;

    WHILE @@FETCH_STATUS = 0
    BEGIN
        SET @calculated_total = @labor + dbo.fn_calculate_parts_total(@inv_id) - @discount;
        IF @calculated_total < 0 SET @calculated_total = 0;

        IF @calculated_total <> @stored_total
        BEGIN
            SET @error_count += 1;
            IF @auto_fix = 1
                UPDATE invoices SET total_amount = @calculated_total, updated_at = GETDATE() WHERE id = @inv_id;
        END

        FETCH NEXT FROM cur_invoices INTO @inv_id, @labor, @discount, @stored_total;
    END

    CLOSE cur_invoices;
    DEALLOCATE cur_invoices;

    SELECT @error_count AS discrepancies_found, @auto_fix AS was_auto_fixed;
END;
GO

-- 5.2. Alert delayed tickets (> N days without completion) (Cursor)
-- Note: Uses cursor iteration and returns table dataset for Web API consumption!
CREATE OR ALTER PROCEDURE dbo.sp_alert_delayed_tickets
    @delay_days INT = 14
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @delayed_tickets TABLE (
        ticket_id INT,
        customer_name NVARCHAR(100),
        phone_number VARCHAR(20),
        device_name NVARCHAR(100),
        status VARCHAR(30),
        overdue_days INT,
        assigned_technician NVARCHAR(100)
    );

    DECLARE @t_id INT, @c_name NVARCHAR(100), @phone VARCHAR(20),
            @d_name NVARCHAR(100), @st VARCHAR(30), @days INT, @tech NVARCHAR(100);

    DECLARE cur_delayed_tickets CURSOR LOCAL FAST_FORWARD FOR
        SELECT t.id AS ticket_id,
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
          AND DATEDIFF(DAY, t.received_at, GETDATE()) > @delay_days
        ORDER BY t.received_at ASC;

    OPEN cur_delayed_tickets;
    FETCH NEXT FROM cur_delayed_tickets INTO @t_id, @c_name, @phone, @d_name, @st, @days, @tech;

    WHILE @@FETCH_STATUS = 0
    BEGIN
        INSERT INTO @delayed_tickets (ticket_id, customer_name, phone_number, device_name, status, overdue_days, assigned_technician)
        VALUES (@t_id, @c_name, @phone, @d_name, @st, @days, @tech);

        FETCH NEXT FROM cur_delayed_tickets INTO @t_id, @c_name, @phone, @d_name, @st, @days, @tech;
    END

    CLOSE cur_delayed_tickets;
    DEALLOCATE cur_delayed_tickets;

    SELECT * FROM @delayed_tickets ORDER BY overdue_days DESC;
END;
GO

-- 4.8. Backup database to disk
CREATE OR ALTER PROCEDURE dbo.sp_backup_database
    @backup_dir        NVARCHAR(260) = NULL,
    @file_name         NVARCHAR(260) = NULL,
    @out_backup_path   NVARCHAR(500) = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @dir NVARCHAR(260) = ISNULL(@backup_dir, '/docker-entrypoint-initdb.d/exchange');
    DECLARE @timestamp VARCHAR(20) = REPLACE(REPLACE(CONVERT(VARCHAR(19), GETDATE(), 120), ' ', '_'), ':', '-');
    DECLARE @fname NVARCHAR(260) = ISNULL(@file_name, 'warranty_backup_' + @timestamp + '.bak');
    DECLARE @full_path NVARCHAR(500) = @dir + '/' + @fname;

    BEGIN TRY
        BACKUP DATABASE warranty_management
        TO DISK = @full_path
        WITH FORMAT, INIT, COMPRESSION, NAME = 'Warranty Management Full Backup';

        SET @out_backup_path = @full_path;

        SELECT 
            @fname AS file_name,
            @full_path AS backup_path,
            GETDATE() AS created_at;
    END TRY
    BEGIN CATCH
        DECLARE @err_msg NVARCHAR(2048) = ERROR_MESSAGE();
        THROW 50061, @err_msg, 1;
    END CATCH;
END;
GO

-- 4.9. Bulk import spare parts from CSV file
CREATE OR ALTER PROCEDURE dbo.sp_bulk_import_parts
    @csv_file_path NVARCHAR(500),
    @rows_imported INT = 0 OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    IF @csv_file_path IS NULL OR LEN(@csv_file_path) = 0
        THROW 50060, N'CSV file path cannot be empty.', 1;

    CREATE TABLE #staging_parts (
        part_name      NVARCHAR(100),
        unit           VARCHAR(20),
        price          DECIMAL(18,2),
        stock_quantity INT
    );

    BEGIN TRY
        DECLARE @sql NVARCHAR(MAX) = N'
            BULK INSERT #staging_parts
            FROM ''' + REPLACE(@csv_file_path, '''', '''''') + N'''
            WITH (
                FORMAT = ''CSV'',
                FIRSTROW = 2,
                FIELDTERMINATOR = '','',
                ROWTERMINATOR = ''0x0a'',
                TABLOCK
            );';

        EXEC sp_executesql @sql;

        MERGE dbo.parts AS target
        USING (
            SELECT 
                TRIM(part_name) AS part_name,
                ISNULL(NULLIF(TRIM(unit), ''), 'piece') AS unit,
                CAST(price AS DECIMAL(18,2)) AS price,
                CAST(stock_quantity AS INT) AS stock_quantity
            FROM #staging_parts
            WHERE NULLIF(TRIM(part_name), '') IS NOT NULL AND price >= 0 AND stock_quantity >= 0
        ) AS source
        ON target.part_name = source.part_name
        WHEN MATCHED THEN
            UPDATE SET 
                target.stock_quantity = target.stock_quantity + source.stock_quantity,
                target.price = source.price,
                target.updated_at = GETDATE()
        WHEN NOT MATCHED THEN
            INSERT (part_name, unit, price, stock_quantity, created_at, updated_at)
            VALUES (source.part_name, source.unit, source.price, source.stock_quantity, GETDATE(), GETDATE());

        SET @rows_imported = @@ROWCOUNT;

        SELECT 
            @rows_imported AS rows_affected,
            (SELECT COUNT(1) FROM #staging_parts) AS total_rows_read;

        DROP TABLE #staging_parts;
    END TRY
    BEGIN CATCH
        IF OBJECT_ID('tempdb..#staging_parts') IS NOT NULL
            DROP TABLE #staging_parts;
        DECLARE @import_err NVARCHAR(2048) = ERROR_MESSAGE();
        THROW 50062, @import_err, 1;
    END CATCH;
END;
GO

-- 4.10. Export parts dataset
CREATE OR ALTER PROCEDURE dbo.sp_export_parts_data
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        id, 
        part_name, 
        unit, 
        price, 
        stock_quantity, 
        FORMAT(created_at, 'yyyy-MM-dd HH:mm:ss') AS created_at,
        FORMAT(updated_at, 'yyyy-MM-dd HH:mm:ss') AS updated_at
    FROM dbo.parts
    ORDER BY id ASC;
END;
GO

-- 4.11. Export invoices dataset
CREATE OR ALTER PROCEDURE dbo.sp_export_invoices_data
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        i.id,
        i.ticket_id,
        i.status,
        i.labor_fee,
        i.discount_amount,
        i.total_amount,
        i.payment_method,
        FORMAT(i.paid_at, 'yyyy-MM-dd HH:mm:ss') AS paid_at,
        FORMAT(i.created_at, 'yyyy-MM-dd HH:mm:ss') AS created_at
    FROM dbo.invoices i
    ORDER BY i.id ASC;
END;
GO

-- 4.12. Restore database procedure (in master)
USE master;
GO

CREATE OR ALTER PROCEDURE dbo.sp_restore_database
    @backup_path NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;

    IF @backup_path IS NULL OR LEN(@backup_path) = 0
        THROW 50063, N'Backup path cannot be empty.', 1;

    BEGIN TRY
        ALTER DATABASE warranty_management SET SINGLE_USER WITH ROLLBACK IMMEDIATE;

        RESTORE DATABASE warranty_management 
        FROM DISK = @backup_path 
        WITH REPLACE;

        ALTER DATABASE warranty_management SET MULTI_USER;

        SELECT 
            'Database warranty_management restored successfully' AS message,
            @backup_path AS restored_from,
            GETDATE() AS restored_at;
    END TRY
    BEGIN CATCH
        IF DB_ID('warranty_management') IS NOT NULL
        BEGIN
            BEGIN TRY
                ALTER DATABASE warranty_management SET MULTI_USER;
            END TRY
            BEGIN CATCH
            END CATCH;
        END;

        DECLARE @restore_err NVARCHAR(2048) = ERROR_MESSAGE();
        THROW 50064, @restore_err, 1;
    END CATCH;
END;
GO

USE warranty_management;
GO

-- 4.13. Bulk Import Tickets via Native BULK INSERT
CREATE OR ALTER PROCEDURE dbo.sp_bulk_import_tickets
    @csv_file_path   NVARCHAR(500),
    @receptionist_id INT = 1,
    @rows_imported   INT = 0 OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    IF @csv_file_path IS NULL OR LEN(@csv_file_path) = 0
        THROW 50060, N'CSV file path cannot be empty.', 1;

    IF NOT EXISTS (SELECT 1 FROM employees WHERE id = @receptionist_id)
        SELECT TOP 1 @receptionist_id = id FROM employees WHERE role IN ('manager', 'receptionist');

    CREATE TABLE #staging_tickets (
        device_id         INT,
        ticket_type       VARCHAR(20),
        issue_description NVARCHAR(500),
        initial_condition NVARCHAR(200),
        accessories       NVARCHAR(200),
        estimated_cost    DECIMAL(18,2)
    );

    BEGIN TRY
        DECLARE @sql NVARCHAR(MAX) = N'
            BULK INSERT #staging_tickets
            FROM ''' + REPLACE(@csv_file_path, '''', '''''') + N'''
            WITH (
                FORMAT = ''CSV'',
                FIRSTROW = 2,
                FIELDTERMINATOR = '','',
                ROWTERMINATOR = ''0x0a'',
                TABLOCK
            );';

        EXEC sp_executesql @sql;

        INSERT INTO dbo.tickets (
            device_id,
            receptionist_id,
            technician_id,
            ticket_type,
            issue_description,
            initial_condition,
            accessories,
            estimated_cost,
            status,
            received_at,
            created_at,
            updated_at
        )
        SELECT 
            s.device_id,
            @receptionist_id,
            NULL,
            CASE 
                WHEN LOWER(TRIM(s.ticket_type)) IN ('repair', 'warranty', 're_repair') 
                THEN LOWER(TRIM(s.ticket_type)) 
                ELSE 'repair' 
            END,
            ISNULL(NULLIF(TRIM(s.issue_description), ''), N'Tiếp nhận thiết bị sửa chữa'),
            NULLIF(TRIM(s.initial_condition), ''),
            NULLIF(TRIM(s.accessories), ''),
            CASE WHEN s.estimated_cost >= 0 THEN s.estimated_cost ELSE 0 END,
            'received',
            GETDATE(),
            GETDATE(),
            GETDATE()
        FROM #staging_tickets s
        JOIN dbo.devices d ON d.id = s.device_id;

        SET @rows_imported = @@ROWCOUNT;

        SELECT 
            @rows_imported AS rows_affected,
            (SELECT COUNT(*) FROM #staging_tickets) AS total_rows_read;

        DROP TABLE #staging_tickets;
    END TRY
    BEGIN CATCH
        IF OBJECT_ID('tempdb..#staging_tickets') IS NOT NULL
            DROP TABLE #staging_tickets;

        DECLARE @err NVARCHAR(2048) = ERROR_MESSAGE();
        THROW 50062, @err, 1;
    END CATCH;
END;
GO

-- ============================================================
-- 6. SEED DATA (20 ROWS PER TABLE, 100% ENGLISH)
-- ============================================================

-- Disable operational triggers during initial bulk seed population
ALTER TABLE tickets DISABLE TRIGGER ALL;
ALTER TABLE invoices DISABLE TRIGGER ALL;
ALTER TABLE invoice_items DISABLE TRIGGER ALL;
GO

-- Bcrypt hash for password '123456': $2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm

-- 6.1. Seed Customers (20 rows)
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
GO

-- 6.2. Seed Employees (20 rows)
-- Password for all seed accounts is '123456'
DECLARE @pwd VARCHAR(255) = '$2a$10$SlADIIkluEMU01h7edYt8ub1buSSTrW5gfTiS96fDMVLKrlUSwsEm';

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
GO

-- 6.3. Seed Spare Parts (20 rows)
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
GO

-- 6.4. Seed Devices (20 rows)
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
GO

-- 6.5. Seed Tickets (20 rows)
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
GO

-- 6.6. Seed Invoices (20 rows)
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
GO

-- 6.7. Seed Invoice Items (20 rows)
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
GO

-- 6.8. Seed Initial Ticket Status History (Audit Trail)
INSERT INTO ticket_status_history (ticket_id, old_status, new_status, technician_id, note, created_at)
SELECT 
    t.id,
    NULL,
    'received',
    t.technician_id,
    N'Tiếp nhận thiết bị ban đầu tại quầy lễ tân',
    t.received_at
FROM tickets t;
GO

-- Re-enable operational triggers for live runtime enforcement
ALTER TABLE tickets ENABLE TRIGGER ALL;
ALTER TABLE invoices ENABLE TRIGGER ALL;
ALTER TABLE invoice_items ENABLE TRIGGER ALL;
GO

PRINT N'Database initialization and sample data seeding completed successfully.';
GO
