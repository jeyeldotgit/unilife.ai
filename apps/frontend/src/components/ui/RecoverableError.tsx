import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";

type RecoverableErrorProps = {
  title?: ReactNode;
  message: ReactNode;
  retryLabel?: string;
  onRetry?: (() => void) | null;
  tone?: "danger" | "warning" | "neutral";
  className?: string;
};

const TONE_STYLES = {
  danger: {
    accent: "#ba1a1a",
    bg: "#fff8f7",
    border: "#ffdad6",
    icon: "error",
  },
  warning: {
    accent: "#825100",
    bg: "#fff8f1",
    border: "#ffddb8",
    icon: "warning",
  },
  neutral: {
    accent: "#0058be",
    bg: "#f8fbff",
    border: "#d8e2ff",
    icon: "info",
  },
} as const;

export function RecoverableError({
  title = "Something needs attention",
  message,
  retryLabel = "Retry",
  onRetry = null,
  tone = "danger",
  className = "",
}: RecoverableErrorProps) {
  const style = TONE_STYLES[tone];

  return (
    <div
      className={`rounded-xl border px-4 py-3 shadow-sm ${className}`.trim()}
      role="alert"
      style={{
        backgroundColor: style.bg,
        borderColor: style.border,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{ backgroundColor: `${style.accent}1A`, color: style.accent }}
        >
          <Icon name={style.icon} filled={tone === "danger"} size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#191c1d]">{title}</p>
          <p className="mt-1 text-sm font-medium text-[#424754]">{message}</p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 rounded-full px-4 py-2 text-sm font-semibold"
              style={{ backgroundColor: style.accent, color: "#ffffff" }}
            >
              {retryLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
