import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { PaymentGatewayException } from '@payment-gateway/shared';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    let statusCode: number,
      errorCode: string,
      message: string,
      details: Record<string, unknown> | string[] | object = {};

    if (exception instanceof PaymentGatewayException) {
      statusCode = exception.getStatus();
      errorCode = exception.errorCode;
      message = exception.message;
      details = exception.details || {};
    } else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseBody = exceptionResponse as any;

        if (Array.isArray(responseBody.message)) {
          statusCode = HttpStatus.BAD_REQUEST;
          errorCode = 'SYS_VALIDATION_ERROR';
          message = 'Girdi verileri dogrulanamadi';
          details = { errors: responseBody.message };
        } else {
          errorCode = (responseBody.error as string) || 'SYS_HTTP_ERROR';
          message = (responseBody.message as string) || 'HTTP Error';
        }
      } else {
        errorCode = 'SYS_HTTP_ERROR';
        message =
          typeof exceptionResponse === 'string'
            ? exceptionResponse
            : String((exceptionResponse as any).message || 'HTTP Error');
      }
    } else {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      errorCode = 'SYS_INTERNAL_ERROR';
      message =
        'Beklenmeyen bir sunucu hatasi olustu. Lutfen sonra tekrar deneyin';
      this.logger.error(
        exception instanceof Error ? exception.message : 'Unknown',
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    const logMessage = `[${request.method} ${request.url}] -> [${statusCode} ${errorCode}]`;

    if (statusCode >= 500) this.logger.error(logMessage);
    else this.logger.warn(logMessage);

    response.status(statusCode).json({
      statusCode,
      errorCode,
      message,
      details,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
    });
  }
}
