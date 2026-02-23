/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.use(helmet());
  const globalPrefix = 'api/v1';
  app.setGlobalPrefix(globalPrefix);

  //ValidationPipe istekleri iceriye almadan once denetler
  //  whitelist: true -> + DTO dosyasinda olmayan fazladan verileri otomatik olarak siler
  //  forbidNonWhitelisted: true -> Eger dto'da olmayan fazladan bir veri gelirse bunu silmekle kalmam hata firlatirim
  //  transform: true -> HTTP uzerinden gelen JSON verisini TS' classina yani DTO'ya cevirir
  //  transformOptions: {enableImplicitConversion: true} -> age: number ise gelen '25' metnini arka planda otomatik olarak Number'a cevirir
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Payment Gateway')
      .setVersion('1.0.0')
      .addBearerAuth()
      .addApiKey(
        { type: 'apiKey', name: 'Idempotency-Key', in: 'header' },
        'idempotency-key',
      )
      .build();
    SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));
  }
  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(
    `🚀 Payment Service :${port} | ${process.env.NODE_ENV || 'development'}`,
  );
}

bootstrap().catch((err) => {
  Logger.log(`Payment Service Error: ${err} : ${err.message}`);
});
