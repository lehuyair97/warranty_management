import { Test, TestingModule } from '@nestjs/testing';
import { FastifyReply } from 'fastify';
import * as fs from 'fs';
import { DatabaseAdminController } from './database-admin.controller';
import { DatabaseAdminService } from './database-admin.service';

jest.mock('fs', () => {
  const actualFs = jest.requireActual('fs');
  return {
    ...actualFs,
    createReadStream: jest.fn().mockReturnValue('mock-stream'),
  };
});

describe('DatabaseAdminController', () => {
  let controller: DatabaseAdminController;
  let service: {
    backupDatabase: jest.Mock;
    listBackups: jest.Mock;
    getBackupFilePath: jest.Mock;
    deleteBackup: jest.Mock;
    restoreDatabase: jest.Mock;
    importPartsBulk: jest.Mock;
    importTicketsBulk: jest.Mock;
    exportPartsData: jest.Mock;
    exportInvoicesData: jest.Mock;
    exportTicketsData: jest.Mock;
    convertToCsv: jest.Mock;
  };
  let replyMock: Partial<FastifyReply>;

  beforeEach(async () => {
    service = {
      backupDatabase: jest.fn(),
      listBackups: jest.fn(),
      getBackupFilePath: jest.fn(),
      deleteBackup: jest.fn(),
      restoreDatabase: jest.fn(),
      importPartsBulk: jest.fn(),
      importTicketsBulk: jest.fn(),
      exportPartsData: jest.fn(),
      exportInvoicesData: jest.fn(),
      exportTicketsData: jest.fn(),
      convertToCsv: jest.fn(),
    };

    replyMock = {
      header: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DatabaseAdminController],
      providers: [
        {
          provide: DatabaseAdminService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<DatabaseAdminController>(DatabaseAdminController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('backupDatabase', () => {
    it('should trigger full backup and return result', async () => {
      const mockResult = {
        fileName: 'backup_test.bak',
        backupPath: '/path/backup_test.bak',
        createdAt: '2026-10-06T04:00:00.000Z',
      };
      service.backupDatabase.mockResolvedValue(mockResult);

      const res = await controller.backupDatabase();
      expect(service.backupDatabase).toHaveBeenCalled();
      expect(res).toEqual(mockResult);
    });
  });

  describe('listBackups', () => {
    it('should list all backups on server', async () => {
      const mockBackups = [
        { fileName: 'backup_1.bak', sizeMb: 5.2, createdAt: '2026-10-06T04:00:00.000Z' },
      ];
      service.listBackups.mockResolvedValue(mockBackups);

      const res = await controller.listBackups();
      expect(service.listBackups).toHaveBeenCalled();
      expect(res).toEqual(mockBackups);
    });
  });

  describe('downloadBackup', () => {
    it('should set headers and stream backup file', async () => {
      service.getBackupFilePath.mockReturnValue('/app/exchange/backup_1.bak');

      await controller.downloadBackup('backup_1.bak', replyMock as FastifyReply);

      expect(service.getBackupFilePath).toHaveBeenCalledWith('backup_1.bak');
      expect(fs.createReadStream).toHaveBeenCalledWith('/app/exchange/backup_1.bak');
      expect(replyMock.header).toHaveBeenCalledWith('Content-Type', 'application/octet-stream');
      expect(replyMock.header).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="backup_1.bak"',
      );
      expect(replyMock.send).toHaveBeenCalledWith('mock-stream');
    });
  });

  describe('deleteBackup', () => {
    it('should call service.deleteBackup and return result', async () => {
      const mockResult = { message: 'Backup file deleted successfully', fileName: 'backup_1.bak' };
      service.deleteBackup.mockReturnValue(mockResult);

      const res = await controller.deleteBackup('backup_1.bak');
      expect(service.deleteBackup).toHaveBeenCalledWith('backup_1.bak');
      expect(res).toEqual(mockResult);
    });
  });

  describe('restoreDatabase', () => {
    it('should trigger restore procedure and return status', async () => {
      const mockResult = {
        message: 'Database restored successfully',
        restoredFrom: '/path/backup_1.bak',
      };
      service.restoreDatabase.mockResolvedValue(mockResult);

      const res = await controller.restoreDatabase({ backupFileName: 'backup_1.bak' });
      expect(service.restoreDatabase).toHaveBeenCalledWith('backup_1.bak');
      expect(res).toEqual(mockResult);
    });
  });

  describe('importParts', () => {
    it('should trigger bulk parts import', async () => {
      const mockResult = { rowsAffected: 3, totalRowsRead: 3 };
      service.importPartsBulk.mockResolvedValue(mockResult);

      const res = await controller.importParts({ csvContent: 'part_name,price\r\nA,100' });
      expect(service.importPartsBulk).toHaveBeenCalledWith('part_name,price\r\nA,100');
      expect(res).toEqual(mockResult);
    });
  });

  describe('importTickets', () => {
    it('should trigger bulk tickets import with current user id', async () => {
      const mockResult = { rowsAffected: 2, totalRowsRead: 2 };
      service.importTicketsBulk.mockResolvedValue(mockResult);

      const mockUser: any = { id: 5, role: 'manager', username: 'admin' };
      const res = await controller.importTickets(
        { csvContent: 'device_id,ticket_type\n1,repair' },
        mockUser,
      );
      expect(service.importTicketsBulk).toHaveBeenCalledWith(
        'device_id,ticket_type\n1,repair',
        5,
      );
      expect(res).toEqual(mockResult);
    });
  });

  describe('exportParts', () => {
    it('should return JSON when format=json', async () => {
      const mockData = [{ id: 1, part_name: 'RAM' }];
      service.exportPartsData.mockResolvedValue(mockData);

      await controller.exportParts({ format: 'json' }, replyMock as FastifyReply);

      expect(service.exportPartsData).toHaveBeenCalled();
      expect(replyMock.send).toHaveBeenCalledWith(mockData);
    });

    it('should return CSV with download headers by default', async () => {
      const mockData = [{ id: 1, part_name: 'RAM' }];
      service.exportPartsData.mockResolvedValue(mockData);
      service.convertToCsv.mockReturnValue('id,part_name\n1,RAM');

      await controller.exportParts({ format: 'csv' }, replyMock as FastifyReply);

      expect(service.exportPartsData).toHaveBeenCalled();
      expect(service.convertToCsv).toHaveBeenCalledWith(mockData);
      expect(replyMock.header).toHaveBeenCalledWith('Content-Type', 'text/csv; charset=utf-8');
      expect(replyMock.header).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="parts_export.csv"',
      );
      expect(replyMock.send).toHaveBeenCalledWith('id,part_name\n1,RAM');
    });
  });

  describe('exportInvoices', () => {
    it('should return JSON when format=json', async () => {
      const mockData = [{ id: 10, total_amount: 500000 }];
      service.exportInvoicesData.mockResolvedValue(mockData);

      await controller.exportInvoices({ format: 'json' }, replyMock as FastifyReply);

      expect(service.exportInvoicesData).toHaveBeenCalled();
      expect(replyMock.send).toHaveBeenCalledWith(mockData);
    });

    it('should return CSV with download headers', async () => {
      const mockData = [{ id: 10, total_amount: 500000 }];
      service.exportInvoicesData.mockResolvedValue(mockData);
      service.convertToCsv.mockReturnValue('id,total_amount\n10,500000');

      await controller.exportInvoices({ format: 'csv' }, replyMock as FastifyReply);

      expect(service.exportInvoicesData).toHaveBeenCalled();
      expect(replyMock.header).toHaveBeenCalledWith('Content-Type', 'text/csv; charset=utf-8');
      expect(replyMock.header).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="invoices_export.csv"',
      );
      expect(replyMock.send).toHaveBeenCalledWith('id,total_amount\n10,500000');
    });
  });

  describe('exportTickets', () => {
    it('should return JSON when format=json', async () => {
      const mockData = [{ id: 100, ticket_number: 'TCK-001' }];
      service.exportTicketsData.mockResolvedValue(mockData);

      await controller.exportTickets({ format: 'json' }, replyMock as FastifyReply);

      expect(service.exportTicketsData).toHaveBeenCalled();
      expect(replyMock.send).toHaveBeenCalledWith(mockData);
    });

    it('should return CSV with download headers', async () => {
      const mockData = [{ id: 100, ticket_number: 'TCK-001' }];
      service.exportTicketsData.mockResolvedValue(mockData);
      service.convertToCsv.mockReturnValue('id,ticket_number\n100,TCK-001');

      await controller.exportTickets({ format: 'csv' }, replyMock as FastifyReply);

      expect(service.exportTicketsData).toHaveBeenCalled();
      expect(replyMock.header).toHaveBeenCalledWith('Content-Type', 'text/csv; charset=utf-8');
      expect(replyMock.header).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="tickets_export.csv"',
      );
      expect(replyMock.send).toHaveBeenCalledWith('id,ticket_number\n100,TCK-001');
    });
  });
});
