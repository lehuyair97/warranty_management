-- ============================================================
-- MIGRATION 02: USER-DEFINED FUNCTIONS
-- ============================================================

USE warranty_management;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

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
