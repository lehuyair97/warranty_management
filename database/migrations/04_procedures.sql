-- ============================================================
-- MIGRATION 04: STORED PROCEDURES & CURSORS
-- ============================================================

USE warranty_management;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

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

-- 4.6. Audit invoices for discrepancy reconciliation (Cursor)
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

-- 4.7. Alert delayed tickets (> N days without completion) (Cursor)
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
