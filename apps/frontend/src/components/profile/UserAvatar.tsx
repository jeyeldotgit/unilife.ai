"use client";

import Image from "next/image";
import { useState } from "react";
import { NEUTRAL_AVATAR_URL } from "@/lib/profile/avatar-presets";

function getInitials(name: string | null | undefined) {
  if (!name) {
    return null;
  }

  const words = name
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);

  if (words.length === 0) {
    return null;
  }

  return words.map((word) => word[0]?.toUpperCase() ?? "").join("");
}

export function UserAvatar({
  avatarUrl,
  className = "",
  displayName,
}: {
  avatarUrl: string | null;
  className?: string;
  displayName: string | null;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const initials = getInitials(displayName);
  const activeUrl = avatarUrl && avatarUrl !== failedUrl ? avatarUrl : null;

  if (activeUrl) {
    return (
      <Image
        alt={displayName ? `${displayName} avatar` : "User avatar"}
        className={className}
        height={40}
        onError={() => setFailedUrl(activeUrl)}
        sizes="40px"
        src={activeUrl}
        width={40}
      />
    );
  }

  if (initials) {
    return (
      <div
        aria-label={`${displayName} initials avatar`}
        className={`flex items-center justify-center bg-[#d8e2ff] text-sm font-semibold text-[#0058be] ${className}`.trim()}
      >
        {initials}
      </div>
    );
  }

  return (
    <Image
      alt="Default avatar"
      className={className}
      height={40}
      sizes="40px"
      src={NEUTRAL_AVATAR_URL}
      width={40}
    />
  );
}
