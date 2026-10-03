import { api } from '@/lib/axios';
import {
  BasePaginationParams,
  CreateDeviceDto,
  Device,
  PaginatedData,
  UpdateDeviceDto,
} from '@/types';

/**
 * Devices Management Service.
 * Encapsulates device registration, lookups, warranty verification, and updates.
 */
export const devicesService = {
  /**
   * Retrieves a paginated list of registered devices.
   */
  async getDevices(params?: BasePaginationParams): Promise<PaginatedData<Device>> {
    return api.get<PaginatedData<Device>>(
      '/devices',
      params as unknown as Record<string, unknown>,
    );
  },

  /**
   * Retrieves full details for a device by its numerical ID.
   */
  async getDeviceById(id: number): Promise<Device> {
    return api.get<Device>(`/devices/${id}`);
  },

  /**
   * Looks up a device by its serial number or IMEI.
   */
  async getDeviceBySerial(serialNumber: string): Promise<Device> {
    return api.get<Device>(`/devices/by-serial/${encodeURIComponent(serialNumber)}`);
  },

  /**
   * Checks current warranty status for a device.
   */
  async checkWarranty(id: number): Promise<{
    deviceId: number;
    isUnderWarranty: boolean;
    warrantyExpiryDate: string | null;
  }> {
    return api.get<{
      deviceId: number;
      isUnderWarranty: boolean;
      warrantyExpiryDate: string | null;
    }>(`/devices/${id}/warranty-status`);
  },

  /**
   * Retrieves historical repair logs for a device.
   */
  async getRepairHistory(id: number): Promise<unknown[]> {
    return api.get<unknown[]>(`/devices/${id}/repair-history`);
  },

  /**
   * Registers a customer equipment/device into the database.
   */
  async createDevice(dto: CreateDeviceDto): Promise<Device> {
    return api.post<Device, CreateDeviceDto>('/devices', dto);
  },

  /**
   * Updates device details or warranty period.
   */
  async updateDevice(id: number, dto: UpdateDeviceDto): Promise<Device> {
    return api.patch<Device, UpdateDeviceDto>(`/devices/${id}`, dto);
  },
};
