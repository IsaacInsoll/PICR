CREATE INDEX "Files_folderId_exists_idx" ON "Files" USING btree ("folderId","exists");--> statement-breakpoint
CREATE INDEX "Files_relativePath_name_idx" ON "Files" USING btree ("relativePath","name");--> statement-breakpoint
CREATE INDEX "Folders_parentId_exists_idx" ON "Folders" USING btree ("parentId","exists");--> statement-breakpoint
CREATE INDEX "Folders_relativePath_idx" ON "Folders" USING btree ("relativePath");