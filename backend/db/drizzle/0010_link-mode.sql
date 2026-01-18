CREATE TYPE "public"."link_mode" AS ENUM('final_delivery', 'proof_no_downloads');--> statement-breakpoint
ALTER TABLE "Users" ADD COLUMN "linkMode" "link_mode";--> statement-breakpoint
UPDATE "Users"
SET "linkMode" = 'final_delivery'
WHERE "userType" = 'Link';
