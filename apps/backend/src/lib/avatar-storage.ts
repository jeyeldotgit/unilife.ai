export const AVATAR_BUCKET = "avatars";

const USER_OWNED_AVATAR_PATH_PATTERN = /^avatars\/([^/]+)\/[^/]+$/;

export function buildAvatarObjectPath(userId: string, fileName: string) {
  const safeName = fileName
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const finalName = safeName.length > 0 ? safeName : "avatar";

  return `avatars/${userId}/${Date.now()}-${finalName}`;
}

export function extractAvatarPath(url: string) {
  const marker = `/storage/v1/object/public/${AVATAR_BUCKET}/`;
  const markerIndex = url.indexOf(marker);

  if (markerIndex >= 0) {
    return url.slice(markerIndex + marker.length).replace(/^\/+/, "");
  }

  try {
    const parsed = new URL(url);
    return parsed.pathname.replace(/^\/+/, "");
  } catch {
    return url.replace(/^\/+/, "");
  }
}

export function isUserOwnedAvatarUrl(url: string | null | undefined, userId: string) {
  if (!url) {
    return false;
  }

  const match = USER_OWNED_AVATAR_PATH_PATTERN.exec(extractAvatarPath(url));

  return match?.[1] === userId;
}
