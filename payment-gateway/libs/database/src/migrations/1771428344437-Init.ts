import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1771428344437 implements MigrationInterface {
    name = 'Init1771428344437'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "outbox_event" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "aggregate_type" character varying(50) NOT NULL, "aggregate_id" character varying(50) NOT NULL, "event_type" character varying(100) NOT NULL, "payload" jsonb NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_cc0c9e40998e45ecfc5e313429d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "payment_transaction" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "idempotency_key_id" uuid, "amount" numeric(19,4) NOT NULL, "currency" character varying(3) NOT NULL, "status" character varying(30) NOT NULL DEFAULT 'CREATED', "provider" character varying(50) NOT NULL, "provider_transaction_id" character varying(255), "provider_raw_response" jsonb, "token_id" character varying(255), "three_ds_redirect_url" text, "three_ds_callback_token" character varying(255), "next_reconcile_at" TIMESTAMP, "max_retries" integer NOT NULL DEFAULT '4', "description" character varying(255), "external_reference_id" character varying(100), "original_provider" character varying(50), "fallback_provider" character varying(50), "fallback_reason" character varying(100), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_82c3470854cf4642dfb0d7150cd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_payment_status" ON "payment_transaction" ("status") `);
        await queryRunner.query(`CREATE INDEX "idx_next_reconcile" ON "payment_transaction" ("next_reconcile_at") `);
        await queryRunner.query(`CREATE TABLE "idempotency_keys" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "key_value" character varying(255) NOT NULL, "user_id" uuid NOT NULL, "params_hash" character varying(64) NOT NULL, "response_payload" jsonb, "status" character varying(20) NOT NULL DEFAULT 'STARTED', "locked_until" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "uq_user_key" UNIQUE ("user_id", "key_value"), CONSTRAINT "PK_8ad20779ad0411107a56e53d0f6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_idemp_user" ON "idempotency_keys" ("user_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."idx_idemp_user"`);
        await queryRunner.query(`DROP TABLE "idempotency_keys"`);
        await queryRunner.query(`DROP INDEX "public"."idx_next_reconcile"`);
        await queryRunner.query(`DROP INDEX "public"."idx_payment_status"`);
        await queryRunner.query(`DROP TABLE "payment_transaction"`);
        await queryRunner.query(`DROP TABLE "outbox_event"`);
    }

}
