import type { UserProfile } from "@unilife-ai/types";

export type ProfileResponse = {
  profile: UserProfile;
};

export type UpdateProfileInput = {
  avatar_url?: string | null;
  display_name?: string | null;
  timezone?: string | null;
};

export function normalizeProfile(profile: UserProfile): UserProfile {
  return {
    ...profile,
    display_name: profile.display_name ?? null,
    avatar_url: profile.avatar_url ?? null,
    timezone: profile.timezone ?? null,
  };
}
