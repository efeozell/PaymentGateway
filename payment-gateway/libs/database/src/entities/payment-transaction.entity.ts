import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class PaymentTransaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'idempotency_key_id', nullable: true })
  idempotencyKeyId!: string;

  @Column({ type: 'decimal', precision: 19, scale: 4 })
  amount!: string;

  @Column({ type: 'varchar', length: 3 })
  currency!: string;

  @Column({ type: 'varchar', length: 30, default: 'CREATED' })
  @Index('idx_payment_status')
  status!: string;

  @Column({ type: 'varchar', length: 50 })
  provider!: string;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'provider_transaction_id',
    nullable: true,
  })
  providerTransactionId!: string | null;

  @Column({ type: 'jsonb', name: 'provider_raw_response', nullable: true })
  providerRawResponse!: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 255, name: 'token_id', nullable: true })
  tokenId!: string | null;

  @Column({ type: 'text', name: 'three_ds_redirect_url', nullable: true })
  threeDsRedirectUrl!: string | null;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'three_ds_callback_token',
    nullable: true,
  })
  threeDsCallbackToken!: string | null;

  @Column({ type: 'timestamp', name: 'next_reconcile_at', nullable: true })
  @Index('idx_next_reconcile')
  nextReconcileAt!: Date | null;

  @Column({ type: 'int', name: 'max_retries', default: 4 })
  maxRetries!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description!: string | null;

  @Column({
    type: 'varchar',
    length: 100,
    name: 'external_reference_id',
    nullable: true,
  })
  externalReferenceId!: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    name: 'original_provider',
    nullable: true,
  })
  originalProvider!: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    name: 'fallback_provider',
    nullable: true,
  })
  fallbackProvider!: string | null;

  @Column({
    type: 'varchar',
    length: 100,
    name: 'fallback_reason',
    nullable: true,
  })
  fallbackReason!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
