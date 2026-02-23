import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
} from 'class-validator';
import { Currency, PaymentProvider } from '../../constants/provider.enum';

//client'den gelen odeme isteginin sekli
export class CreatePaymentDto {
  @ApiProperty({ example: 149.99 })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Tutar en fazla 2 ondalik basamak icerebilir' },
  )
  @IsPositive({ message: 'Tutar sifirdan buyuk olmali' })
  @Max(999999.99)
  amount!: number;

  @ApiProperty({ enum: Currency, example: Currency.TRY })
  @IsEnum(Currency, { message: 'Gecersiz para birimi' })
  currency!: Currency;

  @ApiProperty({ enum: PaymentProvider, example: PaymentProvider.STRIPE })
  @IsEnum(PaymentProvider, { message: 'Gecersiz odeme saglayicisi' })
  provider!: PaymentProvider;

  @ApiProperty({ example: 'tok_visa_4242424242' })
  @IsString()
  @IsNotEmpty({ message: 'Token bos olamaz' })
  @MaxLength(500)
  tokenId!: string;

  @ApiPropertyOptional({ example: 'Siparis #12345 odemesi' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiPropertyOptional({ example: 'ORD-2024-00123' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  externalReferenceId?: string;
}
