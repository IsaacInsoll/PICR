ALTER TABLE "Files" ADD COLUMN "imageDecodeAttempt" varchar(64);--> statement-breakpoint
ALTER TABLE "ServerOptions" ADD COLUMN "mediaDecodeState" jsonb;