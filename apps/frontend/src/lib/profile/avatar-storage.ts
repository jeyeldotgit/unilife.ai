import { createClient } from "@/lib/supabase/client";

export const AVATAR_BUCKET = "avatars";
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

function sanitizeFileName(fileName: string) {
  const cleaned = fileName
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return cleaned.length > 0 ? cleaned : "avatar";
}

export function buildAvatarObjectPath(userId: string, fileName: string) {
  return `avatars/${userId}/${Date.now()}-${sanitizeFileName(fileName)}`;
}

export function extractAvatarObjectPath(url: string) {
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

  return extractAvatarObjectPath(url).startsWith(`avatars/${userId}/`);
}

export async function uploadAvatarFile(userId: string, file: File) {
  const supabase = createClient();
  const objectPath = buildAvatarObjectPath(userId, file.name);
  const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(objectPath, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(objectPath);

  return {
    objectPath,
    publicUrl: data.publicUrl,
  };
}

export async function deleteAvatarByUrl(url: string) {
  const supabase = createClient();
  const objectPath = extractAvatarObjectPath(url).replace(/^avatars\//, "");
  const { error } = await supabase.storage.from(AVATAR_BUCKET).remove([objectPath]);

  if (error) {
    throw new Error(error.message);
  }
}
