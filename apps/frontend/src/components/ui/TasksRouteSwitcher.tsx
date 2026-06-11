"use client";

import Link from "next/link";

type TasksRouteSwitcherProps = {
  activeRoute: "/assignments" | "/exams";
};

const ITEMS = [
  {
    href: "/assignments" as const,
    label: "Assignments",
  },
  {
    href: "/exams" as const,
    label: "Exams",
  },
];

export function TasksRouteSwitcher({
  activeRoute,
}: TasksRouteSwitcherProps) {
  return (
    <div className="inline-flex rounded-full bg-[#e7e8e9] p-1 shadow-sm">
      {ITEMS.map((item) => {
        const active = item.href === activeRoute;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "rounded-full bg-[#2170e4] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors"
                : "rounded-full px-4 py-2 text-sm font-semibold text-[#424754] transition-colors hover:bg-white/70"
            }
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
