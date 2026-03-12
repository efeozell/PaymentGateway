import { Injectable, Logger } from '@nestjs/common';
import {
  PaymentProvider,
  ProviderUnavailableException,
} from '@payment-gateway/shared';
import { IPaymentProvider } from '../interfaces';
import { StripeAdapter } from '../adapters/stripe.adapter';
import { IyzicoAdapter } from '../adapters/iyzico.adapter';

@Injectable()
export class ProviderFactory {
  private readonly logger = new Logger(ProviderFactory.name);
  private readonly providers: Map<PaymentProvider, IPaymentProvider>;

  constructor(
    private readonly stripeAdapter: StripeAdapter,
    private readonly iyzicoAdapter: IyzicoAdapter,
  ) {
    this.providers = new Map<PaymentProvider, IPaymentProvider>([
      [PaymentProvider.STRIPE, this.stripeAdapter],
      [PaymentProvider.IYZICO, this.iyzicoAdapter],
    ]);

    this.logger.log(
      `Provider factory baslatildi - ${this.providers.size} saglayici kayitli`,
    );
  }

  getProvider(provider: PaymentProvider): IPaymentProvider {
    const adapter = this.providers.get(provider);
    if (!adapter) {
      throw new ProviderUnavailableException(provider);
    }

    return adapter;
  }

  isProviderSupported(provider: PaymentProvider): boolean {
    return this.providers.has(provider);
  }

  getSupportedProviders(): PaymentProvider[] {
    return Array.from(this.providers.keys());
  }
}
