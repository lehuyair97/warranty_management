import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as fs from 'fs';
import { DataSource } from 'typeorm';
import { DatabaseAdminService } from './database-admin.service';

describe('DatabaseAdminService', () => {
  let service: DatabaseAdminService;
  let dataSource: { query: jest.Mock };

  beforeEach(async () => {
    dataSource = {
      query: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatabaseAdminService,
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<DatabaseAdminService>(DatabaseAdminService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('backupDatabase', () => {
    it('should trigger sp_backup_database successfully', async () => {
      dataSource.query.mockResolvedValue([
        {
          file_name: 'warranty_backup_test.bak',
          backup_path: '/docker-entrypoint-initdb.d/exchange/warranty_backup_test.bak',
          created_at: new Date('2026-10-06T00:00:00Z'),
        },
      ]);

      const result = await service.backupDatabase();
      expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('EXEC dbo.sp_backup_database'),
        expect.any(Array),
      );
      expect(result.fileName).toBe('warranty_backup_test.bak');
      expect(result.backupPath).toBe('/docker-entrypoint-initdb.d/exchange/warranty_backup_test.bak');
    });

    it('should throw InternalServerErrorException on backup failure', async () => {
      dataSource.query.mockRejectedValue(new Error('Disk full'));
      await expect(service.backupDatabase()).rejects.toThrow('Failed to create database backup');
    });
  });

  describe('convertToCsv', () => {
    it('should convert recordset to valid CSV string format', () => {
      const sampleData = [
        { id: 1, part_name: 'RAM DDR4', price: 650000 },
        { id: 2, part_name: 'SSD 512GB', price: 1150000 },
      ];

      const csv = service.convertToCsv(sampleData);
      expect(csv).toContain('id,part_name,price');
      expect(csv).toContain('"1","RAM DDR4","650000"');
      expect(csv).toContain('"2","SSD 512GB","1150000"');
    });

    it('should return empty string for empty records', () => {
      expect(service.convertToCsv([])).toBe('');
    });
  });

  describe('restoreDatabase', () => {
    it('should call sp_restore_database in master database', async () => {
      dataSource.query.mockResolvedValue([
        {
          message: 'Database warranty_management restored successfully',
          restored_from: '/docker-entrypoint-initdb.d/exchange/test.bak',
        },
      ]);

      jest.spyOn(service, 'getBackupFilePath').mockReturnValue('/tmp/test.bak');

      const result = await service.restoreDatabase('test.bak');
      expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('EXEC master.dbo.sp_restore_database'),
        ['/docker-entrypoint-initdb.d/exchange/test.bak'],
      );
      expect(result.message).toContain('restored successfully');
    });

    it('should throw InternalServerErrorException on restore failure', async () => {
      jest.spyOn(service, 'getBackupFilePath').mockReturnValue('/tmp/test.bak');
      dataSource.query.mockRejectedValue(new Error('Corrupt backup file'));

      await expect(service.restoreDatabase('test.bak')).rejects.toThrow('Failed to restore database');
    });
  });

  describe('importPartsBulk', () => {
    it('should throw BadRequestException if CSV content is empty or whitespace', async () => {
      await expect(service.importPartsBulk('')).rejects.toThrow(BadRequestException);
      await expect(service.importPartsBulk('   \n  ')).rejects.toThrow(BadRequestException);
    });

    it('should write CSV and execute sp_bulk_import_parts successfully', async () => {
      jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
      dataSource.query.mockResolvedValue([
        { rows_affected: 3, total_rows_read: 3 },
      ]);

      const csv = 'part_name,unit,price,stock_quantity\nNguon 500W,Cai,650000,10';
      const result = await service.importPartsBulk(csv);

      expect(fs.writeFileSync).toHaveBeenCalled();
      expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('EXEC dbo.sp_bulk_import_parts'),
        expect.arrayContaining([expect.stringContaining('.csv')]),
      );
      expect(result).toEqual({ rowsAffected: 3, totalRowsRead: 3 });
    });

    it('should wrap DB error in BadRequestException', async () => {
      jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
      dataSource.query.mockRejectedValue(new Error('BULK INSERT syntax error'));

      await expect(
        service.importPartsBulk('part_name,unit,price,stock_quantity\nBad,Cai,-10,0'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getBackupFilePath', () => {
    it('should throw NotFoundException if backup file does not exist', () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);
      expect(() => service.getBackupFilePath('nonexistent.bak')).toThrow(NotFoundException);
    });

    it('should return valid path if backup file exists', () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      const filePath = service.getBackupFilePath('existing.bak');
      expect(filePath).toContain('existing.bak');
    });
  });

  describe('deleteBackup', () => {
    it('should unlink file when it exists', () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'unlinkSync').mockImplementation(() => {});

      const result = service.deleteBackup('test_del.bak');
      expect(fs.unlinkSync).toHaveBeenCalled();
      expect(result.fileName).toBe('test_del.bak');
    });

    it('should throw NotFoundException if backup file does not exist', () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);
      expect(() => service.deleteBackup('missing.bak')).toThrow(NotFoundException);
    });
  });

  describe('importTicketsBulk', () => {
    it('should throw BadRequestException if CSV content is empty', async () => {
      await expect(service.importTicketsBulk('')).rejects.toThrow(BadRequestException);
    });

    it('should execute sp_bulk_import_tickets and return result', async () => {
      jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
      dataSource.query.mockResolvedValue([{ rows_affected: 2, total_rows_read: 2 }]);

      const csv = 'device_id,ticket_type,issue_description\n1,repair,Screen broken';
      const result = await service.importTicketsBulk(csv, 3);

      expect(fs.writeFileSync).toHaveBeenCalled();
      expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('EXEC dbo.sp_bulk_import_tickets'),
        expect.arrayContaining([expect.stringContaining('.csv'), 3]),
      );
      expect(result).toEqual({ rowsAffected: 2, totalRowsRead: 2 });
    });
  });

  describe('listBackups', () => {
    it('should return empty array if exchange dir does not exist', async () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);
      const list = await service.listBackups();
      expect(list).toEqual([]);
    });

    it('should filter and sort .bak files newest first', async () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readdirSync').mockReturnValue(['old.bak', 'ignore.txt', 'new.bak'] as any);
      jest.spyOn(fs, 'statSync').mockImplementation((filePath: any) => {
        if (filePath.includes('old.bak')) {
          return { size: 1048576, mtime: new Date('2026-10-01T00:00:00Z') } as any;
        }
        return { size: 2097152, mtime: new Date('2026-10-05T00:00:00Z') } as any;
      });

      const list = await service.listBackups();
      expect(list.length).toBe(2);
      expect(list[0].fileName).toBe('new.bak');
      expect(list[0].sizeMb).toBe(2);
      expect(list[1].fileName).toBe('old.bak');
      expect(list[1].sizeMb).toBe(1);
    });
  });

  describe('export data procedures', () => {
    it('should call sp_export_parts_data', async () => {
      dataSource.query.mockResolvedValue([{ id: 1, part_name: 'Screen' }]);
      const res = await service.exportPartsData();
      expect(dataSource.query).toHaveBeenCalledWith('EXEC dbo.sp_export_parts_data');
      expect(res).toEqual([{ id: 1, part_name: 'Screen' }]);
    });

    it('should call sp_export_invoices_data', async () => {
      dataSource.query.mockResolvedValue([{ id: 1, total_amount: 500000 }]);
      const res = await service.exportInvoicesData();
      expect(dataSource.query).toHaveBeenCalledWith('EXEC dbo.sp_export_invoices_data');
      expect(res).toEqual([{ id: 1, total_amount: 500000 }]);
    });

    it('should call sp_export_tickets_data', async () => {
      dataSource.query.mockResolvedValue([{ id: 1, ticket_number: 'TCK-001' }]);
      const res = await service.exportTicketsData();
      expect(dataSource.query).toHaveBeenCalledWith('EXEC dbo.sp_export_tickets_data');
      expect(res).toEqual([{ id: 1, ticket_number: 'TCK-001' }]);
    });
  });
});
