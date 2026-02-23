import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { timestamp } from 'rxjs';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Liveness check' })
  check() {
    return {
      status: 'ok',
      service: 'payment-service health check',
      timestamp: new Date().toISOString(),
    };
  }

  //TODO: RabbitMQ check yapilacak
}
