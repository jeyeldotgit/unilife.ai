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
    avatar_url
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    display_name = COALESCE(EXCLUDED.display_name, public.users.display_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
    updated_at = NOW();

  RETURN NEW;
END;
$$;
--> statement-breakpoint
INSERT INTO public.users (
  id,
  email,
  display_name,
  avatar_url
)
SELECT
  auth_user.id,
  auth_user.email,
  auth_user.raw_user_meta_data->>'display_name',
  auth_user.raw_user_meta_data->>'avatar_url'
FROM auth.users AS auth_user
ON CONFLICT (id) DO UPDATE
SET
  email = EXCLUDED.email,
  display_name = COALESCE(EXCLUDED.display_name, public.users.display_name),
  avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
  updated_at = NOW();
--> statement-breakpoint
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
--> statement-breakpoint
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();
