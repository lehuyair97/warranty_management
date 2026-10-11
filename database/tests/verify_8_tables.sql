-- ============================================================
-- VERIFICATION TEST SCRIPT: 8-Table Schema Integrity & Logic
-- Runs within a transaction and rolls back at the end.
-- ============================================================

USE warranty_management;
GO

SET NOCOUNT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

BEGIN TRAN;

PRINT N'--------------------------------------------------';
PRINT N'TEST 1: Verify exactly 8 tables exist (ticket_items absent)';
PRINT N'--------------------------------------------------';
DECLARE @table_count INT;
SELECT @table_count = COUNT(1) 
FROM sys.tables 
WHERE is_ms_shipped = 0;

IF @table_count <> 8
    THROW 51001, N'FAILED: Table count is not 8!', 1;

IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'ticket_items')
    THROW 51002, N'FAILED: ticket_items table still exists!', 1;

PRINT N'PASSED: Exactly 8 tables verified. ticket_items is absent.';

PRINT N'--------------------------------------------------';
PRINT N'TEST 2: Verify tickets.status CHECK constraint';
PRINT N'--------------------------------------------------';
BEGIN TRY
    INSERT INTO tickets (device_id, receptionist_id, ticket_type, issue_description, status)
    VALUES (1, 1, 'repair', N'Test status constraint', 'paid');
    THROW 51003, N'FAILED: tickets allowed invalid status "paid"!', 1;
END TRY
BEGIN CATCH
    IF ERROR_NUMBER() = 51003 THROW;
    PRINT N'PASSED: tickets rejected status "paid" as expected.';
END CATCH;

PRINT N'--------------------------------------------------';
PRINT N'TEST 3: Verify sp_create_invoice & sp_add_invoice_part';
PRINT N'--------------------------------------------------';
DECLARE @new_ticket_id INT;
INSERT INTO tickets (device_id, receptionist_id, technician_id, ticket_type, issue_description, status, estimated_cost)
VALUES (1, 2, 7, 'repair', N'Test repair', 'repairing', 350000);
SET @new_ticket_id = SCOPE_IDENTITY();

DECLARE @test_inv_id INT;
EXEC dbo.sp_create_invoice 
    @ticket_id = @new_ticket_id, 
    @labor_fee = 100000, 
    @invoice_id = @test_inv_id OUTPUT;

IF @test_inv_id IS NULL
    THROW 51004, N'FAILED: sp_create_invoice did not return invoice_id!', 1;

-- Check initial part stock
DECLARE @initial_stock INT;
SELECT @initial_stock = stock_quantity FROM parts WHERE id = 1;

-- Add 2 units of part 1
EXEC dbo.sp_add_invoice_part 
    @invoice_id = @test_inv_id, 
    @part_id = 1, 
    @quantity = 2;

-- Verify stock deducted
DECLARE @stock_after INT;
SELECT @stock_after = stock_quantity FROM parts WHERE id = 1;

IF @stock_after <> @initial_stock - 2
    THROW 51005, N'FAILED: Stock was not deducted by trigger trg_invoice_items_stock!', 1;

-- Verify quantity aggregated when adding same part again
EXEC dbo.sp_add_invoice_part 
    @invoice_id = @test_inv_id, 
    @part_id = 1, 
    @quantity = 1;

DECLARE @total_qty INT;
SELECT @total_qty = quantity FROM invoice_items WHERE invoice_id = @test_inv_id AND part_id = 1;
IF @total_qty <> 3
    THROW 51006, N'FAILED: Part quantity was not aggregated!', 1;

PRINT N'PASSED: Invoice creation, part addition, and stock deduction verified.';

PRINT N'--------------------------------------------------';
PRINT N'TEST 4: Verify completing a ticket keeps the invoice unpaid (manual checkout)';
PRINT N'--------------------------------------------------';
-- Check status before completion
DECLARE @inv_status VARCHAR(30);
SELECT @inv_status = status FROM invoices WHERE id = @test_inv_id;
IF @inv_status <> 'unpaid'
    THROW 51007, N'FAILED: Invoice is not unpaid before ticket completion!', 1;

-- Complete the ticket
UPDATE tickets 
SET status = 'completed', completed_at = GETDATE()
WHERE id = @new_ticket_id;

-- Invoice must stay unpaid until the cashier checks out
SELECT @inv_status = status FROM invoices WHERE id = @test_inv_id;
IF @inv_status <> 'unpaid'
    THROW 51008, N'FAILED: Invoice must stay unpaid after ticket completion!', 1;

PRINT N'PASSED: Invoice stays unpaid after ticket completion.';

PRINT N'--------------------------------------------------';
PRINT N'TEST 5: Verify sp_checkout_invoice updates payment_method and delivers ticket';
PRINT N'--------------------------------------------------';
EXEC dbo.sp_checkout_invoice 
    @invoice_id = @test_inv_id, 
    @payment_method = 'bank_transfer';

DECLARE @final_ticket_status VARCHAR(30), @final_payment_method VARCHAR(30);
SELECT @final_ticket_status = status FROM tickets WHERE id = @new_ticket_id;
SELECT @final_payment_method = payment_method FROM invoices WHERE id = @test_inv_id;
SELECT @inv_status = status FROM invoices WHERE id = @test_inv_id;

IF @inv_status <> 'paid'
    THROW 51009, N'FAILED: Invoice was not set to paid by checkout!', 1;

IF @final_ticket_status <> 'delivered'
    THROW 51013, N'FAILED: Ticket status was not updated to delivered!', 1;

IF @final_payment_method <> 'bank_transfer'
    THROW 51014, N'FAILED: Invoice payment_method was not updated!', 1;

PRINT N'PASSED: Checkout set the invoice to paid, saved payment_method and delivered the ticket.';

PRINT N'--------------------------------------------------';
PRINT N'TEST 6: Verify sp_add_invoice_part is blocked on a paid invoice';
PRINT N'--------------------------------------------------';
BEGIN TRY
    EXEC dbo.sp_add_invoice_part @invoice_id = @test_inv_id, @part_id = 2, @quantity = 1;
    THROW 51023, N'FAILED: Allowed sp_add_invoice_part on a paid invoice!', 1;
END TRY
BEGIN CATCH
    IF ERROR_NUMBER() = 51023 THROW;
    IF ERROR_NUMBER() <> 50041
        THROW 51024, N'FAILED: Expected error 50041 for sp_add_invoice_part on paid invoice!', 1;
    PRINT N'PASSED: Blocked sp_add_invoice_part on paid invoice (Procedure Error 50041).';
END CATCH;

PRINT N'--------------------------------------------------';
PRINT N'TEST 7: Verify sp_audit_invoices reconciliation';
PRINT N'--------------------------------------------------';
EXEC dbo.sp_audit_invoices @auto_fix = 0;
PRINT N'PASSED: Invoice audit procedure executed cleanly.';

PRINT N'--------------------------------------------------';
PRINT N'TEST 8: Verify Financial Immutability Triggers (50035 & 50036)';
PRINT N'--------------------------------------------------';
-- 8A: Direct DML on paid invoice items (Must fail with 50035 from trg_invoice_items_freeze_paid)
BEGIN TRY
    INSERT INTO invoice_items (invoice_id, part_id, quantity, unit_price) VALUES (1, 2, 1, 100000);
    THROW 51009, N'FAILED: Allowed direct insert into invoice_items on a paid invoice!', 1;
END TRY
BEGIN CATCH
    IF ERROR_NUMBER() = 51009 THROW;
    IF ERROR_NUMBER() <> 50035
        THROW 51010, N'FAILED: Expected error 50035 for freeze trigger!', 1;
    PRINT N'PASSED: Blocked direct DML on paid invoice items (Trigger Error 50035).';
    IF @@TRANCOUNT = 0 BEGIN TRAN;
END CATCH;

-- 8B: Direct modification of paid invoice amount (Must fail with 50036 from trg_invoices_freeze_paid_amounts)
BEGIN TRY
    UPDATE invoices SET total_amount = total_amount - 50000 WHERE id = 1;
    THROW 51011, N'FAILED: Allowed modifying total_amount on a paid invoice!', 1;
END TRY
BEGIN CATCH
    IF ERROR_NUMBER() = 51011 THROW;
    IF ERROR_NUMBER() <> 50036
        THROW 51012, N'FAILED: Expected error 50036 for amount freeze trigger!', 1;
    PRINT N'PASSED: Blocked modifying amount on paid invoice (Trigger Error 50036).';
    IF @@TRANCOUNT = 0 BEGIN TRAN;
END CATCH;

PRINT N'--------------------------------------------------';
PRINT N'TEST 9: Verify seed completion preserves correct invoice amounts (No double-counting)';
PRINT N'--------------------------------------------------';
-- Ticket 15 in seed: labor_fee = 450,000, parts = 950,000, total_amount = 1,400,000.
UPDATE tickets 
SET status = 'completed', completed_at = GETDATE() 
WHERE id = 15;

DECLARE @t15_inv_status VARCHAR(30), @t15_labor DECIMAL(18,2), @t15_total DECIMAL(18,2);
SELECT 
    @t15_inv_status = status, 
    @t15_labor = labor_fee, 
    @t15_total = total_amount 
FROM invoices 
WHERE ticket_id = 15;

IF @t15_inv_status <> 'unpaid'
    THROW 51015, N'FAILED: Ticket 15 invoice must stay unpaid until manual checkout!', 1;

IF @t15_labor <> 450000
    THROW 51016, N'FAILED: Ticket 15 invoice labor_fee was corrupted upon completion!', 1;

IF @t15_total <> 1400000
    THROW 51017, N'FAILED: Ticket 15 total_amount double-counted parts or was incorrect!', 1;

PRINT N'PASSED: Completion keeps invoice unpaid with labor_fee 450,000 and total_amount 1,400,000.';

IF @@TRANCOUNT > 0 ROLLBACK TRAN;
PRINT N'==================================================';
PRINT N'ALL 9 VERIFICATION TESTS PASSED SUCCESSFULLY! (Rolled back)';
PRINT N'==================================================';
GO

