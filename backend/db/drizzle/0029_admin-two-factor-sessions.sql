CREATE TABLE "AdminSecurity" (
	"userId" integer PRIMARY KEY NOT NULL,
	"secret" text,
	"pendingSecret" text,
	"pendingExpiresAt" timestamp with time zone,
	"enabled" boolean DEFAULT false NOT NULL,
	"lastTimeStep" integer DEFAULT 0 NOT NULL,
	"recoveryHashes" text[] DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "AuthChallenges" (
	"hash" varchar(64) PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"authVersion" integer NOT NULL,
	"purpose" varchar(16) NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "AuthSessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"authVersion" integer NOT NULL,
	"secondFactor" boolean NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"revoked" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "AuthRefreshTokens" (
	"hash" varchar(64) PRIMARY KEY NOT NULL,
	"sessionId" uuid NOT NULL,
	"usedAt" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "ServerOptions" ADD COLUMN "requireAdminMfa" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "Users" ADD COLUMN "authVersion" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "AdminSecurity" ADD CONSTRAINT "AdminSecurity_userId_Users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."Users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "AuthChallenges" ADD CONSTRAINT "AuthChallenges_userId_Users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."Users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "AuthSessions" ADD CONSTRAINT "AuthSessions_userId_Users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."Users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "AuthRefreshTokens" ADD CONSTRAINT "AuthRefreshTokens_sessionId_AuthSessions_id_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."AuthSessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "auth_challenges_user_idx" ON "AuthChallenges" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "auth_challenges_expiry_idx" ON "AuthChallenges" USING btree ("expiresAt");--> statement-breakpoint
CREATE INDEX "auth_sessions_user_idx" ON "AuthSessions" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "auth_sessions_expiry_idx" ON "AuthSessions" USING btree ("expiresAt");--> statement-breakpoint
CREATE INDEX "auth_refresh_session_idx" ON "AuthRefreshTokens" USING btree ("sessionId");--> statement-breakpoint
CREATE INDEX "auth_refresh_used_idx" ON "AuthRefreshTokens" USING btree ("usedAt");