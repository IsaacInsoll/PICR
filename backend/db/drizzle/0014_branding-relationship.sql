ALTER TABLE "Brandings" ADD COLUMN "name" varchar(255);--> statement-breakpoint
ALTER TABLE "Folders" ADD COLUMN "brandingId" integer;--> statement-breakpoint
ALTER TABLE "Folders" ADD CONSTRAINT "Folders_brandingId_Brandings_id_fk" FOREIGN KEY ("brandingId") REFERENCES "public"."Brandings"("id") ON DELETE no action ON UPDATE no action;