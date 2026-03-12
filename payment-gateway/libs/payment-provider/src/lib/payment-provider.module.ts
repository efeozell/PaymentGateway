import { Module } from '@nestjs/common';
import { StripeAdapter } from '../adapters/stripe.adapter';
import { IyzicoAdapter } from '../adapters/iyzico.adapter';
import { ProviderFactory } from '../factory/provider.factory';

@Module({
  controllers: [],
  providers: [StripeAdapter, IyzicoAdapter, ProviderFactory],
  exports: [ProviderFactory],
})
export class PaymentProviderModule {}
