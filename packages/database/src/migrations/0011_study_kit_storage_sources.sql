ALTER TABLE "study_kits"
ADD COLUMN IF NOT EXISTS "source_path" text;

ALTER TABLE "study_kits"
ADD COLUMN IF NOT EXISTS "source_deleted_at" timestamp with time zone;

INSERT INTO storage.buckets (id, name, public)
VALUES ('study-kit-sources', 'study-kit-sources', false)
ON CONFLICT (id) DO UPDATE
SET public = excluded.public;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users can upload own study kit sources'
  ) THEN
    CREATE POLICY "Users can upload own study kit sources"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'study-kit-sources'
      AND (storage.foldername(name))[1] = 'study-kits'
      AND (storage.foldername(name))[2] = auth.uid()::text
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users can read own study kit sources'
  ) THEN
    CREATE POLICY "Users can read own study kit sources"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'study-kit-sources'
      AND (storage.foldername(name))[1] = 'study-kits'
      AND (storage.foldername(name))[2] = auth.uid()::text
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users can delete own study kit sources'
  ) THEN
    CREATE POLICY "Users can delete own study kit sources"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'study-kit-sources'
      AND (storage.foldername(name))[1] = 'study-kits'
      AND (storage.foldername(name))[2] = auth.uid()::text
    );
  END IF;
END $$;
