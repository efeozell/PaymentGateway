import { Module } from '@nestjs/common';
import { PaymentModule } from './modules/payment/payment.module';
import { HealthModule } from './modules/health/health.module';
import { dataSourceOptions } from '@payment-gateway/database';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentProviderModule } from '@payment-gateway/payment-provider';
import { QueueModule } from '@payment-gateway/queue';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.' + (process.env.NODE_ENV || 'development'), '.env'],
    }),
    TypeOrmModule.forRootAsync({
      useFactory: (c: ConfigService) => ({
        type: 'postgres',
        host: c.get<string>('DB_HOST'),
        port: c.get<number>('DB_PORT'),
        username: c.get<string>('DB_USERNAME'),
        password: c.get<string>('DB_PASSWORD'),
        database: c.get<string>('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false,
        logging: true,
        extra: {
          max: 20,
          min: 5,
          idleTimeoutMillis: 30000,
        },
      }),
      inject: [ConfigService],
    }),
    PaymentProviderModule,
    HealthModule,
    PaymentModule,
    QueueModule,
  ],
})
export class AppModule {}
