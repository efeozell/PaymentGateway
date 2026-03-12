import { Currency, PaymentProvider } from '@payment-gateway/shared';

//Request Sorumlulugu Interface'i
export interface ChargeRequest {
  amount: number;
  currency: Currency;
  tokenId: string;
  transactionId: string;
  description?: string;
}

//Response Sorumlulugu Interface'i
export interface ChargeResponse {
  success: boolean;
  providerTransactionId: string | null;
  threeDsRedirectUrl?: string | null;
  threeDsCallbackToken?: string | null;
  declineReason?: string;
  rawResponse: Record<string, unknown>;
}

export interface StatusCheckResponse {
  status: 'COMPLETED' | 'FAILED' | 'PENDING';

  providerTransactionId: string | null;

  rawResponse: Record<string, unknown>;
}

export interface RefundResponse {
  success: boolean;
  providerRefundId: string | null;
  rawResponse: Record<string, unknown>;
}

export interface WebhookEventParsed {
  providerTransactionId: string;

  eventType:
    | 'PAYMENT_COMPLETED'
    | 'PAYMENT_FAILED'
    | 'REFUND_COMPLETED'
    | 'REFUND_FAILED'
    | 'UNKNOWN';

  rawEvent: Record<string, unknown>;
}

//Bu interface'i bir class'a implements ettigimiz'de bu metodlari implemente etmek zorunda kalicak bu neden butun saglayici adaptorlerim
//tek bir sozlesme tipinde olucak yani benim projem iyzico'nun suymus stripe'in buymus bunlardan haberi olmayacak.
export interface IPaymentProvider {
  readonly providerName: PaymentProvider;
  charge(request: ChargeRequest): Promise<ChargeResponse>;
  checkStatus(providerTransactionId: string): Promise<StatusCheckResponse>;
  refund(
    providerTransactionId: string,
    amount: number,
    currency: Currency,
    ip?: string,
  ): Promise<RefundResponse>;
  verifyWebhookSignature(
    payload: string | Buffer,
    signature: string,
  ): Promise<boolean>;

  parseWebhookPayload(payload: string | Buffer): WebhookEventParsed;
}
