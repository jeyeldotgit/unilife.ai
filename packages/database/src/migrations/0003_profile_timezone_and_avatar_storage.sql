ALTER TABLE "users" ADD COLUMN "timezone" text;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    display_name,
    avatar_url,
    timezone
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'timezone'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    display_name = COALESCE(EXCLUDED.display_name, public.users.display_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
    timezone = COALESCE(public.users.timezone, EXCLUDED.timezone),
    updated_at = NOW();

  RETURN NEW;
END;
$$;
--> statement-breakpoint
INSERT INTO public.users (
  id,
  email,
  display_name,
  avatar_url,
  timezone
)
SELECT
  auth_user.id,
  auth_user.email,
  auth_user.raw_user_meta_data->>'display_name',
  auth_user.raw_user_meta_data->>'avatar_url',
  auth_user.raw_user_meta_data->>'timezone'
FROM auth.users AS auth_user
ON CONFLICT (id) DO UPDATE
SET
  email = EXCLUDED.email,
  display_name = COALESCE(EXCLUDED.display_name, public.users.display_name),
  avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
  timezone = COALESCE(public.users.timezone, EXCLUDED.timezone),
  updated_at = NOW();
