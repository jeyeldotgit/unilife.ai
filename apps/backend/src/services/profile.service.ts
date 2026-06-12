import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserProfile } from "@unilife-ai/types";

import { ProfileRepository } from "../repositories/profile.repository.js";

export type UpdateProfileInput = {
  avatar_url?: string | null;
  display_name?: string | null;
  timezone?: string | null;
};

const SUPPORTED_TIME_ZONES = new Set(Intl.supportedValuesOf("timeZone"));

function normalizeOptionalTrimmedString(value: string | null | undefined) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function isValidTimeZone(value: string | null | undefined) {
  if (value === null || value === undefined) {
    return true;
  }

  return SUPPORTED_TIME_ZONES.has(value);
}

export class ProfileService {
  private readonly repository: ProfileRepository;

  constructor(
    supabase: SupabaseClient,
    private readonly userId: string,
    repository = new ProfileRepository(supabase),
  ) {
    this.repository = repository;
  }

  async getProfile() {
    const profile = await this.repository.findById(this.userId);

    if (profile) {
      return profile;
    }

    return {
      id: this.userId,
      email: "",
      display_name: null,
      avatar_url: null,
      timezone: null,
      created_at: new Date(0).toISOString(),
      updated_at: new Date(0).toISOString(),
    } satisfies UserProfile;
  }

  async updateProfile(input: UpdateProfileInput) {
    const currentProfile = await this.repository.findById(this.userId);

    if (!currentProfile) {
      return null;
    }

    const changes: Partial<UserProfile> = {
      updated_at: new Date().toISOString(),
    };

    if (input.display_name !== undefined) {
      changes.display_name = normalizeOptionalTrimmedString(input.display_name);
    }

    if (input.avatar_url !== undefined) {
      changes.avatar_url = normalizeOptionalTrimmedString(input.avatar_url);
    }

    if (input.timezone !== undefined) {
      changes.timezone = normalizeOptionalTrimmedString(input.timezone);
    }

    return this.repository.updateById(this.userId, changes);
  }
}
