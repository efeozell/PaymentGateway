export enum OutboxEventType {
  PAYMENT_COMPLETED = 'payment.completed',
  PAYMENT_FAILED = 'payment.failed',
  PAYMENT_EXPIRED = 'payment.expired',
  PAYMENT_REQUIRES_ACTION = 'payment.requires_action',
}

export const KAFKA_TOPICS = {
  PAYMENT_EVENTS: 'phoenix.payment.events',
  PAYMENT_DLQ: 'phoenix.payment.events.dlq',
} as const;

export const RABBITMQ_CONFIG = {
  //Ana exchange
  PAYMENT_EXCHANGE: 'phoenix.payment.exchange',

  //islenecek odeme kuyrugu
  PAYMENT_QUEUE: 'phoenix.payment.process',

  ROUTING_KEYS: {
    PAYMENT_PROCESS: 'payment.process',
    PAYMENT_RETRY: 'payment.retry',
  },

  //Dead letter queue basarisiz mesajla buraya gelicek
  DLX_EXCHANGE: 'phoenix.payment.dlx',
  DLQ_QUEUE: 'phoenix.payment.dlq',

  RETRY_EXCHANGE: 'phoenix.payment.retry.exchange',
  RETRY_QUEUE: 'phoenix.payment.retry.wait',
} as const;
