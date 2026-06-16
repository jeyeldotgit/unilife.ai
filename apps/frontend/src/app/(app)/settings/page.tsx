import Link from "next/link";
import { AuthenticatedPageHeader } from "@/components/profile/AuthenticatedPageHeader";
import { Icon } from "@/components/ui/Icon";

const LINKS = [
  { href: "/settings/account", icon: "person", label: "Account Settings" },
  { href: "/settings/notifications", icon: "notifications", label: "Notifications" },
  { href: "/settings/sync", icon: "sync", label: "Sync Status" },
] as const;

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-32 font-sans text-[#191c1d]">
      <AuthenticatedPageHeader pageTitle="Settings" />
      <main className="mx-auto max-w-2xl space-y-3 px-4 pt-6">
        {LINKS.map((link) => (
          <Link
            className="flex items-center justify-between rounded-xl border border-[#c2c6d6]/40 bg-white p-4 text-sm font-semibold shadow-sm"
            href={link.href}
            key={link.href}
          >
            <span className="flex items-center gap-3">
              <Icon name={link.icon} />
              {link.label}
            </span>
            <Icon name="chevron_right" />
          </Link>
        ))}
      </main>
    </div>
  );
}
