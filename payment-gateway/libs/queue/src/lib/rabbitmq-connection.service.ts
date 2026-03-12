import { Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { RABBITMQ_CONFIG } from '@payment-gateway/shared';

export class RabbitMQConnectionServic implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQConnectionServic.name);
  private connection: amqp.ChannelModel | null = null;
  private channel: amqp.Channel | null = null;
  private readonly url: string;
  private isReconnecting = false;
  private reconnectAttempt = 0;
  private readonly MAX_RECONNECT_DELAY = 3000;
  constructor(private readonly configService: ConfigService) {
    this.url = this.configService.get<string>(
      'RABBITMQ_URL',
      'amqp://localhost:5672',
    );
  }

  async onModuleInit() {
    await this.connect();
    await this.setupTopology();
  }

  async onModuleDestroy(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.logger.log('RabbitMQ channel kapatildi');
      }
      if (this.connection) {
        await this.connection.close();
      }
    } catch (error) {
      this.logger.warn(
        `RabbitMQ Kapatilirken hata: ${error instanceof Error ? error.message : 'Bilinmeyen'}`,
      );
    }
  }

  getChannel(): amqp.Channel {
    if (!this.channel) throw new Error('RabbitMQ channel mevcut degil');
    return this.channel;
  }

  isConnected(): boolean {
    return this.connection !== null && this.channel !== null;
  }

  private async connect(): Promise<void> {
    try {
      this.logger.log('RabbitMQ baglantisi kuruluyor...');
      this.connection = await amqp.connect(this.url, { heartbeat: 60 });

      this.connection.on('error', (err) => {
        this.logger.error(`RabbitMQ baglanti hatasi: ${err.message}`);
        this.handleDisconnect();
      });

      this.connection.on('close', () => {
        this.logger.warn('RabbitMQ baglantisi kapandi');
        this.handleDisconnect();
      });

      this.channel = await this.connection.createChannel();
      await this.channel.prefetch(10, false);

      this.reconnectAttempt = 0;
      this.logger.log('RabbitMQ baglantisi basarilir OK');
    } catch (error) {
      this.logger.error(
        `RabbitMQ baglantisi basarisiz: ${error instanceof Error ? error.message : 'Bilinmeyen'}`,
      );
      this.handleDisconnect();
    }
  }

  private async setupTopology(): Promise<void> {
    if (!this.channel) return;
    this.logger.log('RabbitMQ topology olusturuluyor...');

    //SANTRALLER -> Exchangeler
    await this.channel.assertExchange(
      RABBITMQ_CONFIG.PAYMENT_EXCHANGE,
      'direct',
      { durable: true },
    );

    await this.channel.assertExchange(RABBITMQ_CONFIG.DLX_EXCHANGE, 'direct', {
      durable: true,
    });
    await this.channel.assertExchange(
      RABBITMQ_CONFIG.RETRY_EXCHANGE,
      'direct',
      { durable: true },
    );

    //POSTA KUTULARI -> QUEUES
    await this.channel.assertQueue(RABBITMQ_CONFIG.PAYMENT_QUEUE, {
      durable: true,
      deadLetterExchange: RABBITMQ_CONFIG.DLX_EXCHANGE,
      deadLetterRoutingKey: 'payment.dead',
    });

    await this.channel.assertQueue(RABBITMQ_CONFIG.DLQ_QUEUE, {
      durable: true,
    });

    await this.channel.assertQueue(RABBITMQ_CONFIG.RETRY_QUEUE, {
      durable: true,
      messageTtl: 30000,
      deadLetterExchange: RABBITMQ_CONFIG.PAYMENT_EXCHANGE,
      deadLetterRoutingKey: RABBITMQ_CONFIG.ROUTING_KEYS.PAYMENT_PROCESS,
    });

    //POSTA KUTULARINI SANTRALE BAGLA -> Exchange to Queue Binding
    await this.channel.bindQueue(
      RABBITMQ_CONFIG.PAYMENT_QUEUE,
      RABBITMQ_CONFIG.PAYMENT_EXCHANGE,
      RABBITMQ_CONFIG.ROUTING_KEYS.PAYMENT_PROCESS,
    );
    await this.channel.bindQueue(
      RABBITMQ_CONFIG.RETRY_QUEUE,
      RABBITMQ_CONFIG.DLX_EXCHANGE,
      'payment.dead',
    );

    await this.channel.bindQueue(
      RABBITMQ_CONFIG.DLQ_QUEUE,
      RABBITMQ_CONFIG.DLX_EXCHANGE,
      'payment.dlq',
    );

    this.logger.log('RabbitMQ topology olusturuldu');
  }

  private handleDisconnect(): void {
    if (this.isReconnecting) return;
    this.isReconnecting = true;
    this.connection = null;
    this.channel = null;

    const delay = Math.min(
      Math.pow(2, this.reconnectAttempt) * 1000,
      this.MAX_RECONNECT_DELAY,
    );
    this.reconnectAttempt++;
    this.logger.warn(
      `RabbitMQ reconnect: ${this.reconnectAttempt}. deneme: ${delay}ms sonra`,
    );

    setTimeout(async () => {
      this.isReconnecting = false;
      try {
        await this.connect();
        await this.setupTopology();
      } catch (error) {
        /*
         */
      }
    }, delay);
  }
}
