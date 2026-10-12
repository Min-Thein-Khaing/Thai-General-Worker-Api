CREATE TYPE "public"."type" AS ENUM('OLD', 'NEW');--> statement-breakpoint
ALTER TABLE "worker" ADD COLUMN "type" "type" DEFAULT 'NEW' NOT NULL;