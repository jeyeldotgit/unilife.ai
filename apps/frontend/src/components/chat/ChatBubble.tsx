import type {
  ChatAllowanceForecastPayload,
  ChatClassConfirmationPayload,
  ChatExamConfirmationPayload,
  ChatExpenseConfirmationPayload,
  ChatFreeTimeRecommendationPayload,
  ChatMessage,
} from "@/lib/types";
import { AssignmentCard } from "@/components/ui/AssignmentCard";
import { Icon } from "@/components/ui/Icon";
import { ProposalReviewCard } from "@/components/chat/ProposalReviewCard";
import type { AiProposal } from "@unilife-ai/types";

type ChatBubbleProps = {
  message: ChatMessage;
  onAssignmentCtaClick?: (assignmentId: string) => void;
  onClassCtaClick?: (classId: string) => void;
  onExamCtaClick?: (examId: string) => void;
  onExpenseCtaClick?: (expenseId: string) => void;
  onProposalChange?: (proposal: AiProposal) => void;
};

function AiAvatar() {
  return (
    <div
      style={{
        width: "24px",
        height: "24px",
        backgroundColor: "#3B82F6",
        borderRadius: "9999px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Icon name="smart_toy" filled size={14} className="text-white" />
    </div>
  );
}

function ExpenseConfirmationCard({
  payload,
  onClick,
}: {
  payload: ChatExpenseConfirmationPayload;
  onClick?: (expenseId: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <p style={{ fontSize: "16px", lineHeight: "24px", margin: 0 }}>
        {"\ud83d\udcb8"} Expense logged!
      </p>
      <div
        style={{
          backgroundColor: "#f3f4f5",
          borderRadius: "12px",
          padding: "16px",
          border: "1px solid rgba(194,198,214,0.3)",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              backgroundColor: "rgba(59,130,246,0.12)",
              borderRadius: "9999px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon name={payload.icon} className="text-[#3B82F6]" size={20} />
          </div>
          <div>
            <p
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "#191c1d",
                margin: 0,
              }}
            >
              {payload.amountLabel} - {payload.categoryLabel}
            </p>
            <p
              style={{
                fontSize: "12px",
                color: "#424754",
                margin: "2px 0 0 0",
              }}
            >
              {payload.spentAtLabel}
            </p>
          </div>
        </div>
        <div>
          <p
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "#424754",
              margin: "0 0 8px 0",
            }}
          >
            Budget remaining:
          </p>
          <p
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "#191c1d",
              margin: 0,
            }}
          >
            {payload.budgetRemainingLabel}{" "}
            <span
              style={{
                fontSize: "14px",
                fontWeight: 500,
                color: "#424754",
              }}
            >
              of {payload.budgetTotalLabel}
            </span>
          </p>
          <div
            style={{
              width: "100%",
              backgroundColor: "#edeeef",
              height: "8px",
              borderRadius: "9999px",
              overflow: "hidden",
              marginTop: "10px",
            }}
          >
            <div
              style={{
                backgroundColor: "#10B981",
                height: "100%",
                width: `${payload.progressPercent}%`,
                borderRadius: "9999px",
              }}
            />
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onClick?.(payload.expenseId)}
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
      >
        {payload.ctaLabel}
        <Icon name="arrow_forward" size={18} />
      </button>
    </div>
  );
}

function SimpleConfirmationCard({
  title,
  subtitle,
  meta,
  icon,
  ctaLabel,
  onClick,
}: {
  title: string;
  subtitle: string;
  meta: string;
  icon: string;
  ctaLabel: string;
  onClick?: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div
        style={{
          backgroundColor: "#f3f4f5",
          borderRadius: "12px",
          padding: "16px",
          border: "1px solid rgba(194,198,214,0.3)",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              backgroundColor: "rgba(59,130,246,0.12)",
              borderRadius: "9999px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon name={icon} className="text-[#3B82F6]" size={20} />
          </div>
          <div>
            <p
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "#191c1d",
                margin: 0,
              }}
            >
              {title}
            </p>
            <p
              style={{
                fontSize: "12px",
                color: "#424754",
                margin: "2px 0 0 0",
              }}
            >
              {subtitle}
            </p>
            <p
              style={{
                fontSize: "12px",
                color: "#424754",
                margin: "2px 0 0 0",
              }}
            >
              {meta}
            </p>
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={onClick}
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
      >
        {ctaLabel}
        <Icon name="arrow_forward" size={18} />
      </button>
    </div>
  );
}

function ClassConfirmationCard({
  payload,
  onClick,
}: {
  payload: ChatClassConfirmationPayload;
  onClick?: (classId: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <p style={{ fontSize: "16px", lineHeight: "24px", margin: 0 }}>
        {"\ud83d\uddd3\ufe0f"} Class added!
      </p>
      <SimpleConfirmationCard
        title={payload.subject}
        subtitle={payload.meetingLabel}
        meta={payload.locationLabel}
        icon={payload.icon}
        ctaLabel={payload.ctaLabel}
        onClick={() => onClick?.(payload.classId)}
      />
    </div>
  );
}

function ExamConfirmationCard({
  payload,
  onClick,
}: {
  payload: ChatExamConfirmationPayload;
  onClick?: (examId: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <p style={{ fontSize: "16px", lineHeight: "24px", margin: 0 }}>
        {"\ud83d\udcdd"} Exam added!
      </p>
      <SimpleConfirmationCard
        title={payload.title}
        subtitle={payload.examDateTimeLabel}
        meta={`${payload.subjectLabel} • ${payload.locationLabel}`}
        icon={payload.icon}
        ctaLabel={payload.ctaLabel}
        onClick={() => onClick?.(payload.examId)}
      />
    </div>
  );
}

function FreeTimeRecommendationCard({
  payload,
}: {
  payload: ChatFreeTimeRecommendationPayload;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div>
        <p
          style={{
            fontSize: "18px",
            lineHeight: "24px",
            fontWeight: 600,
            color: "#191c1d",
            margin: 0,
          }}
        >
          {"\ud83d\udd50"} {payload.freeWindowLabel}
        </p>
        <p
          style={{
            fontSize: "14px",
            lineHeight: "20px",
            color: "#424754",
            margin: "6px 0 0 0",
          }}
        >
          {payload.nextClassLabel}
        </p>
      </div>
      <div>
        <p
          style={{
            fontSize: "14px",
            fontWeight: 600,
            color: "#191c1d",
            margin: "0 0 12px 0",
          }}
        >
          Here&apos;s what I suggest:
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {payload.recommendations.length === 0 ? (
            <p style={{ fontSize: "14px", color: "#424754", margin: 0 }}>
              You have no pending assignments or upcoming exams to prioritize.
            </p>
          ) : payload.recommendations.map((recommendation, index) => (
            <div
              key={`${recommendation.entityId ?? recommendation.title}-${index}`}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "9999px",
                  backgroundColor: "#d8e2ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#0058be",
                  }}
                >
                  {index + 1}
                </span>
              </div>
              <div>
                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#191c1d",
                    margin: 0,
                  }}
                >
                  {recommendation.title}
                </p>
                <p
                  style={{
                    fontSize: "12px",
                    color: "#424754",
                    margin: "2px 0 0 0",
                  }}
                >
                  {recommendation.dueLabel}
                </p>
                <p
                  style={{
                    fontSize: "12px",
                    color: "#424754",
                    margin: "2px 0 0 0",
                  }}
                >
                  {recommendation.typeLabel} • {recommendation.subjectLabel}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <p
        style={{
          fontSize: "14px",
          lineHeight: "20px",
          color: "#424754",
          margin: 0,
        }}
      >
        {payload.closingText}
      </p>
    </div>
  );
}

function formatForecastAmount(amount: number) {
  return `PHP ${amount.toLocaleString("en-PH", {
    maximumFractionDigits: 2,
  })}`;
}

function AllowanceForecastCard({
  payload,
}: {
  payload: ChatAllowanceForecastPayload;
}) {
  const runoutLabel =
    payload.projected_runout_days === null
      ? "No runout projected at your current spending rate."
      : payload.will_last_cycle
        ? `Your allowance is projected to last about ${payload.projected_runout_days} days.`
        : `At this rate, your allowance may run out in about ${payload.projected_runout_days} days.`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <p style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>
        Allowance Forecast
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "12px",
        }}
      >
        {[
          ["Remaining", formatForecastAmount(payload.remaining)],
          ["Days left", String(payload.days_left_in_cycle)],
          ["Average/day", formatForecastAmount(payload.avg_daily_spend)],
          ["Safe daily limit", formatForecastAmount(payload.recommended_daily_limit)],
        ].map(([label, value]) => (
          <div key={label} style={{ padding: "12px", borderRadius: "10px", background: "#f3f4f5" }}>
            <p style={{ fontSize: "11px", color: "#424754", margin: 0 }}>{label}</p>
            <p style={{ fontSize: "14px", fontWeight: 700, margin: "4px 0 0" }}>{value}</p>
          </div>
        ))}
      </div>
      <p
        style={{
          fontSize: "14px",
          lineHeight: "20px",
          color: payload.will_last_cycle ? "#00714d" : "#ba1a1a",
          fontWeight: 600,
          margin: 0,
        }}
      >
        {runoutLabel}
      </p>
      <p style={{ fontSize: "14px", lineHeight: "20px", color: "#424754", margin: 0 }}>
        {payload.closingText}
      </p>
    </div>
  );
}

export function ChatBubble({
  message,
  onAssignmentCtaClick,
  onClassCtaClick,
  onExamCtaClick,
  onExpenseCtaClick,
  onProposalChange,
}: ChatBubbleProps) {
  if (message.role === "user") {
    const userText = message.kind === "text" ? message.text : "";

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "4px",
        }}
      >
        {message.timeLabel ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "4px",
            }}
          >
            <span
              style={{
                fontSize: "12px",
                fontWeight: 500,
                color: "#424754",
              }}
            >
              {message.timeLabel}
            </span>
          </div>
        ) : null}
        <div
          style={{
            backgroundColor: "#0058be",
            color: "#ffffff",
            padding: "20px",
            borderRadius: "16px",
            borderTopRightRadius: "4px",
            boxShadow: "0 2px 8px rgba(0,88,190,0.2)",
            maxWidth: "85%",
          }}
        >
          <p
            style={{
              fontSize: "16px",
              lineHeight: "24px",
              margin: 0,
            }}
          >
            {userText}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "4px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "4px",
        }}
      >
        <AiAvatar />
        <span
          style={{
            fontSize: "12px",
            fontWeight: 500,
            color: "#424754",
          }}
        >
          UniLife AI
        </span>
      </div>
      <div
        className="glass-panel"
        style={{
          border: "1px solid #c2c6d6",
          padding: "20px",
          borderRadius: "16px",
          borderTopLeftRadius: "4px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          maxWidth: "85%",
        }}
      >
        {message.kind === "text" ? (
          <p
            style={{
              fontSize: "16px",
              lineHeight: "24px",
              margin: 0,
              color: "#191c1d",
            }}
          >
            {message.text}
          </p>
        ) : null}
        {message.kind === "assignment_confirmation" ? (
          <AssignmentCard
            variant="chat_confirmation"
            confirmation={message.payload}
            onCtaClick={onAssignmentCtaClick}
          />
        ) : null}
        {message.kind === "class_confirmation" ? (
          <ClassConfirmationCard
            payload={message.payload}
            onClick={onClassCtaClick}
          />
        ) : null}
        {message.kind === "exam_confirmation" ? (
          <ExamConfirmationCard
            payload={message.payload}
            onClick={onExamCtaClick}
          />
        ) : null}
        {message.kind === "expense_confirmation" ? (
          <ExpenseConfirmationCard
            payload={message.payload}
            onClick={onExpenseCtaClick}
          />
        ) : null}
        {message.kind === "free_time_recommendation" ? (
          <FreeTimeRecommendationCard payload={message.payload} />
        ) : null}
        {message.kind === "allowance_forecast" ? (
          <AllowanceForecastCard payload={message.payload} />
        ) : null}
        {message.kind === "proposal_review" ? (
          <ProposalReviewCard proposal={message.payload} onChange={onProposalChange} />
        ) : null}
      </div>
    </div>
  );
}
