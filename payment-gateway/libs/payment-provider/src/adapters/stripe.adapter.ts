import { Injectable, Logger } from '@nestjs/common';
import {
  ChargeRequest,
  ChargeResponse,
  IPaymentProvider,
  RefundResponse,
  StatusCheckResponse,
} from '../interfaces';
import {
  PaymentProvider,
  Currency,
  toMinorUnits,
} from '@payment-gateway/shared';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { WebhookEventParsed } from '../interfaces/payment-provider.interface';

@Injectable()
export class StripeAdapter implements IPaymentProvider {
  readonly providerName = PaymentProvider.STRIPE;
  private readonly stripe: Stripe;
  private readonly webhookSecret: string;
  private readonly logger = new Logger(StripeAdapter.name);

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');

    if (!secretKey) {
      throw new Error(
        'STRIPE_SECRET_KEY env tanimli degil lutfen tanimlamasini yapiniz',
      );
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2026-01-28' as Stripe.LatestApiVersion,
      maxNetworkRetries: 2,
      timeout: 3000,
    });

    this.webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET_KEY',
      '',
    );

    this.logger.log('✅ Stripe adaptoru baslatildi');
  }

  async charge(request: ChargeRequest): Promise<ChargeResponse> {
    try {
      this.logger.log(
        `Stripe odeme baslatiliyor: ${request.transactionId} | ` +
          `${request.amount} ${request.currency}`,
      );

      const amountInMinorUnits = toMinorUnits(request.amount, request.currency);

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amountInMinorUnits,

        currency: request.currency.toLowerCase(),

        payment_method: request.tokenId,

        confirm: true,

        metadata: {
          phoenix_transaction_id: request.transactionId,
          ...(request.description && {
            description: request.description,
          }),
        },

        return_url: this.configService.get<string>(
          'STRIPE_RETURN_URL',
          'http://localhost:3000/api/v1/webhooks/stripe/3ds-return',
        ),

        payment_method_types: ['card'],
      });

      return this.mapPaymentIntentToResponse(paymentIntent);
    } catch (error) {
      return this.handleStriperError(error, request.transactionId);
    }
  }

  async checkStatus(
    providerTransactionId: string,
  ): Promise<StatusCheckResponse> {
    try {
      this.logger.log(`Striper durum sorgusu: ${providerTransactionId}`);

      const paymentIntent = await this.stripe.paymentIntents.retrieve(
        providerTransactionId,
      );

      let status: 'COMPLETED' | 'FAILED' | 'PENDING';

      switch (paymentIntent.status) {
        case 'succeeded':
          status = 'COMPLETED';
          break;
        case 'canceled':
        case 'requires_payment_method':
          status = 'FAILED';
          break;
        default:
          status = 'PENDING';
      }

      return {
        status,
        providerTransactionId: paymentIntent.id,
        rawResponse: paymentIntent as unknown as Record<string, unknown>,
      };
    } catch (error) {
      this.logger.error(
        `Striper durum sorgusu basarisiz: ${providerTransactionId}`,
        error instanceof Error ? error.stack : undefined,
      );

      return {
        status: 'PENDING',
        providerTransactionId,
        rawResponse: {
          error: error instanceof Error ? error.message : 'Bilinmeyen Hata',
        },
      };
    }
  }

  async refund(
    providerTransactionId: string,
    amount: number,
    currency: Currency,
  ): Promise<RefundResponse> {
    try {
      this.logger.log(
        `Striper iade baslatiliyor: ${providerTransactionId} | ${amount} ${currency}`,
      );

      const refund = await this.stripe.refunds.create({
        payment_intent: providerTransactionId,
        amount: toMinorUnits(amount, currency),
      });

      return {
        success: refund.status === 'succeeded',
        providerRefundId: refund.id,
        rawResponse: refund as unknown as Record<string, unknown>,
      };
    } catch (error) {
      this.logger.error(
        `Stripe iade basarisiz: ${providerTransactionId}`,
        error instanceof Error ? error.stack : undefined,
      );

      return {
        success: false,
        providerRefundId: null,
        rawResponse: {
          error: error instanceof Error ? error.message : 'Iade hatasi',
        },
      };
    }
  }

  async verifyWebhookSignature(
    payload: string | Buffer,
    signature: string,
  ): Promise<boolean> {
    try {
      this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.webhookSecret,
      );
      return true;
    } catch (error) {
      this.logger.warn(
        `Stripe webhook imza dogrulamasi basarisiz: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`,
      );
      return false;
    }
  }

  parseWebhookPayload(payload: string | Buffer): WebhookEventParsed {
    const body =
      typeof payload === 'string' ? payload : payload.toString('utf-8');
    const event = JSON.parse(body);

    //data.object → İlgili Stripe kaynağı (PaymentIntent, Charge, Refund)

    const eventType = event.type as string;
    const dataObject = event.data?.object || {};
    const providerTransactionId =
      dataObject.id || dataObject.payment_intent || '';

    let mappedEventType: WebhookEventParsed['eventType'];
    switch (eventType) {
      case 'payment_intent.succeeded':
        mappedEventType = 'PAYMENT_COMPLETED';
        break;
      case 'payment_intent.payment.failed':
        mappedEventType = 'PAYMENT_FAILED';
        break;
      case 'charge.refunded':
        mappedEventType = 'REFUND_COMPLETED';
        break;
      case 'charge.refund.updated':
        mappedEventType =
          dataObject.status === 'failed' ? 'REFUND_FAILED' : 'REFUND_COMPLETED';
        break;

      default:
        this.logger.debug(
          `Bilinmeyen Striper webhook eventi. Striper Adapter 76. Satir Kontrol edin`,
        );
        mappedEventType = 'UNKNOWN';
    }

    return {
      providerTransactionId,
      eventType: mappedEventType,
      rawEvent: event,
    };
  }

  //Private helper methods
  private mapPaymentIntentToResponse(
    paymentIntent: Stripe.PaymentIntent,
  ): ChargeResponse {
    switch (paymentIntent.status) {
      case 'succeeded':
        return {
          success: true,
          providerTransactionId: paymentIntent.id,
          threeDsRedirectUrl: null,
          rawResponse: paymentIntent as unknown as Record<string, unknown>,
        };

      case 'requires_action':
        //3D Secure Senaryosu
        //Burada stripe'in bize verdigi url'i Payment Service'de Client'e donucez Client kullaniciyi bu sayfaya yonlendiricek
        return {
          success: false,
          providerTransactionId: paymentIntent.id,
          threeDsRedirectUrl:
            paymentIntent.next_action?.redirect_to_url?.url || null,
          rawResponse: paymentIntent as unknown as Record<string, unknown>,
        };

      case 'requires_payment_method':
        //Kart red. last_paymeny_error -> Stripe'in verdigi hata bilgisi. declineReason olarak bunu donuyoruz.
        return {
          success: false,
          providerTransactionId: paymentIntent.id,
          declineReason:
            paymentIntent.last_payment_error?.message ||
            'Odeme yontemi reddedildi',
          rawResponse: paymentIntent as unknown as Record<string, unknown>,
        };

      default:
        return {
          success: false,
          providerTransactionId: paymentIntent.id,
          rawResponse: paymentIntent as unknown as Record<string, unknown>,
        };
    }
  }

  private handleStriperError(
    error: unknown,
    transactionId: string,
  ): ChargeResponse {
    if (error instanceof Stripe.errors.StripeCardError) {
      this.logger.warn(
        `Striper kart reddedildi [${transactionId}] : ${error.message}`,
      );

      return {
        success: false,
        providerTransactionId: null,
        declineReason: error.message,
        rawResponse: {
          type: error.type,
          code: error.code,
          decline_code: error.decline_code,
          message: error.message,
        },
      };
    }

    this.logger.error(
      `Stripe beklenmeyen hata [${transactionId}] : ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`,
      error instanceof Error ? error.stack : undefined,
    );

    //Error bubling burada boyle yaparak yukaradaki bu metodu cagiracak olan katmana birakiyoruz orada handle edicek
    throw error;
  }
}
