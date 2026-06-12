import { describe, expect, it } from "vitest";

import {
  buildAvatarObjectPath,
  extractAvatarPath,
  isUserOwnedAvatarUrl,
} from "../src/lib/avatar-storage.js";

describe("avatar storage helpers", () => {
  it("builds user-scoped avatar object paths", () => {
    const path = buildAvatarObjectPath("user-1", "my avatar.png");

    expect(path).toMatch(/^avatars\/user-1\/\d+-my-avatar\.png$/);
  });

  it("detects whether an avatar url belongs to the authenticated user", () => {
    expect(
      isUserOwnedAvatarUrl(
        "https://project.supabase.co/storage/v1/object/public/avatars/avatars/user-1/pic.png",
        "user-1",
      ),
    ).toBe(true);
    expect(
      isUserOwnedAvatarUrl(
        "https://project.supabase.co/storage/v1/object/public/avatars/avatars/user-2/pic.png",
        "user-1",
      ),
    ).toBe(false);
  });

  it("extracts canonical avatar paths from public urls", () => {
    expect(
      extractAvatarPath(
        "https://project.supabase.co/storage/v1/object/public/avatars/avatars/user-1/pic.png",
      ),
    ).toBe("avatars/user-1/pic.png");
  });
});
