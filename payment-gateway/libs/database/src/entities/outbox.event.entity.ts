import {
  Entity,
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class OutboxEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50, name: 'aggregate_type' })
  aggregateType!: string;

  @Column({ type: 'varchar', length: 50, name: 'aggregate_id' })
  aggregateId!: string;

  @Column({ type: 'varchar', length: 100, name: 'event_type' })
  eventType!: string;

  @Column({ type: 'jsonb' })
  payload!: Record<string, unknown>;

  @Column({ type: 'timestamp', name: 'processed_at', nullable: true })
  processedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
