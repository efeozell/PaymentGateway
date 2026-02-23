import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity('idempotency_keys')
@Unique('uq_user_key', ['userId', 'keyValue'])
export class IdempotencyKey {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, name: 'key_value' })
  keyValue!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  @Index('idx_idemp_user')
  userId!: string;

  @Column({ type: 'varchar', length: 64, name: 'params_hash' })
  paramsHash!: string;

  @Column({ type: 'jsonb', name: 'response_payload', nullable: true })
  responsePayload!: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 20, default: 'STARTED' })
  status!: string;

  @Column({ type: 'timestamp', name: 'locked_until', nullable: true })
  lockedUntil!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
