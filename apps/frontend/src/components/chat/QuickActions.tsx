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
    <div>
      <p className="mb-3 text-sm font-medium text-[#424754]">Quick actions:</p>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={() => onAction(action)}
            className="flex shrink-0 items-center gap-2 rounded-xl border border-[#c2c6d6]/30 bg-white px-4 py-3 text-left shadow-sm transition-all hover:border-[#3B82F6] hover:bg-[#f8fbff]"
          >
            <Icon name={action.icon} className="text-[#3B82F6]" size={18} />
            <span className="text-sm font-semibold text-[#191c1d]">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

