import type { Exam } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";

type ExamCardProps = {
  exam: Exam;
  onSelect?: (exam: Exam) => void;
};

export function ExamCard({ exam, onSelect }: ExamCardProps) {
  const isPast = exam.urgency.label === "FINISHED";

  return (
    <button
      type="button"
      onClick={() => onSelect?.(exam)}
      className="w-full rounded-xl border bg-white p-5 text-left shadow-sm transition-colors hover:border-[#3B82F6]"
      style={{
        borderColor: isPast ? "rgba(194,198,214,0.5)" : "#c2c6d6",
        backgroundColor: isPast ? "#f9fafb" : "#ffffff",
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#d8e2ff] text-[#0058be]">
              <Icon name="quiz" filled={exam.urgency.tone === "danger"} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-[#191c1d]">
                {exam.title}
              </p>
              <p className="truncate text-sm font-medium text-[#424754]">
                {exam.subject}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#424754]">
            <span className="flex items-center gap-1.5">
              <Icon name="schedule" size={16} />
              {exam.examDateTimeLabel}
            </span>
            {exam.location ? (
              <span className="flex items-center gap-1.5">
                <Icon name="location_on" size={16} />
                {exam.location}
              </span>
            ) : null}
          </div>
        </div>

        <div
          className="inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em]"
          style={{
            backgroundColor: exam.urgency.bgColor,
            color: exam.urgency.textColor,
          }}
        >
          <Icon name={exam.urgency.icon} size={14} />
          {exam.urgency.label}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="font-medium text-[#424754]">{exam.countdownLabel}</span>
        <span className="flex items-center gap-1 font-semibold text-[#2170e4]">
          View details
          <Icon name="chevron_right" size={16} />
        </span>
      </div>
    </button>
  );
}
