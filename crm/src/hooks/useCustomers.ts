import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/common/constants';
import { customersService } from '@/services/customers.service';
import { CreateCustomerDto, CreateDeviceDto } from '@/types';

/**
 * Hook to look up a customer profile by telephone number.
 */
export function useCustomerByPhone(phone?: string) {
  return useQuery({
    queryKey: queryKeys.customers.byPhone(phone || ''),
    queryFn: () => customersService.getCustomerByPhone(phone as string),
    enabled: !!phone && phone.trim().length >= 9,
    retry: false,
  });
}

/**
 * Hook to register a new customer profile.
 */
export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateCustomerDto) => customersService.createCustomer(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
    },
  });
}

/**
 * Hook to register an equipment device under a customer.
 */
export function useCreateDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateDeviceDto) => customersService.createDevice(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all });
    },
  });
}
