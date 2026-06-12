import type { SupabaseClient } from "@supabase/supabase-js";

import { notFound } from "../lib/http-errors.js";
import type { UpdateProfileInput } from "../services/profile.service.js";
import { ProfileService } from "../services/profile.service.js";

export class ProfileController {
  private readonly service: ProfileService;

  constructor(supabase: SupabaseClient, userId: string) {
    this.service = new ProfileService(supabase, userId);
  }

  async get() {
    return {
      profile: await this.service.getProfile(),
    };
  }

  async update(input: UpdateProfileInput) {
    const profile = await this.service.updateProfile(input);

    if (!profile) {
      throw notFound("Profile not found.");
    }

    return { profile };
  }
}
