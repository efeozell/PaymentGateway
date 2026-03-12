export enum PaymentProvider {
  STRIPE = 'STRIPE',
  IYZICO = 'IYZICO',
}

export enum Currency {
  TRY = 'TRY',
  USD = 'USD',
  EUR = 'EUR',
}

export const CURRENCY_DECIMALS: Record<Currency, number> = {
  [Currency.TRY]: 2,
  [Currency.USD]: 2,
  [Currency.EUR]: 2,
};

export function toMinorUnits(amount: number, currency: Currency): number {
  const decimals = CURRENCY_DECIMALS[currency];

  if (decimals === undefined) {
    throw new Error(`Desteklenmeyen para birimi: ${currency}`);
  }

  const multiplier = Math.pow(10, decimals);

  return Math.round(amount * multiplier);
}

export function formatAmountForProvider(
  amount: number,
  currency: Currency,
): string {
  const decimals = CURRENCY_DECIMALS[currency];

  if (decimals === undefined) {
    throw new Error(`Desteklenmeyen para birimi: ${currency}`);
  }

  if (amount < 0) {
    throw new Error(`Amount negatif olamaz: ${amount}`);
  }

  return amount.toFixed(decimals);
}
