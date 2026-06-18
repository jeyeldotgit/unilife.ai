"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";

const NAV_ITEMS = [
  { href: "/dashboard", icon: "home", label: "Home" },
  { href: "/schedule", icon: "calendar_month", label: "Schedule" },
  { href: "/study", icon: "school", label: "Study" },
  { href: "/assignments", icon: "assignment", label: "Tasks" },
  { href: "/expenses", icon: "payments", label: "Money" },
];

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 pb-4 pt-2 bg-white/80 backdrop-blur-xl border-t border-[#c2c6d6] shadow-lg rounded-t-xl">
      {NAV_ITEMS.map((item) => {
        const active = isActivePath(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "flex flex-col items-center justify-center bg-[#2170e4] text-[#fefcff] rounded-full px-4 py-1 scale-90 transition-transform duration-200"
                : "flex flex-col items-center justify-center text-[#424754] p-2 hover:bg-[#e7e8e9] rounded-full transition-colors"
            }
          >
            <Icon name={item.icon} filled={active} />
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
