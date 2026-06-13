import { Icon } from "@/components/ui/Icon";

export type MutationVisualState = "idle" | "pending" | "queued" | "failed";

export function MutationStatus({
  state,
  label,
}: {
  state: MutationVisualState;
  label?: string;
}) {
  if (state === "idle") {
    return null;
  }

  const config =
    state === "pending"
      ? { icon: "sync", color: "#0058be", text: label ?? "Saving changes..." }
      : state === "queued"
        ? {
            icon: "cloud_upload",
            color: "#825100",
            text: label ?? "Saved locally and queued to sync.",
          }
        : {
            icon: "sync_problem",
            color: "#ba1a1a",
            text: label ?? "We could not finish that action.",
          };

  return (
    <div
      className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-2 text-xs font-semibold shadow-sm"
      style={{ color: config.color }}
      aria-live="polite"
    >
      <Icon name={config.icon} size={16} />
      <span>{config.text}</span>
    </div>
  );
}
