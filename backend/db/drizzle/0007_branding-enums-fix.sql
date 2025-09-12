ALTER TABLE "public"."Brandings" ALTER COLUMN "primaryColor" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."theme_color";--> statement-breakpoint
CREATE TYPE "public"."theme_color" AS ENUM('blue', 'cyan', 'dark', 'grape', 'gray', 'green', 'indigo', 'lime', 'orange', 'pink', 'red', 'teal', 'violet', 'yellow');--> statement-breakpoint
ALTER TABLE "public"."Brandings" ALTER COLUMN "primaryColor" SET DATA TYPE "public"."theme_color" USING "primaryColor"::"public"."theme_color";--> statement-breakpoint
ALTER TABLE "public"."Brandings" ALTER COLUMN "mode" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."theme_mode";--> statement-breakpoint
CREATE TYPE "public"."theme_mode" AS ENUM('auto', 'light', 'dark');--> statement-breakpoint
ALTER TABLE "public"."Brandings" ALTER COLUMN "mode" SET DATA TYPE "public"."theme_mode" USING "mode"::"public"."theme_mode";