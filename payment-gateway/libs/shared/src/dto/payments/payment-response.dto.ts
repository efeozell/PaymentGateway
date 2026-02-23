import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Currency, PaymentProvider } from '../../constants/provider.enum';
import { PaymentStatus } from '../../constants/payment-status.enum';

export class PaymentResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ example: 149.99 })
  amount!: number;

  @ApiProperty({ enum: Currency })
  currency!: Currency;

  @ApiProperty({ enum: PaymentStatus })
  status!: PaymentStatus;

  @ApiProperty({ enum: PaymentProvider })
  provider!: PaymentProvider;

  @ApiPropertyOptional()
  providerTransactionId?: string | null;

  @ApiPropertyOptional()
  threeDsRedirectUrl?: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiPropertyOptional()
  updatedAt?: Date;
}
