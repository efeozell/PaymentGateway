import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1772626171133 implements MigrationInterface {
    name = 'Init1772626171133'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "webhook_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "provider" character varying(50) NOT NULL, "event_type" character varying(100) NOT NULL, "provider_event_id" character varying(255), "payload" jsonb NOT NULL, "processed" boolean NOT NULL DEFAULT false, "processed_at" TIMESTAMP, "error_message" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "uq_provider_event" UNIQUE ("provider", "provider_event_id"), CONSTRAINT "PK_4cba37e6a0acb5e1fc49c34ebfd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_webhook_unprocessed" ON "webhook_events" ("processed") `);
        await queryRunner.query(`ALTER TABLE "outbox_event" ADD "processed_at" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "outbox_event" DROP COLUMN "processed_at"`);
        await queryRunner.query(`DROP INDEX "public"."idx_webhook_unprocessed"`);
        await queryRunner.query(`DROP TABLE "webhook_events"`);
    }

}
