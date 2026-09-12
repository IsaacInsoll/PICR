ALTER TABLE "Files" ADD COLUMN "capturedAt" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "Files" ADD COLUMN "normalizedName" text;--> statement-breakpoint
ALTER TABLE "Files" ADD COLUMN "normalizedNameSource" varchar(255);--> statement-breakpoint
ALTER TABLE "Files" ADD COLUMN "normalizedRelativePath" text;--> statement-breakpoint
ALTER TABLE "Files" ADD COLUMN "normalizedRelativePathSource" varchar(255);