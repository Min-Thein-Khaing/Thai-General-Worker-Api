ALTER TABLE "document" ALTER COLUMN "document_type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."document_type";--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('PAYMENT_SLIP_100', 'PAYMENT_SLIP_900', 'PAW_TAW_50', 'BLOOD_TEST_CERTIFICATE', 'PA_KAN_DOCUMENT', 'BINU_MAT_DOCUMENT', 'WORK_PERMIT_DOCUMENT', 'NEW_WORKER_QR_APPOINTMENT');--> statement-breakpoint
ALTER TABLE "document" ALTER COLUMN "document_type" SET DATA TYPE "public"."document_type" USING "document_type"::"public"."document_type";