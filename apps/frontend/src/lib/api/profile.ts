import { requestBackend } from "@/lib/api/client";
import { normalizeProfile, type ProfileResponse } from "@/lib/api/profile-shared";

export async function getProfile() {
  const response = await requestBackend<ProfileResponse>("/api/profile");

  return normalizeProfile(response.profile);
}
