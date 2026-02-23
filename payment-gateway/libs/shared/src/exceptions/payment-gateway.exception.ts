import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../constants/error-codes';

export class PaymentGatewayException extends HttpException {
  constructor(
    message: string,
    httpStatus: HttpStatus,
    public readonly errorCode: ErrorCode,
    public readonly details?: Record<string, unknown>,
  ) {
    super(
      {
        statusCode: httpStatus,
        errorCode,
        message,
        details: details || {},
        timestamp: new Date().toISOString(),
      },
      httpStatus,
    );
  }
}

export class IdempotencyConflictException extends PaymentGatewayException {
  constructor(key: string) {
    super(
      `${key} anahtari farkli parametrelerle zaten kullanilmis`,
      HttpStatus.CONFLICT,
      'IDEM_KEY_CONFLICT',
      { idempotencyKey: key },
    );
  }
}

export class InvalidStateTransitionException extends PaymentGatewayException {
  constructor(
    currentStatus: string,
    targetStatus: string,
    transactionId: string,
  ) {
    super(
      `'${currentStatus}' ->  '${targetStatus}' gecisi yapilmaz`,
      HttpStatus.UNPROCESSABLE_ENTITY,
      'PAY_INVALID_STATE_TRANSITIONS',
      { currentStatus, targetStatus, transactionId },
    );
  }
}

export class ProviderApiException extends PaymentGatewayException {
  constructor(provider: string, originalError?: string) {
    super(
      `${provider} saglayicisindan hata alindi`,
      HttpStatus.BAD_GATEWAY,
      'PROV_API_ERROR',
      { provider, originalError },
    );
  }
}

export class ProviderDeclinedException extends PaymentGatewayException {
  constructor(provider: string, declineReason?: string) {
    super(
      `Odeme ${provider} tarafindan reddedildi`,
      HttpStatus.UNPROCESSABLE_ENTITY,
      'PROV_DECLINED',
      { provider, declineReason },
    );
  }
}

export class TransactionNotFoundException extends PaymentGatewayException {
  constructor(transactionId: string) {
    super(
      `Islem bulunamadi: ${transactionId}`,
      HttpStatus.NOT_FOUND,
      'PAY_TRANSACTION_NOT_FOUND',
      { transactionId },
    );
  }
}
