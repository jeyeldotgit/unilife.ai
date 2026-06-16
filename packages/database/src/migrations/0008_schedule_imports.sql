CREATE TABLE "schedule_imports" (
  "id" uuid PRIMARY KEY NOT NULL,
  "user_id" uuid NOT NULL,
  "source_type" text NOT NULL,
  "source_fingerprint" text NOT NULL,
  "source_name" text NOT NULL,
  "source_path" text,
  "source_deleted_at" timestamp with time zone,
  "extracted_text_deleted_at" timestamp with time zone,
  "timezone" text NOT NULL,
  "proposal" jsonb NOT NULL,
  "ai_proposal" jsonb,
  "approved_entry_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "status" text NOT NULL,
  "error" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "confirmed_at" timestamp with time zone
);

ALTER TABLE "schedule_imports"
ADD CONSTRAINT "schedule_imports_user_id_users_id_fk"
FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

CREATE UNIQUE INDEX "schedule_imports_user_source_fingerprint_unique"
ON "schedule_imports" USING btree ("user_id", "source_fingerprint");

CREATE INDEX "schedule_imports_user_updated_at_idx"
ON "schedule_imports" USING btree ("user_id", "updated_at");
