import { Currency, PaymentProvider } from '@payment-gateway/shared';

export interface ChargeRequest {
  amount: number;
  currency: Currency;
  tokenId: string;
  transactionId: string;
  description?: string;
}

export interface ChargeResponse {
  success: boolean;
  providerTransactionId: string | null;
  threeDsRedirectUrl?: string | null;
  threeDsCallbackToken?: string | null;
  declineReason?: string;
  rawResponse: Record<string, unknown>;
}

export interface StatusCheckResponse {
  status: 'SUCCESS' | 'FAILED' | 'PENDING';

  providerTransactionId: string | null;

  rawResponse: Record<string, unknown>;
}

export interface RefundResponse {
  success: boolean;
  providerRefundId: string | null;
  rawResponse: Record<string, unknown>;
}

export interface IPaymentProvider {
  readonly providerName: PaymentProvider;
  charge(request: ChargeRequest): Promise<ChargeResponse>;
  checkStatus(providerTransactionId: string): Promise<StatusCheckResponse>;
  refund(
    providerTransactionId: string,
    amount: number,
    currency: Currency,
  ): Promise<RefundResponse>;
  verifyWebhookSignature(payload: string | Buffer, signature: string): boolean;
}
