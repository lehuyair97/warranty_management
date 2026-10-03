import { PaginationMetaDto } from '../dto/paginated-result.dto';

/**
 * Builds standard pagination metadata object.
 * @param totalItems Total number of records matching query
 * @param page Current page number
 * @param limit Items per page
 * @returns PaginationMetaDto
 */
export function buildPaginationMeta(
  totalItems: number,
  page: number,
  limit: number,
): PaginationMetaDto {
  const safePage = Math.max(1, page);
  const safeLimit = Math.max(1, limit);
  const totalPages = Math.ceil(totalItems / safeLimit) || 1;

  return {
    totalItems,
    itemCount: Math.min(safeLimit, Math.max(0, totalItems - (safePage - 1) * safeLimit)),
    itemsPerPage: safeLimit,
    totalPages,
    currentPage: safePage,
    hasNextPage: safePage < totalPages,
    hasPrevPage: safePage > 1,
  };
}
