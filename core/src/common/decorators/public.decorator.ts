import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY } from '../constants';

/**
 * Decorator to mark a route as public (skips JWT authentication).
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
