import { requestBackendClient } from "@/lib/api/client-browser";
import {
  normalizeProfile,
  type ProfileResponse,
  type UpdateProfileInput,
} from "@/lib/api/profile-shared";

export type { UpdateProfileInput } from "@/lib/api/profile-shared";

export async function getProfileClient() {
  const response = await requestBackendClient<ProfileResponse>("/api/profile");

  return normalizeProfile(response.profile);
}

export async function updateProfile(input: UpdateProfileInput) {
  const response = await requestBackendClient<ProfileResponse>("/api/profile", {
    method: "PATCH",
    body: input,
  });

  return normalizeProfile(response.profile);
}
