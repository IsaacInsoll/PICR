CREATE TABLE "UserDevice" (
	"id" serial PRIMARY KEY NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"userId" integer,
	"name" varchar(255),
	"notificationToken" varchar(255),
	"enabled" boolean NOT NULL
);
--> statement-breakpoint
ALTER TABLE "UserDevice" ADD CONSTRAINT "UserDevice_userId_Users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."Users"("id") ON DELETE no action ON UPDATE no action;