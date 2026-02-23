export enum PaymentStatus {
  //istek dogrulandi, db kaydedildi, queue'ya atildi
  CREATED = 'CREATED',

  //worker mesaji aldi, bankaya istek atiyor
  PROCESSING = 'PROCESSING',

  //3D Secire veya ek dogrulama bekleniyor.
  REQUIRES_ACTION = 'REQUIRES_ACTION',

  //odeme tamamlandi
  COMPLETED = 'COMPLETED',

  //odeme basarisiz
  FAILED = 'FAILED',

  //Reconcilitaion zaman asimi
  EXPIRED = 'EXPIRED',

  //iade talebi saglayiciya iletildi
  REFUND_PENDING = 'REFUND_PENDING',

  //iade basarilir
  REFUNDED = 'REFUNDED',

  //iade basarisiz
  REFUND_FAILED = 'REFUND_FAILED',
}

export const VALID_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  [PaymentStatus.CREATED]: [PaymentStatus.PROCESSING, PaymentStatus.FAILED],

  [PaymentStatus.PROCESSING]: [
    PaymentStatus.COMPLETED,
    PaymentStatus.FAILED,
    PaymentStatus.REQUIRES_ACTION,
  ],

  [PaymentStatus.REQUIRES_ACTION]: [
    PaymentStatus.COMPLETED,
    PaymentStatus.FAILED,
    PaymentStatus.EXPIRED,
  ],

  [PaymentStatus.COMPLETED]: [PaymentStatus.REFUND_PENDING],

  [PaymentStatus.FAILED]: [],
  [PaymentStatus.EXPIRED]: [],

  [PaymentStatus.REFUND_PENDING]: [
    PaymentStatus.REFUNDED,
    PaymentStatus.REFUND_FAILED,
  ],

  [PaymentStatus.REFUNDED]: [],

  [PaymentStatus.REFUND_FAILED]: [PaymentStatus.REFUND_PENDING],
};
