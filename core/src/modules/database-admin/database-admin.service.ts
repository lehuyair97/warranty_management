import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { DataSource } from 'typeorm';

export interface BackupItem {
  fileName: string;
  sizeMb: number;
  createdAt: string;
}

export interface BulkImportResult {
  rowsAffected: number;
  totalRowsRead: number;
}

/**
 * Service managing native database operations: backup, restore, and bulk data import/export.
 */
@Injectable()
export class DatabaseAdminService {
  private readonly logger = new Logger(DatabaseAdminService.name);

  constructor(private readonly dataSource: DataSource) {
    this.ensureExchangeDirectory();
  }

  /**
   * Resolves the host or container filesystem directory used to exchange files with MSSQL.
   */
  private getLocalExchangeDir(): string {
    const candidates = [
      '/app/exchange',
      path.resolve(process.cwd(), 'database/exchange'),
      path.resolve(process.cwd(), '../database/exchange'),
    ];

    for (const dir of candidates) {
      if (fs.existsSync(dir)) {
        return dir;
      }
    }

    // Default fallback to first non-root candidate or create it
    const defaultDir = path.resolve(process.cwd(), '../database/exchange');
    try {
      fs.mkdirSync(defaultDir, { recursive: true });
      return defaultDir;
    } catch {
      return '/tmp';
    }
  }

  /**
   * Resolves the path as seen by the SQL Server container.
   */
  private getMssqlExchangePath(fileName: string): string {
    return `/docker-entrypoint-initdb.d/exchange/${fileName}`;
  }

  /**
   * Ensures the local exchange directory exists with proper permissions.
   */
  private ensureExchangeDirectory(): void {
    const dir = this.getLocalExchangeDir();
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch (err) {
        this.logger.warn(`Could not create exchange directory at ${dir}: ${(err as Error).message}`);
      }
    }
  }

  /**
   * Executes a native SQL Server BACKUP DATABASE operation via dbo.sp_backup_database.
   */
  async backupDatabase(): Promise<{ fileName: string; backupPath: string; createdAt: string }> {
    this.ensureExchangeDirectory();

    const timestamp = new Date().toISOString().replace(/[-:T]/g, '_').slice(0, 19);
    const fileName = `warranty_backup_${timestamp}.bak`;
    const mssqlPath = this.getMssqlExchangePath(fileName);

    try {
      const result: { file_name: string; backup_path: string; created_at: Date }[] =
        await this.dataSource.query(
          `
          DECLARE @out_path NVARCHAR(500);
          EXEC dbo.sp_backup_database
            @backup_dir = '/docker-entrypoint-initdb.d/exchange',
            @file_name = @0,
            @out_backup_path = @out_path OUTPUT;
          `,
          [fileName],
        );

      this.logger.log(`Database backup created successfully: ${fileName}`);
      return {
        fileName: result?.[0]?.file_name || fileName,
        backupPath: result?.[0]?.backup_path || mssqlPath,
        createdAt: result?.[0]?.created_at?.toISOString() || new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Database backup failed: ${(error as Error).message}`, (error as Error).stack);
      throw new InternalServerErrorException(
        `Failed to create database backup: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Lists all available .bak backup files located in the exchange directory.
   */
  async listBackups(): Promise<BackupItem[]> {
    const dir = this.getLocalExchangeDir();
    if (!fs.existsSync(dir)) {
      return [];
    }

    try {
      const files = fs.readdirSync(dir);
      const backupFiles: BackupItem[] = [];

      for (const file of files) {
        if (file.endsWith('.bak')) {
          const filePath = path.join(dir, file);
          const stats = fs.statSync(filePath);
          backupFiles.push({
            fileName: file,
            sizeMb: Number((stats.size / (1024 * 1024)).toFixed(2)),
            createdAt: stats.mtime.toISOString(),
          });
        }
      }

      // Sort newest first
      return backupFiles.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    } catch (error) {
      this.logger.error(`Failed to list backup files: ${(error as Error).message}`);
      return [];
    }
  }

  /**
   * Retrieves the absolute local path to a backup file for streaming.
   */
  getBackupFilePath(fileName: string): string {
    const sanitizedName = path.basename(fileName);
    const dir = this.getLocalExchangeDir();
    const filePath = path.join(dir, sanitizedName);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`Backup file ${sanitizedName} not found.`);
    }

    return filePath;
  }

  /**
   * Deletes a physical backup file from the exchange directory.
   */
  deleteBackup(fileName: string): { message: string; fileName: string } {
    const filePath = this.getBackupFilePath(fileName);
    try {
      fs.unlinkSync(filePath);
      this.logger.log(`Deleted backup file: ${fileName}`);
      return { message: 'Backup file deleted successfully', fileName };
    } catch (error) {
      this.logger.error(`Failed to delete backup file: ${(error as Error).message}`);
      throw new InternalServerErrorException(
        `Failed to delete backup file: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Executes a native database restore from a selected .bak file via master.dbo.sp_restore_database.
   */
  async restoreDatabase(backupFileName: string): Promise<{ message: string; restoredFrom: string }> {
    const sanitizedName = path.basename(backupFileName);
    const localPath = this.getBackupFilePath(sanitizedName);
    const mssqlPath = this.getMssqlExchangePath(sanitizedName);

    this.logger.warn(`Initiating database restore from ${mssqlPath}...`);

    try {
      // Switch session to master context to release locks on warranty_management, then switch back
      const result: { message: string; restored_from: string }[] = await this.dataSource.query(
        `USE master; EXEC master.dbo.sp_restore_database @backup_path = @0; USE warranty_management;`,
        [mssqlPath],
      );

      this.logger.log(`Database restore completed successfully from ${mssqlPath}`);
      return {
        message: result?.[0]?.message || 'Database restored successfully',
        restoredFrom: result?.[0]?.restored_from || mssqlPath,
      };
    } catch (error) {
      this.logger.error(`Database restore failed: ${(error as Error).message}`, (error as Error).stack);
      throw new InternalServerErrorException(
        `Failed to restore database: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Performs bulk import of spare parts by writing CSV content and triggering BULK INSERT.
   */
  async importPartsBulk(csvContent: string): Promise<BulkImportResult> {
    if (!csvContent || !csvContent.trim()) {
      throw new BadRequestException('CSV content cannot be empty.');
    }

    const dir = this.getLocalExchangeDir();
    const timestamp = Date.now();
    const fileName = `import_parts_${timestamp}.csv`;
    const localFilePath = path.join(dir, fileName);
    const mssqlPath = this.getMssqlExchangePath(fileName);

    try {
      // Ensure CRLF or LF formatting is clean
      const normalizedContent = csvContent.replace(/\r\n/g, '\n').trim() + '\n';
      fs.writeFileSync(localFilePath, normalizedContent, { encoding: 'utf8', mode: 0o666 });

      const result: { rows_affected: number; total_rows_read: number }[] =
        await this.dataSource.query(
          `EXEC dbo.sp_bulk_import_parts @csv_file_path = @0`,
          [mssqlPath],
        );

      const rowsAffected = result?.[0]?.rows_affected ?? 0;
      const totalRowsRead = result?.[0]?.total_rows_read ?? 0;

      this.logger.log(`Bulk import completed: ${rowsAffected} parts affected (${totalRowsRead} read)`);
      return { rowsAffected, totalRowsRead };
    } catch (error) {
      this.logger.error(`Bulk import failed: ${(error as Error).message}`, (error as Error).stack);
      throw new BadRequestException(
        `Failed to bulk import spare parts: ${(error as Error).message}`,
      );
    } finally {
      // Clean up temporary import file after 5 seconds
      setTimeout(() => {
        try {
          if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
          }
        } catch {
          // ignore cleanup errors
        }
      }, 5000).unref();
    }
  }

  /**
   * Performs bulk import of repair tickets by writing CSV content and triggering BULK INSERT.
   * Tickets are always created with 'received' status and unassigned technician, recording audit history.
   */
  async importTicketsBulk(
    csvContent: string,
    receptionistId: number = 1,
  ): Promise<BulkImportResult> {
    if (!csvContent || !csvContent.trim()) {
      throw new BadRequestException('CSV content cannot be empty.');
    }

    const dir = this.getLocalExchangeDir();
    const timestamp = Date.now();
    const fileName = `import_tickets_${timestamp}.csv`;
    const localFilePath = path.join(dir, fileName);
    const mssqlPath = this.getMssqlExchangePath(fileName);

    try {
      const normalizedContent = csvContent.replace(/\r\n/g, '\n').trim() + '\n';
      fs.writeFileSync(localFilePath, normalizedContent, { encoding: 'utf8', mode: 0o666 });

      const result: { rows_affected: number; total_rows_read: number }[] =
        await this.dataSource.query(
          `EXEC dbo.sp_bulk_import_tickets @csv_file_path = @0, @receptionist_id = @1`,
          [mssqlPath, receptionistId],
        );

      const rowsAffected = result?.[0]?.rows_affected ?? 0;
      const totalRowsRead = result?.[0]?.total_rows_read ?? 0;

      this.logger.log(`Bulk ticket import completed: ${rowsAffected} tickets affected (${totalRowsRead} read)`);
      return { rowsAffected, totalRowsRead };
    } catch (error) {
      this.logger.error(`Bulk ticket import failed: ${(error as Error).message}`, (error as Error).stack);
      throw new BadRequestException(
        `Failed to bulk import repair tickets: ${(error as Error).message}`,
      );
    } finally {
      setTimeout(() => {
        try {
          if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
          }
        } catch {
          // ignore cleanup errors
        }
      }, 5000).unref();
    }
  }

  /**
   * Exports parts data using stored procedure dbo.sp_export_parts_data.
   */
  async exportPartsData(): Promise<Record<string, unknown>[]> {
    return this.dataSource.query(`EXEC dbo.sp_export_parts_data`);
  }

  /**
   * Exports invoices data using stored procedure dbo.sp_export_invoices_data.
   */
  async exportInvoicesData(): Promise<Record<string, unknown>[]> {
    return this.dataSource.query(`EXEC dbo.sp_export_invoices_data`);
  }

  /**
   * Exports tickets data using stored procedure dbo.sp_export_tickets_data.
   */
  async exportTicketsData(): Promise<Record<string, unknown>[]> {
    return this.dataSource.query(`EXEC dbo.sp_export_tickets_data`);
  }

  /**
   * Converts an array of objects into standard CSV text format.
   */
  convertToCsv(records: Record<string, unknown>[]): string {
    if (!records || !records.length) {
      return '';
    }

    const headers = Object.keys(records[0]);
    const lines = [headers.join(',')];

    for (const record of records) {
      const row = headers.map((header) => {
        const val = record[header];
        if (val === null || val === undefined) {
          return '';
        }
        const strVal = String(val).replace(/"/g, '""');
        return `"${strVal}"`;
      });
      lines.push(row.join(','));
    }

    return lines.join('\n');
  }
}
