ALTER TABLE "users" ADD COLUMN "quiet_hours_enabled" boolean DEFAULT true NOT NULL;
ALTER TABLE "users" ADD COLUMN "quiet_hours_start" text DEFAULT '22:00' NOT NULL;
ALTER TABLE "users" ADD COLUMN "quiet_hours_end" text DEFAULT '07:00' NOT NULL;

CREATE TABLE "notification_preferences" (
  "id" uuid PRIMARY KEY NOT NULL,
  "user_id" uuid NOT NULL,
  "category" text NOT NULL,
  "enabled" boolean DEFAULT true NOT NULL,
  "urgent_bypass_enabled" boolean DEFAULT false NOT NULL,
  "escalation_limit" smallint DEFAULT 3 NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk"
FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

CREATE UNIQUE INDEX "notification_preferences_user_category_unique"
ON "notification_preferences" USING btree ("user_id", "category");
