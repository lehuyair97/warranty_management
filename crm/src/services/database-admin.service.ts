import { api, axiosClient } from '@/lib/axios';
import * as XLSX from 'xlsx';
import {
  BackupDatabaseResult,
  BackupItem,
  BulkImportResult,
  RestoreDatabaseResult,
} from '@/types';

/**
 * Service orchestrating native database management actions:
 * Backup, restore, and bulk data import/export.
 */
export const databaseAdminService = {
  /**
   * Triggers a native SQL Server full database backup to disk.
   */
  async backupDatabase(): Promise<BackupDatabaseResult> {
    return api.post('/database-admin/backup');
  },

  /**
   * Retrieves list of all available physical .bak files on server.
   */
  async listBackups(): Promise<BackupItem[]> {
    return api.get<BackupItem[]>('/database-admin/backups');
  },

  /**
   * Restores the database from an existing .bak file.
   */
  async restoreDatabase(backupFileName: string): Promise<RestoreDatabaseResult> {
    return api.post('/database-admin/restore', { backupFileName });
  },

  /**
   * Deletes a physical .bak backup file from the server.
   */
  async deleteBackup(fileName: string): Promise<{ message: string; fileName: string }> {
    return api.delete(`/database-admin/backups/${encodeURIComponent(fileName)}`);
  },

  /**
   * Imports spare parts by transmitting CSV content to the database BULK INSERT procedure.
   */
  async importPartsBulk(csvContent: string): Promise<BulkImportResult> {
    return api.post('/database-admin/import/parts', { csvContent });
  },

  /**
   * Bulk imports repair tickets with 'received' status and unassigned technician via BULK INSERT.
   */
  async importTicketsBulk(csvContent: string): Promise<BulkImportResult> {
    return api.post('/database-admin/import/tickets', { csvContent });
  },

  /**
   * Downloads a physical .bak file directly to user device.
   */
  async downloadBackup(fileName: string): Promise<void> {
    const res = await axiosClient.get(
      `/database-admin/backups/${encodeURIComponent(fileName)}/download`,
      { responseType: 'blob' },
    );
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  /**
   * Exports dataset directly from the database and triggers file download.
   */
  async exportTable(
    table: 'parts' | 'invoices' | 'tickets',
    format: 'csv' | 'json' = 'csv',
  ): Promise<void> {
    if (format === 'csv') {
      // Overriding CSV to download a nicely formatted XLSX file instead
      const res = await api.get<Record<string, unknown>[]>(`/database-admin/export/${table}?format=json`);
      const data = res;
      
      const worksheet = XLSX.utils.json_to_sheet(data);
      
      // Auto-fit columns logic
      const keys = Object.keys(data[0] || {});
      const colWidths = keys.map((key) => {
        let maxLen = key.length; // Header length
        data.forEach((row: Record<string, unknown>) => {
          const val = row[key];
          if (val !== null && val !== undefined) {
            maxLen = Math.max(maxLen, String(val).length);
          }
        });
        return { wch: maxLen + 3 }; // Adding some padding
      });
      worksheet['!cols'] = colWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'ExportData');
      
      XLSX.writeFile(workbook, `${table}_export.xlsx`);
      return;
    }

    // JSON fallback
    const res = await axiosClient.get(`/database-admin/export/${table}?format=${format}`, {
      responseType: 'blob',
    });
    const blob = new Blob([res.data], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${table}_export.json`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
