ALTER TABLE "Brandings" ADD COLUMN "availableViews" json;--> statement-breakpoint
ALTER TABLE "Brandings" ADD COLUMN "defaultView" varchar(32);--> statement-breakpoint
ALTER TABLE "Brandings" ADD COLUMN "thumbnailSize" smallint;--> statement-breakpoint
ALTER TABLE "Brandings" ADD COLUMN "thumbnailSpacing" smallint;--> statement-breakpoint
ALTER TABLE "Brandings" ADD COLUMN "thumbnailBorderRadius" smallint;--> statement-breakpoint
ALTER TABLE "Brandings" ADD COLUMN "headingFontSize" smallint;--> statement-breakpoint
ALTER TABLE "Brandings" ADD COLUMN "headingAlignment" varchar(16);--> statement-breakpoint
ALTER TABLE "Brandings" ADD COLUMN "footerTitle" varchar(255);--> statement-breakpoint
ALTER TABLE "Brandings" ADD COLUMN "footerUrl" varchar(255);--> statement-breakpoint
ALTER TABLE "Brandings" ADD COLUMN "socialLinks" json;--> statement-breakpoint
ALTER TABLE "Folders" ADD COLUMN "bannerImageId" integer;--> statement-breakpoint
ALTER TABLE "Folders" ADD CONSTRAINT "Folders_bannerImageId_Files_id_fk" FOREIGN KEY ("bannerImageId") REFERENCES "public"."Files"("id") ON DELETE no action ON UPDATE no action;