ALTER TABLE "classes" ADD COLUMN "recurrence" jsonb;
ALTER TABLE "assignments" ADD COLUMN "recurrence" jsonb;

CREATE TABLE "recurrence_series" (
  "id" uuid PRIMARY KEY NOT NULL,
  "user_id" uuid NOT NULL,
  "entity_type" text NOT NULL,
  "frequency" text NOT NULL,
  "interval" integer DEFAULT 1 NOT NULL,
  "weekdays" text[] DEFAULT '{}' NOT NULL,
  "timezone" text NOT NULL,
  "starts_at" timestamp with time zone NOT NULL,
  "ends_at" timestamp with time zone,
  "revision" integer DEFAULT 1 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);

CREATE TABLE "recurrence_occurrences" (
  "id" uuid PRIMARY KEY NOT NULL,
  "series_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "entity_type" text NOT NULL,
  "entity_id" uuid NOT NULL,
  "original_start_at" timestamp with time zone NOT NULL,
  "effective_start_at" timestamp with time zone NOT NULL,
  "effective_end_at" timestamp with time zone NOT NULL,
  "source_revision" integer DEFAULT 1 NOT NULL,
  "is_cancelled" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);

CREATE TABLE "recurrence_exceptions" (
  "id" uuid PRIMARY KEY NOT NULL,
  "series_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "entity_type" text NOT NULL,
  "original_start_at" timestamp with time zone NOT NULL,
  "exception_type" text NOT NULL,
  "override_start_at" timestamp with time zone,
  "override_end_at" timestamp with time zone,
  "override_payload" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);

CREATE TABLE "holiday_exclusions" (
  "id" uuid PRIMARY KEY NOT NULL,
  "user_id" uuid NOT NULL,
  "date" text NOT NULL,
  "label" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);

ALTER TABLE "recurrence_series" ADD CONSTRAINT "recurrence_series_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "recurrence_occurrences" ADD CONSTRAINT "recurrence_occurrences_series_id_recurrence_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."recurrence_series"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "recurrence_occurrences" ADD CONSTRAINT "recurrence_occurrences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "recurrence_exceptions" ADD CONSTRAINT "recurrence_exceptions_series_id_recurrence_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."recurrence_series"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "recurrence_exceptions" ADD CONSTRAINT "recurrence_exceptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "holiday_exclusions" ADD CONSTRAINT "holiday_exclusions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
