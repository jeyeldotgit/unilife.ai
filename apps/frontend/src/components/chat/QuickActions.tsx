import type { ChatQuickAction } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";

type QuickActionsProps = {
  actions: ChatQuickAction[];
  onAction: (action: ChatQuickAction) => void;
};

export function QuickActions({ actions, onAction }: QuickActionsProps) {
  if (actions.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-[#c2c6d6] bg-white p-3 shadow-sm">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.05em] text-[#424754]">
        Quick actions
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={() => onAction(action)}
            className="flex min-h-12 items-center gap-2 rounded-lg border border-[#c2c6d6] bg-[#f8f9fa] px-3 py-2 text-left transition-all hover:border-[#3B82F6] hover:bg-[#f8fbff]"
          >
            <Icon name={action.icon} className="text-[#3B82F6]" size={18} />
            <span className="min-w-0 text-sm font-semibold text-[#191c1d]">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

