import { ApiProperty } from '@nestjs/swagger';

/**
 * Metadata for pagination results.
 */
export class PaginationMetaDto {
  @ApiProperty({ description: 'Total number of items in entire dataset' })
  totalItems: number;

  @ApiProperty({ description: 'Number of items in current page' })
  itemCount: number;

  @ApiProperty({ description: 'Configured limit per page' })
  itemsPerPage: number;

  @ApiProperty({ description: 'Calculated total pages count' })
  totalPages: number;

  @ApiProperty({ description: 'Current page number' })
  currentPage: number;

  @ApiProperty({ description: 'Flag whether next page exists' })
  hasNextPage: boolean;

  @ApiProperty({ description: 'Flag whether previous page exists' })
  hasPrevPage: boolean;
}

/**
 * Generic Paginated Result wrapper.
 */
export class PaginatedResultDto<T> {
  @ApiProperty({ isArray: true })
  items: T[];

  @ApiProperty({ type: () => PaginationMetaDto })
  meta: PaginationMetaDto;

  constructor(items: T[], meta: PaginationMetaDto) {
    this.items = items;
    this.meta = meta;
  }
}
