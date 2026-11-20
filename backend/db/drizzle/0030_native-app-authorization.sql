CREATE TABLE "NativeAuthorizations" (
	"hash" varchar(64) PRIMARY KEY NOT NULL,
	"sessionId" uuid NOT NULL,
	"codeChallenge" varchar(43) NOT NULL,
	"redirectUri" varchar(64) NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "NativeAuthorizations" ADD CONSTRAINT "NativeAuthorizations_sessionId_AuthSessions_id_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."AuthSessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "native_authorization_expiry_idx" ON "NativeAuthorizations" USING btree ("expiresAt");