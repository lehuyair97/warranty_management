import { api } from '@/lib/axios';
import {
  CreateCustomerDto,
  CreateDeviceDto,
  Customer,
  Device,
} from '@/types';

/**
 * Customers & Registered Devices Service.
 * Encapsulates phone-based lookups and client profile registrations.
 */
export const customersService = {
  /**
   * Looks up an existing customer record by their registered telephone number.
   */
  async getCustomerByPhone(phone: string): Promise<Customer> {
    return api.get<Customer>(`/customers/by-phone/${encodeURIComponent(phone)}`);
  },

  /**
   * Registers a new customer profile.
   */
  async createCustomer(dto: CreateCustomerDto): Promise<Customer> {
    return api.post<Customer, CreateCustomerDto>('/customers', dto);
  },

  /**
   * Registers a customer equipment/device into the database.
   */
  async createDevice(dto: CreateDeviceDto): Promise<Device> {
    return api.post<Device, CreateDeviceDto>('/devices', dto);
  },
};
