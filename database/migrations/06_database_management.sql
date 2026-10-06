-- ============================================================
-- MIGRATION 06: DATABASE MANAGEMENT (BACKUP, RESTORE, BULK IMPORT/EXPORT)
-- ============================================================

USE warranty_management;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- 6.1. Stored Procedure: Backup Database to Disk
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

-- 6.2. Stored Procedure: Bulk Import Spare Parts from CSV via BULK INSERT
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

        -- Upsert logic: if part_name matches, increment stock and update price; otherwise insert new record
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

-- 6.3. Stored Procedure: Export Parts Dataset
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

-- 6.4. Stored Procedure: Export Invoices Dataset
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

-- 6.5. Stored Procedure: Export Tickets Dataset
CREATE OR ALTER PROCEDURE dbo.sp_export_tickets_data
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        t.id,
        t.device_id,
        t.receptionist_id,
        t.technician_id,
        t.ticket_type,
        t.status,
        t.issue_description,
        t.initial_condition,
        t.accessories,
        t.fault_cause,
        t.repair_solution,
        t.estimated_cost,
        FORMAT(t.received_at, 'yyyy-MM-dd HH:mm:ss') AS received_at,
        FORMAT(t.completed_at, 'yyyy-MM-dd HH:mm:ss') AS completed_at
    FROM dbo.tickets t
    ORDER BY t.id ASC;
END;
GO

-- 6.6. Stored Procedure: Restore Database (defined in master database)
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
        -- Ensure database is returned to MULTI_USER on failure
        IF DB_ID('warranty_management') IS NOT NULL
        BEGIN
            BEGIN TRY
                ALTER DATABASE warranty_management SET MULTI_USER;
            END TRY
            BEGIN CATCH
                -- ignore secondary reset error
            END CATCH;
        END;

        DECLARE @restore_err NVARCHAR(2048) = ERROR_MESSAGE();
        THROW 50064, @restore_err, 1;
    END CATCH;
END;
GO

USE warranty_management;
GO

-- 6.7. Bulk Import Tickets via Native BULK INSERT
-- Inserts tickets with status 'received' and technician unassigned, auto-triggering audit history
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

