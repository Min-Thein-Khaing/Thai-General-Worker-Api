ALTER TABLE "worker" ADD COLUMN "total" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "worker" ADD COLUMN "deposit" integer;--> statement-breakpoint
ALTER TABLE "worker" ADD COLUMN "balance" integer;--> statement-breakpoint
ALTER TABLE "worker" ADD COLUMN "renewal_decision" text DEFAULT 'UNDECIDED' NOT NULL;--> statement-breakpoint
ALTER TABLE "worker" ADD COLUMN "work_permit_visa_date" date;--> statement-breakpoint
ALTER TABLE "worker" ADD COLUMN "report_date" date;--> statement-breakpoint
ALTER TABLE "worker" ADD CONSTRAINT "worker_total_non_negative" CHECK ("worker"."total" >= 0);--> statement-breakpoint
ALTER TABLE "worker" ADD CONSTRAINT "worker_deposit_within_total" CHECK ("worker"."deposit" IS NULL OR ("worker"."deposit" >= 0 AND "worker"."deposit" <= "worker"."total"));--> statement-breakpoint
ALTER TABLE "worker" ADD CONSTRAINT "worker_balance_matches_payment" CHECK ("worker"."balance" IS NULL OR "worker"."balance" = "worker"."total" - coalesce("worker"."deposit", 0));