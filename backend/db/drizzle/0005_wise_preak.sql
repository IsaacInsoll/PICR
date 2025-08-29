ALTER TABLE "Files" ADD COLUMN "existsRescan" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "Folders" ADD COLUMN "existsRescan" boolean DEFAULT false NOT NULL;