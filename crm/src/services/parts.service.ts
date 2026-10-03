import { api } from '@/lib/axios';
import {
  CreatePartDto,
  PaginatedData,
  Part,
  PartQueryParams,
  UpdatePartDto,
} from '@/types';

/**
 * Inventory & Spare Parts Service.
 * Encapsulates parts catalog, low-stock threshold queries, and part stock updates.
 */
export const partsService = {
  /**
   * Retrieves a paginated list of catalog parts with optional search/filter.
   */
  async getParts(params?: PartQueryParams): Promise<PaginatedData<Part>> {
    return api.get<PaginatedData<Part>>(
      '/parts',
      params as unknown as Record<string, unknown>,
    );
  },

  /**
   * Retrieves a list of parts that are at or below minimum safety stock levels.
   */
  async getLowStockParts(): Promise<Part[]> {
    return api.get<Part[]>('/parts/low-stock');
  },

  /**
   * Creates a new spare part SKU in the inventory catalog.
   */
  async createPart(dto: CreatePartDto): Promise<Part> {
    return api.post<Part, CreatePartDto>('/parts', dto);
  },

  /**
   * Updates an existing spare part's pricing or stock quantities.
   */
  async updatePart(id: number, dto: UpdatePartDto): Promise<Part> {
    return api.patch<Part, UpdatePartDto>(`/parts/${id}`, dto);
  },

  /**
   * Deletes a spare part SKU from inventory if not referenced by any invoice.
   */
  async deletePart(id: number): Promise<{ success: boolean; message: string }> {
    return api.delete<{ success: boolean; message: string }>(`/parts/${id}`);
  },
};
