CREATE TYPE "public"."link_publication" AS ENUM('coming_soon', 'published');--> statement-breakpoint
ALTER TABLE "Users" ADD COLUMN "publicationState" "link_publication";--> statement-breakpoint
ALTER TABLE "Users" ADD COLUMN "estimatedDeliveryAt" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "Users" ADD COLUMN "comingSoonMessage" text;--> statement-breakpoint
UPDATE "Users" SET "publicationState" = 'published' WHERE "userType" = 'Link';
