-- ============================================================
-- MIGRATION 03: TRIGGERS
-- ============================================================

USE warranty_management;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

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
