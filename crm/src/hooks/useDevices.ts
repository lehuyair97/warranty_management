import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/common/constants';
import { devicesService } from '@/services/devices.service';
import { BasePaginationParams, CreateDeviceDto, UpdateDeviceDto } from '@/types';

/**
 * Hook to retrieve a paginated list of devices.
 */
export function useDevices(params?: BasePaginationParams) {
  return useQuery({
    queryKey: queryKeys.devices.list(params),
    queryFn: () => devicesService.getDevices(params),
  });
}

/**
 * Hook to retrieve device details by ID.
 */
export function useDeviceDetail(id?: number) {
  return useQuery({
    queryKey: queryKeys.devices.detail(id as number),
    queryFn: () => devicesService.getDeviceById(id as number),
    enabled: typeof id === 'number' && !isNaN(id),
  });
}

/**
 * Hook to look up a device by its serial number or IMEI.
 */
export function useDeviceBySerial(serial?: string) {
  return useQuery({
    queryKey: queryKeys.devices.bySerial(serial || ''),
    queryFn: () => devicesService.getDeviceBySerial(serial as string),
    enabled: !!serial && serial.trim().length > 0,
    retry: false,
  });
}

/**
 * Hook to check warranty status for a device.
 */
export function useDeviceWarranty(id?: number) {
  return useQuery({
    queryKey: queryKeys.devices.warranty(id as number),
    queryFn: () => devicesService.checkWarranty(id as number),
    enabled: typeof id === 'number' && !isNaN(id),
  });
}

/**
 * Hook to retrieve historical repair records for a device.
 */
export function useDeviceRepairHistory(id?: number) {
  return useQuery({
    queryKey: queryKeys.devices.history(id as number),
    queryFn: () => devicesService.getRepairHistory(id as number),
    enabled: typeof id === 'number' && !isNaN(id),
  });
}

/**
 * Hook to register an equipment device under a customer.
 */
export function useCreateDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateDeviceDto) => devicesService.createDevice(dto),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.devices.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.customers.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.reports.all }),
      ]);
    },
  });
}

/**
 * Hook to update an existing device record.
 * Invalidates device details, list, customer profile, tickets, and actively refetches device detail.
 */
export function useUpdateDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: { id: number } & UpdateDeviceDto) =>
      devicesService.updateDevice(id, dto),
    onSuccess: async (_data, variables) => {
      const deviceId = variables?.id;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.devices.all }),
        deviceId
          ? queryClient.invalidateQueries({ queryKey: queryKeys.devices.detail(deviceId) })
          : Promise.resolve(),
        deviceId
          ? queryClient.refetchQueries({ queryKey: queryKeys.devices.detail(deviceId) })
          : Promise.resolve(),
        queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.customers.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.reports.all }),
      ]);
    },
  });
}
