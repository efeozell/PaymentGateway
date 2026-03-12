export * from './lib/shared.module';

export {
  VALID_TRANSITIONS,
  PaymentStatus,
} from './constants/payment-status.enum';

export {
  PaymentProvider,
  Currency,
  CURRENCY_DECIMALS,
  toMinorUnits,
  formatAmountForProvider,
} from './constants/provider.enum';

export {
  OutboxEventType,
  KAFKA_TOPICS,
  RABBITMQ_CONFIG,
} from './constants/event-types.enum';

export { ErrorCodes, type ErrorCode } from './constants/error-codes';

export { CreatePaymentDto } from './dto/payments/create-payment.dto';

export { PaymentResponseDto } from './dto/payments/payment-response.dto';

export {
  PaymentGatewayException,
  IdempotencyConflictException,
  InvalidStateTransitionException,
  ProviderApiException,
  ProviderDeclinedException,
  TransactionNotFoundException,
  ProviderUnavailableException,
  WebhookSignatureInvalidException,
} from './exceptions/payment-gateway.exception';
