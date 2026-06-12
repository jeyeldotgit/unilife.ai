"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { logout } from "@/actions/auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { NotificationPermissionButton } from "@/components/notifications/NotificationPermissionButton";
import { Icon } from "@/components/ui/Icon";
import { useProfile } from "@/components/profile/ProfileContext";
import { UserAvatar } from "@/components/profile/UserAvatar";
import { formatHeaderDate, getGreetingForTimeZone } from "@/lib/profile/time";

export function AuthenticatedPageHeader({
  pageTitle,
  className = "sticky top-0 z-40 bg-[rgba(248,249,250,0.92)] backdrop-blur-[12px]",
}: {
  pageTitle: string;
  className?: string;
}) {
  const { error, loading, profile, refreshProfile, resolvedTimeZone } = useProfile();
  const [menuOpen, setMenuOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const greeting = getGreetingForTimeZone(resolvedTimeZone);
  const displayName = profile?.display_name ?? null;
  const subtitle = loading
    ? "Loading your profile..."
    : `${greeting}, ${displayName ?? "there"}`;
  const dateLabel = formatHeaderDate(resolvedTimeZone);

  useEffect(() => {
    const updateCompact = () => setCompact(window.innerWidth < 520);
    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    updateCompact();
    window.addEventListener("resize", updateCompact);
    window.addEventListener("mousedown", handlePointerDown);

    return () => {
      window.removeEventListener("resize", updateCompact);
      window.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  return (
    <PageHeader
      className={className}
      contentClassName="flex items-start justify-between gap-3 px-4 py-4"
      title={pageTitle}
      subtitle={compact ? subtitle : `${subtitle} • ${dateLabel}`}
      titleClassName="m-0 text-[28px] font-bold leading-[34px] text-[#191c1d]"
      subtitleClassName="text-sm font-medium text-[#424754]"
      titleWrapperClassName="min-w-0"
      leading={
        <div className="relative" ref={menuRef}>
          <button
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label="Open profile menu"
            className="relative block rounded-full"
            onClick={() => setMenuOpen((current) => !current)}
            type="button"
          >
            <UserAvatar
              avatarUrl={profile?.avatar_url ?? null}
              className="h-10 w-10 rounded-full border border-[#c2c6d6] object-cover"
              displayName={displayName}
            />
          </button>

          {menuOpen ? (
            <div
              aria-label="Profile menu"
              className="absolute left-0 top-12 z-50 w-44 rounded-2xl border border-[#c2c6d6] bg-white p-2 shadow-xl"
              role="menu"
            >
              <Link
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-[#191c1d] hover:bg-[#f3f4f5]"
                href="/profile"
                role="menuitem"
              >
                <Icon name="person" size={18} />
                Profile
              </Link>
              <form action={logout}>
                <button
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-[#ba1a1a] hover:bg-[#fff8f7]"
                  role="menuitem"
                  type="submit"
                >
                  <Icon name="logout" size={18} />
                  Logout
                </button>
              </form>
            </div>
          ) : null}
        </div>
      }
      trailing={
        <div className="flex items-center gap-2">
          <NotificationPermissionButton className="rounded-full p-2 text-[#424754] transition-opacity hover:opacity-80" />
          {error ? (
            <button
              className="rounded-full border border-[#c2c6d6] px-3 py-2 text-xs font-semibold text-[#424754]"
              onClick={() => {
                void refreshProfile();
              }}
              type="button"
            >
              Retry
            </button>
          ) : null}
        </div>
      }
    />
  );
}
