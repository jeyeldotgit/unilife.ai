import type { BudgetStatus } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";

type BudgetProgressCardProps = {
  variant: "dashboard" | "expenses";
  budget: BudgetStatus;
  className?: string;
};

function getToneClasses(tone: BudgetStatus["tone"]) {
  if (tone === "danger") {
    return {
      text: "#ba1a1a",
      pillBg: "#ffdad6",
      fillBg: "#ba1a1a",
    };
  }

  if (tone === "warning") {
    return {
      text: "#825100",
      pillBg: "#ffddb8",
      fillBg: "#825100",
    };
  }

  return {
    text: "#10B981",
    pillBg: "#10B9811a",
    fillBg: "#10B981",
  };
}

export function BudgetProgressCard({
  variant,
  budget,
  className = "",
}: BudgetProgressCardProps) {
  const tone = getToneClasses(budget.tone);
  const remainingPercent = Math.max(0, 100 - budget.progressPercent);

  if (variant === "dashboard") {
    return (
      <section
        className={`academic-shadow rounded-[12px] border border-[#c2c6d6] bg-white p-5 ${className}`.trim()}
        style={{ gridColumn: "1 / -1" }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ flex: 1 }}>
            <h3
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "14px",
                fontWeight: 600,
                color: "#424754",
                margin: "0 0 8px 0",
              }}
            >
              <Icon
                name="account_balance_wallet"
                className="text-[#10B981]"
              />
              BUDGET STATUS
            </h3>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: "8px",
                marginBottom: "4px",
              }}
            >
              <span
                style={{
                  fontSize: "24px",
                  fontWeight: 600,
                  lineHeight: "32px",
                }}
              >
                {budget.remainingLabel}
              </span>
              <span style={{ fontSize: "14px", color: "#424754" }}>
                remaining
              </span>
            </div>
            <p
              style={{
                fontSize: "12px",
                color: "#424754",
                fontStyle: "italic",
                margin: 0,
              }}
            >
              {budget.estimateLabel}
            </p>
          </div>
          <div style={{ flex: 1, width: "100%" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "8px",
              }}
            >
              <span style={{ fontSize: "12px", color: "#424754" }}>
                Weekly Progress
              </span>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: "bold",
                  color: tone.text,
                }}
              >
                {remainingPercent}% left
              </span>
            </div>
            <div
              style={{
                width: "100%",
                height: "12px",
                backgroundColor: "#e1e3e4",
                borderRadius: "9999px",
                overflow: "hidden",
              }}
            >
              <div
                className="study-teal-glow"
                style={{
                  height: "100%",
                  width: `${remainingPercent}%`,
                  backgroundColor: tone.fillBg,
                  borderRadius: "9999px",
                  transition: "width 1s ease-out",
                }}
              />
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className={`rounded-xl p-5 shadow-sm ${className}`.trim()}
      style={{
        background: "rgba(255,255,255,0.7)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(229,231,235,0.5)",
      }}
    >
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[#424754]">
            {budget.cycleLabel}
          </h2>
          <p className="mt-1 text-2xl font-semibold">
            {budget.spentLabel}{" "}
            <span className="text-base font-normal text-[#424754]">
              / {budget.totalLabel}
            </span>
          </p>
        </div>
        <div
          className="rounded-full px-3 py-1"
          style={{ backgroundColor: tone.pillBg }}
        >
          <span className="text-xs font-medium" style={{ color: tone.text }}>
            {budget.progressLabel}
          </span>
        </div>
      </div>

      <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-[#edeeef]">
        <div
          className="h-full rounded-full"
          style={{
            width: `${budget.progressPercent}%`,
            backgroundColor: tone.fillBg,
          }}
        />
      </div>

      <div className="flex items-center gap-2 text-[#424754]">
        <Icon name="info" className="text-[18px]" />
        <p className="text-xs font-medium">{budget.estimateLabel}</p>
      </div>
    </section>
  );
}

