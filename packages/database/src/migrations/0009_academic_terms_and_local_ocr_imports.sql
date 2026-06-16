CREATE TABLE "academic_terms" (
  "id" uuid PRIMARY KEY NOT NULL,
  "user_id" uuid NOT NULL,
  "name" text NOT NULL,
  "status" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "archived_at" timestamp with time zone,
  "deleted_at" timestamp with time zone
);

ALTER TABLE "academic_terms"
ADD CONSTRAINT "academic_terms_user_id_users_id_fk"
FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX "academic_terms_user_status_idx"
ON "academic_terms" USING btree ("user_id", "status");

CREATE INDEX "academic_terms_user_updated_at_idx"
ON "academic_terms" USING btree ("user_id", "updated_at");

ALTER TABLE "classes" ADD COLUMN "term_id" uuid;

ALTER TABLE "classes"
ADD CONSTRAINT "classes_term_id_academic_terms_id_fk"
FOREIGN KEY ("term_id") REFERENCES "public"."academic_terms"("id") ON DELETE set null ON UPDATE no action;

CREATE INDEX "classes_user_term_idx"
ON "classes" USING btree ("user_id", "term_id");

ALTER TABLE "schedule_imports" ADD COLUMN "raw_ocr_text_preview" text;
ALTER TABLE "schedule_imports" ADD COLUMN "parser_version" text;
ALTER TABLE "schedule_imports" ADD COLUMN "term_id" uuid;

ALTER TABLE "schedule_imports"
ADD CONSTRAINT "schedule_imports_term_id_academic_terms_id_fk"
FOREIGN KEY ("term_id") REFERENCES "public"."academic_terms"("id") ON DELETE set null ON UPDATE no action;
