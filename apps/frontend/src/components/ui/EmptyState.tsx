import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";

type EmptyStateProps = {
  icon: string;
  title: ReactNode;
  description: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`rounded-xl border border-dashed border-[#c2c6d6]/40 bg-white/80 px-6 py-10 text-center shadow-sm ${className}`.trim()}
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#d8e2ff] text-[#0058be]">
        <Icon name={icon} filled size={28} />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-[#191c1d]">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm font-medium text-[#424754]">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

