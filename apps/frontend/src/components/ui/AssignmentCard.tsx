import type { Assignment, ChatAssignmentConfirmationPayload } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";

type AssignmentCardListProps = {
  variant: "list";
  assignment: Assignment;
  checked?: boolean;
  onToggleChecked?: (assignmentId: string) => void;
  onSelect?: (assignment: Assignment) => void;
};

type AssignmentCardChatConfirmationProps = {
  variant: "chat_confirmation";
  confirmation: ChatAssignmentConfirmationPayload;
  onCtaClick?: (assignmentId: string) => void;
};

type AssignmentCardProps =
  | AssignmentCardListProps
  | AssignmentCardChatConfirmationProps;

export function AssignmentCard(props: AssignmentCardProps) {
  if (props.variant === "chat_confirmation") {
    const { confirmation, onCtaClick } = props;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <p style={{ fontSize: "16px", lineHeight: "24px", margin: 0 }}>
          {"\u2705"} Got it! I&apos;ve added:
        </p>
        <div
          style={{
            backgroundColor: "#f3f4f5",
            borderRadius: "12px",
            padding: "12px",
            border: "1px solid rgba(194,198,214,0.3)",
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              backgroundColor: "rgba(16,185,129,0.1)",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon
              name={confirmation.icon}
              className="text-[#10B981]"
              size={24}
            />
          </div>
          <div>
            <h4
              style={{
                fontSize: "14px",
                fontWeight: 600,
                letterSpacing: "0.01em",
                color: "#191c1d",
                margin: "0 0 2px 0",
              }}
            >
              {confirmation.title}
            </h4>
            <p style={{ fontSize: "12px", color: "#424754", margin: 0 }}>
              {confirmation.dueLabel}
            </p>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "12px",
            color: "#424754",
            fontStyle: "italic",
          }}
        >
          <Icon name="link_off" size={16} />
          {confirmation.classLinkLabel}
        </div>
        <button
          type="button"
          onClick={() => onCtaClick?.(confirmation.assignmentId)}
          style={{
            width: "100%",
            backgroundColor: "#3B82F6",
            color: "#ffffff",
            fontSize: "14px",
            fontWeight: 600,
            letterSpacing: "0.01em",
            padding: "12px",
            borderRadius: "12px",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            transition: "opacity 0.15s",
            fontFamily: "'Inter', sans-serif",
          }}
          onMouseOver={(event) => {
            event.currentTarget.style.opacity = "0.9";
          }}
          onMouseOut={(event) => {
            event.currentTarget.style.opacity = "1";
          }}
          onMouseDown={(event) => {
            event.currentTarget.style.transform = "scale(0.95)";
          }}
          onMouseUp={(event) => {
            event.currentTarget.style.transform = "scale(1)";
          }}
        >
          {confirmation.ctaLabel}
          <Icon name="arrow_forward" size={18} />
        </button>
      </div>
    );
  }

  const { assignment, checked = false, onSelect, onToggleChecked } = props;
  const isDone = assignment.status === "completed";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(assignment)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          onSelect?.(assignment);
        }
      }}
      style={{
        backgroundColor: isDone ? "#f3f4f5" : "#ffffff",
        border: `1px solid ${isDone ? "rgba(194,198,214,0.3)" : "#c2c6d6"}`,
        padding: "20px",
        borderRadius: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        opacity: isDone || checked ? 0.8 : 1,
        transition: "opacity 0.2s, border-color 0.2s",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      }}
      onMouseOver={(event) => {
        event.currentTarget.style.borderColor = "#3B82F6";
      }}
      onMouseOut={(event) => {
        event.currentTarget.style.borderColor = isDone
          ? "rgba(194,198,214,0.3)"
          : "#c2c6d6";
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Icon
            name={assignment.icon}
            style={{
              color: assignment.iconColor,
              fontSize: "20px",
            }}
          />
          <h3
            style={{
              fontSize: "14px",
              fontWeight: 600,
              letterSpacing: "0.01em",
              color: "#111827",
              margin: 0,
              textDecoration: isDone ? "line-through" : "none",
            }}
          >
            {assignment.title}
          </h3>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "12px",
            fontWeight: 500,
            color: "#6B7280",
          }}
        >
          <span>{assignment.subject}</span>
          <span
            style={{
              width: "4px",
              height: "4px",
              backgroundColor: "#c2c6d6",
              borderRadius: "9999px",
              display: "inline-block",
            }}
          />
          <span>{assignment.dueDateLabel}</span>
        </div>

        <div
          style={{
            marginTop: "8px",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "2px 10px",
            borderRadius: "4px",
            backgroundColor: assignment.urgency.bgColor,
            color: assignment.urgency.textColor,
            fontSize: "11px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          <Icon name={assignment.urgency.icon} size={14} />
          {assignment.urgency.label}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "12px",
        }}
      >
        {isDone ? (
          <button
            type="button"
            aria-label={`Mark ${assignment.title} pending`}
            onClick={(event) => {
              event.stopPropagation();
              onToggleChecked?.(assignment.id);
            }}
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "9999px",
              backgroundColor: "#10B981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
              cursor: "pointer",
            }}
          >
            <Icon name="check" filled className="text-white" size={16} />
          </button>
        ) : (
          <button
            type="button"
            aria-label={`Toggle ${assignment.title}`}
            onClick={(event) => {
              event.stopPropagation();
              onToggleChecked?.(assignment.id);
            }}
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "9999px",
              border: `2px solid ${checked ? "#3B82F6" : "#c2c6d6"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "border-color 0.2s",
              backgroundColor: checked ? "rgba(59,130,246,0.1)" : "transparent",
            }}
            onMouseOver={(event) => {
              event.currentTarget.style.borderColor = "#3B82F6";
            }}
            onMouseOut={(event) => {
              event.currentTarget.style.borderColor = checked
                ? "#3B82F6"
                : "#c2c6d6";
            }}
          >
            {checked ? (
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "9999px",
                  backgroundColor: "#0058be",
                }}
              />
            ) : null}
          </button>
        )}

        <span
          style={{
            fontSize: "12px",
            fontWeight: isDone ? 600 : 500,
            color: isDone ? "#10B981" : "#424754",
            padding: "2px 8px",
            borderRadius: "6px",
            backgroundColor: isDone ? "transparent" : "#edeeef",
          }}
        >
          {isDone ? "Done" : "Pending"}
        </span>
      </div>
    </div>
  );
}
