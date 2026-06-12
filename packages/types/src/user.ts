export type UserProfile = {
  id: string; // UUID
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  timezone: string | null;
  created_at: string; // ISO 8601 date string
  updated_at: string;
};

export type AppUser = UserProfile;
