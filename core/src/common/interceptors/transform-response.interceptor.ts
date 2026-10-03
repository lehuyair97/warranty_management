import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FastifyReply } from 'fastify';

/**
 * Standard response envelope structure.
 */
export interface StandardResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  meta?: unknown;
  timestamp: string;
}

/**
 * Interceptor ensuring all successful API responses share a consistent envelope.
 */
@Injectable()
export class TransformResponseInterceptor<T>
  implements NestInterceptor<T, StandardResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<StandardResponse<T>> {
    const ctx = context.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();
    const statusCode = reply.statusCode || 200;

    return next.handle().pipe(
      map((resData) => {
        // If the data already contains meta (from PaginatedResultDto), preserve it at root
        if (
          resData &&
          typeof resData === 'object' &&
          'items' in resData &&
          'meta' in resData
        ) {
          return {
            success: true,
            statusCode,
            message: 'Data retrieved successfully',
            data: resData.items,
            meta: resData.meta,
            timestamp: new Date().toISOString(),
          };
        }

        return {
          success: true,
          statusCode,
          message: 'Operation successful',
          data: resData,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
