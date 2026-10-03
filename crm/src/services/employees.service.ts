import { api } from '@/lib/axios';
import {
  CreateEmployeeDto,
  EmployeeQueryParams,
  PaginatedData,
  UpdateEmployeeDto,
  UserProfile,
} from '@/types';

/**
 * Employees & Staff Directory Service.
 * Encapsulates staff listing, technician filtering, creation, update, and deactivation.
 */
export const employeesService = {
  /**
   * Retrieves a paginated list of staff members with role/active filters.
   */
  async getEmployees(params?: EmployeeQueryParams): Promise<PaginatedData<UserProfile>> {
    return api.get<PaginatedData<UserProfile>>(
      '/employees',
      params as unknown as Record<string, unknown>,
    );
  },

  /**
   * Retrieves all active technicians available for ticket assignment.
   */
  async getTechnicians(): Promise<UserProfile[]> {
    return api.get<UserProfile[]>('/employees/technicians');
  },

  /**
   * Registers a new employee system user account.
   */
  async createEmployee(dto: CreateEmployeeDto): Promise<UserProfile> {
    return api.post<UserProfile, CreateEmployeeDto>('/employees', dto);
  },

  /**
   * Updates an existing employee profile or credentials.
   */
  async updateEmployee(id: number, dto: UpdateEmployeeDto): Promise<UserProfile> {
    return api.patch<UserProfile, UpdateEmployeeDto>(`/employees/${id}`, dto);
  },

  /**
   * Soft-deactivates an employee account.
   */
  async deactivateEmployee(id: number): Promise<void> {
    return api.delete<void>(`/employees/${id}`);
  },
};
