"use client";

import type { ChangeEvent } from "react";
import { useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { AVATAR_PRESET_URLS } from "@/lib/profile/avatar-presets";
import { cropAndCompressAvatar } from "@/lib/profile/image";
import { uploadAvatarFile } from "@/lib/profile/avatar-storage";

export function AvatarPicker({
  avatarUrl,
  displayName,
  onChange,
  userId,
}: {
  avatarUrl: string | null;
  displayName: string | null;
  onChange: (nextAvatarUrl: string | null) => void;
  userId: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const processed = await cropAndCompressAvatar(file);
      const uploaded = await uploadAvatarFile(userId, processed);
      onChange(uploaded.publicUrl);
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "We couldn't upload that image right now.",
      );
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-[#c2c6d6] bg-[#f3f4f5]">
          {avatarUrl ? (
            <img
              alt={displayName ? `${displayName} avatar preview` : "Avatar preview"}
              className="h-full w-full object-cover"
              src={avatarUrl}
            />
          ) : (
            <Icon className="text-[#6B7280]" name="person" size={28} />
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-full border border-[#c2c6d6] px-4 py-2 text-sm font-semibold text-[#191c1d]"
            onClick={() => inputRef.current?.click()}
            type="button"
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
          <button
            className="rounded-full border border-[#c2c6d6] px-4 py-2 text-sm font-semibold text-[#191c1d]"
            onClick={() => onChange(null)}
            type="button"
          >
            Remove
          </button>
        </div>
      </div>

      <input
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        ref={inputRef}
        type="file"
      />

      <div className="grid grid-cols-3 gap-3">
        {AVATAR_PRESET_URLS.map((presetUrl) => {
          const selected = avatarUrl === presetUrl;

          return (
            <button
              className={`overflow-hidden rounded-2xl border p-1 ${selected ? "border-[#3B82F6]" : "border-[#c2c6d6]"}`}
              key={presetUrl}
              onClick={() => onChange(presetUrl)}
              type="button"
            >
              <img alt="Avatar preset" className="h-20 w-full rounded-xl object-cover" src={presetUrl} />
            </button>
          );
        })}
      </div>

      <p className="text-xs font-medium text-[#424754]">
        Upload image files only. We crop and compress images before upload, and the final file must stay under 2 MB.
      </p>

      {error ? (
        <div className="rounded-xl border border-[#ffdad6] bg-[#fff8f7] px-4 py-3 text-sm font-medium text-[#ba1a1a]">
          {error}
        </div>
      ) : null}
    </div>
  );
}
