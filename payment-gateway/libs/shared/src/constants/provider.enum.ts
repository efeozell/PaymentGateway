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
