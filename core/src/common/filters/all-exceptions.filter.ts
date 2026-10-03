import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';

/**
 * Known T-SQL custom THROW error code mapping to HTTP status.
 */
const MSSQL_ERROR_MAP: Record<number, { status: number; message: string }> = {
  50001: { status: HttpStatus.BAD_REQUEST, message: 'Insufficient spare part inventory stock' },
  50002: { status: HttpStatus.BAD_REQUEST, message: 'Receiving employee must have receptionist role' },
  50003: { status: HttpStatus.BAD_REQUEST, message: 'Assigned repair employee must have technician role' },
  50004: { status: HttpStatus.BAD_REQUEST, message: 'Invalid ticket status transition' },
  50010: { status: HttpStatus.NOT_FOUND, message: 'Device not found' },
  50011: { status: HttpStatus.BAD_REQUEST, message: 'Invalid receptionist employee' },
  50020: { status: HttpStatus.NOT_FOUND, message: 'Ticket not found' },
  50021: { status: HttpStatus.BAD_REQUEST, message: 'Invalid ticket status' },
  50022: { status: HttpStatus.BAD_REQUEST, message: 'Invalid technician employee' },
  50023: { status: HttpStatus.BAD_REQUEST, message: 'A technician must be assigned before advancing status' },
  50030: { status: HttpStatus.NOT_FOUND, message: 'Ticket not found' },
  50031: { status: HttpStatus.BAD_REQUEST, message: 'Labor fee cannot be negative' },
  50032: { status: HttpStatus.CONFLICT, message: 'An unpaid invoice already exists for this ticket' },
  50035: { status: HttpStatus.BAD_REQUEST, message: 'Cannot add, modify, or remove spare parts on an already paid invoice' },
  50036: { status: HttpStatus.BAD_REQUEST, message: 'Financial data of a paid invoice is immutable and cannot be altered or reversed' },
  50040: { status: HttpStatus.NOT_FOUND, message: 'Invoice not found' },
  50041: { status: HttpStatus.BAD_REQUEST, message: 'Cannot add parts to an already paid invoice' },
  50042: { status: HttpStatus.BAD_REQUEST, message: 'Quantity must be greater than zero' },
  50043: { status: HttpStatus.NOT_FOUND, message: 'Spare part not found' },
  50044: { status: HttpStatus.BAD_REQUEST, message: 'Insufficient stock inventory' },
  50050: { status: HttpStatus.NOT_FOUND, message: 'Invoice not found' },
  50051: { status: HttpStatus.CONFLICT, message: 'Invoice is already paid' },
  50052: { status: HttpStatus.BAD_REQUEST, message: 'Checkout only allowed when repair is completed' },
};

/**
 * Global Exception Filter acting as the Backend Error Boundary.
 * Sanitizes all internal exceptions and provides a unified JSON error contract.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error occurred';
    let errorName = 'InternalServerError';

    // 1. Standard NestJS HttpExceptions (400, 401, 403, 404, etc.)
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, unknown>;
        message = (resObj.message as string | string[]) || exception.message;
        errorName = (resObj.error as string) || exception.name;
      } else {
        message = res as string;
        errorName = exception.name;
      }
    } 
    // 2. Database & T-SQL Driver Exceptions
    else if (typeof exception === 'object' && exception !== null) {
      const err = exception as { number?: number; message?: string; code?: string };
      
      // Check for known custom T-SQL error numbers
      if (err.number && MSSQL_ERROR_MAP[err.number]) {
        const mapped = MSSQL_ERROR_MAP[err.number];
        status = mapped.status;
        message = mapped.message;
        errorName = 'DatabaseConstraintError';
      } 
      // Unique constraint violation (MSSQL error 2601 / 2627)
      else if (err.number === 2601 || err.number === 2627) {
        status = HttpStatus.CONFLICT;
        message = 'A record with the specified unique field already exists';
        errorName = 'ConflictError';
      }
      // Foreign key constraint violation (MSSQL error 547)
      else if (err.number === 547) {
        status = HttpStatus.BAD_REQUEST;
        message = 'Invalid reference identifier in related entity';
        errorName = 'ForeignKeyConstraintError';
      } else {
        this.logger.error(`Unhandled Database Exception: ${err.message || JSON.stringify(err)}`);
      }
    } else {
      this.logger.error(`Unknown Server Exception: ${String(exception)}`);
    }

    const payload = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      error: errorName,
    };

    response.status(status).send(payload);
  }
}
