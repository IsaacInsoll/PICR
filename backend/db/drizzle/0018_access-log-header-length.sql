ALTER TABLE "AccessLogs" ALTER COLUMN "ipAddress" SET DATA TYPE varchar(1024);--> statement-breakpoint
ALTER TABLE "AccessLogs" ALTER COLUMN "sessionId" SET DATA TYPE varchar(1024);--> statement-breakpoint
ALTER TABLE "AccessLogs" ALTER COLUMN "userAgent" SET DATA TYPE varchar(1024);