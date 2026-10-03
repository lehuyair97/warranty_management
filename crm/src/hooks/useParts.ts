import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/common/constants';
import { partsService } from '@/services/parts.service';
import {
  CreatePartDto,
  PartQueryParams,
  UpdatePartDto,
} from '@/types';

/**
 * Hook to retrieve a paginated inventory parts list.
 */
export function useParts(params?: PartQueryParams) {
  return useQuery({
    queryKey: queryKeys.parts.list(params),
    queryFn: () => partsService.getParts(params),
  });
}

/**
 * Hook to retrieve parts below safety stock threshold.
 */
export function useLowStockParts() {
  return useQuery({
    queryKey: queryKeys.parts.lowStock(),
    queryFn: () => partsService.getLowStockParts(),
  });
}

/**
 * Hook to create a new spare part.
 */
export function useCreatePart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreatePartDto) => partsService.createPart(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.parts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
    },
  });
}

/**
 * Hook to update an existing spare part.
 */
export function useUpdatePart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: { id: number } & UpdatePartDto) =>
      partsService.updatePart(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.parts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
    },
  });
}

/**
 * Hook to delete a spare part from catalog.
 */
export function useDeletePart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => partsService.deletePart(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.parts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
    },
  });
}
