import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/common/constants';
import { employeesService } from '@/services/employees.service';
import {
  CreateEmployeeDto,
  EmployeeQueryParams,
  UpdateEmployeeDto,
} from '@/types';

/**
 * Hook to retrieve a paginated list of employees.
 */
export function useEmployees(params?: EmployeeQueryParams) {
  return useQuery({
    queryKey: queryKeys.employees.list(params),
    queryFn: () => employeesService.getEmployees(params),
  });
}

/**
 * Hook to retrieve technicians available for assignment.
 */
export function useTechnicians() {
  return useQuery({
    queryKey: queryKeys.employees.technicians(),
    queryFn: () => employeesService.getTechnicians(),
  });
}

/**
 * Hook to create a new employee account.
 */
export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateEmployeeDto) => employeesService.createEmployee(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
    },
  });
}

/**
 * Hook to deactivate an employee account.
 */
export function useDeactivateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => employeesService.deactivateEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all });
    },
  });
}

/**
 * Hook to update an existing employee account.
 */
export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateEmployeeDto }) =>
      employeesService.updateEmployee(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all });
    },
  });
}
