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
  formatAmountForProvider,
} from '@payment-gateway/shared';
import { WebhookEventParsed } from '../interfaces/payment-provider.interface';
import { ConfigService } from '@nestjs/config';
import Iyzipay = require('iyzipay');

@Injectable()
export class IyzicoAdapter implements IPaymentProvider {
  readonly providerName = PaymentProvider.IYZICO;

  private readonly iyzipay: Iyzipay;
  private readonly logger = new Logger(IyzicoAdapter.name);

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('IYZICO_API_KEY');
    const secretKey = this.configService.get<string>('IYZICO_SECRET_KEY');
    const baseUrl = this.configService.get<string>('IYZICO_BASE_URL');

    if (!apiKey || !secretKey) {
      throw new Error('IYZICO_API_KEY ve IYZICO_SECRET_KEY .env tanimli degil');
    }

    this.iyzipay = new Iyzipay({
      apiKey,
      secretKey,
      uri: baseUrl || 'https://sandbox-api.iyzipay.com',
    });

    this.logger.log('Iyzico Adaptoru baslatildi');
  }

  async charge(request: ChargeRequest): Promise<ChargeResponse> {
    try {
      this.logger.log(
        `Iyzico charger: ${request.amount} ${request.currency} | txn: ${request.transactionId}`,
      );
      //payment req objesi
      const paymentRequest = {
        locale: Iyzipay.LOCALE.TR,
        conversationId: request.transactionId,
        price: formatAmountForProvider(request.amount, request.currency),
        paidPrice: formatAmountForProvider(request.amount, request.currency),
        currency: this.mapCurrency(request.currency),
        installments: 1,
        paymentCard: {
          cardToken: request.tokenId,
          cardUserKey: 'sandbox_user',
        },
        buyer: {
          id: 'BUYER_' + request.transactionId.substring(0, 8),
          name: 'Test',
          surname: 'User',
          email: 'test@phoneix.dev',
          identityNumber: '11111111111',
          registrationAddress: 'Test Mahallesi',
          city: 'Istanbul',
          country: 'Turkey',
          ip: '127.0.0.1',
        },
        shippingAddress: {
          contactName: 'Test User',
          city: 'Istanbul',
          country: 'Turkey',
          address: 'Test Mah.',
        },
        billingAddress: {
          contactName: 'Test User',
          city: 'Istanbul',
          country: 'Turkey',
          address: 'Test Mah.',
        },
        basketItems: [
          {
            id: 'ITEM_' + request.transactionId.substring(0, 8),
            name: request.description || 'Odeme',
            category1: 'Payment',
            itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
            price: formatAmountForProvider(request.amount, request.currency),
          },
        ],
      };

      //Promise ile sarmalanmis iyzico payment create

      const result: Record<string, unknown> = await new Promise(
        (resolve, reject) => {
          this.iyzipay.payment.create(paymentRequest, (err, res) => {
            if (err) reject(err);
            else resolve(res as unknown as Record<string, unknown>);
          });
        },
      );

      return this.mapIyzicoResponse(result);
    } catch (error) {
      this.logger.error(
        `Iyzico charge hatasi: ${error instanceof Error ? error.message : 'Bilinmeyen'}`,
      );

      throw error;
    }
  }

  async checkStatus(
    providerTransactionId: string,
  ): Promise<StatusCheckResponse> {
    try {
      this.logger.log(`Iyzico durum sorgusu: ${providerTransactionId}`);

      const result: Record<string, unknown> = await new Promise(
        (resolve, reject) => {
          this.iyzipay.payment.retrieve(
            {
              locale: Iyzipay.LOCALE.TR,
              conversationId: providerTransactionId,
              paymentId: providerTransactionId,
            },
            (err, res) => {
              if (err) reject(err);
              else resolve(res as unknown as Record<string, unknown>);
            },
          );
        },
      );

      const status = result['status'] as string;
      const paymentStatus = result['paymentStatus'] as string;

      let mappedStatus: 'COMPLETED' | 'FAILED' | 'PENDING';
      if (status === 'success' && paymentStatus === 'SUCCESS') {
        mappedStatus = 'COMPLETED';
      } else if (status === 'failure' || paymentStatus === 'FAILURE') {
        mappedStatus = 'FAILED';
      } else {
        mappedStatus = 'PENDING';
      }

      return {
        status: mappedStatus,
        providerTransactionId: String(
          result['paymentId'] || providerTransactionId,
        ),
        rawResponse: result,
      };
    } catch (error) {
      this.logger.error(
        `Iyzico durum sorgusu basarisiz: ${providerTransactionId}`,
      );

      return {
        status: 'PENDING',
        providerTransactionId,
        rawResponse: { error: error instanceof Error ? error.message : 'Hata' },
      };
    }
  }

  async refund(
    providerTransactionId: string,
    amount: number,
    currency: Currency,
    ip: string,
  ): Promise<RefundResponse> {
    try {
      this.logger.log(
        `Iyzico iade: ${providerTransactionId} | ${amount} ${currency}`,
      );

      const result: Record<string, unknown> = await new Promise(
        (resolve, reject) => {
          this.iyzipay.refund.create(
            {
              locale: Iyzipay.LOCALE.TR,
              conversationId: `refund_${Date.now()}`,
              paymentTransactionId: providerTransactionId,
              price: formatAmountForProvider(amount, currency),
              currency: this.mapCurrency(currency),
              ip: ip,
            },
            (err, res) => {
              if (err) reject(err);
              else resolve(res as unknown as Record<string, unknown>);
            },
          );
        },
      );

      return {
        success: result['status'] === 'success',
        providerRefundId: String(result['paymentId'] || ''),
        rawResponse: result,
      };
    } catch (error) {
      this.logger.error(
        `Iyzico iade hatasi: ${error instanceof Error ? error.message : 'Bilinmeyen'}`,
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
      const body =
        typeof payload === 'string' ? payload : payload.toString('utf-8');

      let parsedBody: Record<string, unknown>;
      try {
        parsedBody = JSON.parse(body);
      } catch (error) {
        this.logger.warn('Iyzico webhook body parse edilemedi');
        return false;
      }

      const paymentId = parsedBody['paymentId'] as string;
      const conversationId = parsedBody['conversationId'] as string | undefined;
      const conversationData = parsedBody['conversationData'] as
        | string
        | undefined;
      const mdStatus = parsedBody['mdStatus'] as string;

      if (!paymentId) {
        this.logger.warn('Iyzico webhook: paymentId bulunamadi');
        return false;
      }

      if (mdStatus !== '1') {
        this.logger.warn(`Iyzico 3DS basarisiz - mdStatus: ${mdStatus}`);
        return false;
      }

      const completeRequest: Iyzipay.ThreeDSPaymentCompleteRequestData = {
        locale: Iyzipay.LOCALE.TR,
        conversationId: conversationId || '',
        paymentId: paymentId,
        conversationData: conversationData,
      };

      const result = await new Promise<Iyzipay.PaymentResult>(
        (resolve, reject) => {
          this.iyzipay.threedsPayment.create(
            completeRequest,
            (err: Error, res: Iyzipay.PaymentResult) => {
              if (err) reject(err);
              else resolve(res);
            },
          );
        },
      );

      const isValid = result.status === 'success';
      if (!isValid) {
        this.logger.warn(
          `Iyzico 3DS tamamlama basarisiz: paymentId=${paymentId}`,
        );
      }

      return isValid;
    } catch (error) {
      this.logger.error(
        `Iyzico webhook dogrulama hatasi: ${error instanceof Error ? error.message : 'Bilinmeyen'}`,
      );
      return false;
    }
  }

  parseWebhookPayload(payload: string | Buffer): WebhookEventParsed {
    const body =
      typeof payload === 'string' ? payload : payload.toString('utf-8');

    let event: Record<string, unknown>;
    try {
      event = JSON.parse(body);
    } catch {
      return {
        providerTransactionId: '',
        eventType: 'UNKNOWN',
        rawEvent: { raw: body.substring(0, 500), error: 'JSON parse hatasi' },
      };
    }

    const paymentId = String(event['paymentId'] || '');
    const status = event['status'] as string | undefined;
    const mdStatus = event['mdStatus'] as string | undefined; //iyziconun 3d secure dogurlama kodudur

    let eventType: WebhookEventParsed['eventType'];

    if (mdStatus === '1' && status === 'success') {
      eventType = 'PAYMENT_COMPLETED';
    } else if (status === 'failure' || (mdStatus && mdStatus !== '1')) {
      eventType = 'PAYMENT_FAILED';
    } else {
      this.logger.debug(
        `Iyzico webhook: belirsiz - status: ${status}, mdStatus: ${mdStatus}`,
      );
      eventType = 'UNKNOWN';
    }

    return { providerTransactionId: paymentId, eventType, rawEvent: event };
  }
  //PRIVATE METHODS
  private mapCurrency(currency: Currency) {
    const currencyMap: Record<string, any> = {
      [Currency.TRY]: Iyzipay.CURRENCY.TRY,
      [Currency.USD]: Iyzipay.CURRENCY.USD,
      [Currency.EUR]: Iyzipay.CURRENCY.EUR,
    };

    return currencyMap[currency as string] || Iyzipay.CURRENCY.TRY;
  }

  private mapIyzicoResponse(result: Record<string, unknown>): ChargeResponse {
    const status = result['status'] as string;
    const paymentStatus = result['paymentStatus'] as string | undefined;

    if (status === 'success' && paymentStatus === 'SUCCESS') {
      return {
        success: true,
        providerTransactionId: String(result['paymentId'] || ''),
        threeDsRedirectUrl: null,
        rawResponse: result,
      };
    }

    if (status === 'failure') {
      return {
        success: false,
        providerTransactionId: null,
        declineReason: String(
          result['errorMessage'] ||
            result['errorCode'] ||
            'Iyzico odeme basarisiz',
        ),
        rawResponse: result,
      };
    }

    const threeDsHtml = result['threeDSHtmlContent'] as string | undefined;

    if (threeDsHtml) {
      return {
        success: false,
        providerTransactionId: String(result['paymentId'] || ''),
        threeDsRedirectUrl: threeDsHtml,
        threeDsCallbackToken: String(result['token'] || ''),
        rawResponse: result,
      };
    }

    return {
      success: false,
      providerTransactionId: null,
      declineReason: `Beklenmeyen Iyzico yaniti: status=${status}`,
      rawResponse: result,
    };
  }
}
