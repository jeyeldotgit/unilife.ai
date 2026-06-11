"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { BudgetProgressCard } from "@/components/ui/BudgetProgressCard";
import { Icon } from "@/components/ui/Icon";
import { useAssignments } from "@/hooks/use-assignments";
import { useClasses } from "@/hooks/use-classes";
import { useExams } from "@/hooks/use-exams";
import { useExpenses } from "@/hooks/use-expenses";
import { getUpcomingDashboardDeadlines } from "@/lib/api/deadlines";
import type {
  BudgetStatus,
  DashboardDeadlinePreview,
  ScheduleAgendaItem,
} from "@/lib/types";

export interface DashboardClientProps {
  todayClasses?: ScheduleAgendaItem[];
  upcomingDeadlines?: DashboardDeadlinePreview[];
  budget?: BudgetStatus | null;
  scheduleAvailable?: boolean;
  deadlinesAvailable?: boolean;
  deadlinesPartiallyAvailable?: boolean;
  budgetAvailable?: boolean;
}

function DashboardSectionFallback({
  icon,
  title,
  message,
}: {
  icon: string;
  title: string;
  message: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        padding: "16px",
        borderRadius: "12px",
        border: "1px dashed rgba(194, 198, 214, 0.6)",
        backgroundColor: "#f8f9fa",
      }}
    >
      <div
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "9999px",
          backgroundColor: "#d8e2ff",
          color: "#0058be",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon name={icon} size={20} />
      </div>
      <div>
        <p
          style={{
            fontSize: "14px",
            fontWeight: 600,
            color: "#191c1d",
            margin: "0 0 4px 0",
          }}
        >
          {title}
        </p>
        <p
          style={{
            fontSize: "12px",
            color: "#424754",
            margin: 0,
          }}
        >
          {message}
        </p>
      </div>
    </div>
  );
}

export default function DashboardClient({
  todayClasses: initialTodayClasses = [],
  upcomingDeadlines: initialUpcomingDeadlines = [],
  budget = null,
  scheduleAvailable,
  deadlinesAvailable,
  deadlinesPartiallyAvailable,
  budgetAvailable,
}: DashboardClientProps) {
  const router = useRouter();
  const classesState = useClasses();
  const assignmentsState = useAssignments();
  const examsState = useExams();
  const expensesState = useExpenses();
  const todayClasses =
    initialTodayClasses.length > 0
      ? initialTodayClasses
      : classesState.scheduleWeek.todayClasses;
  const upcomingDeadlines =
    initialUpcomingDeadlines.length > 0
      ? initialUpcomingDeadlines
      : getUpcomingDashboardDeadlines(
          assignmentsState.assignments,
          examsState.exams,
        );
  const resolvedBudget = budget ?? expensesState.budgetStatus;
  const resolvedScheduleAvailable = scheduleAvailable ?? classesState.available;
  const resolvedDeadlinesAvailable =
    deadlinesAvailable ?? (assignmentsState.available || examsState.available);
  const resolvedDeadlinesPartiallyAvailable =
    deadlinesPartiallyAvailable ??
    (resolvedDeadlinesAvailable &&
      !(assignmentsState.available && examsState.available));
  const resolvedBudgetAvailable = budgetAvailable ?? expensesState.budgetAvailable;
  const aiIconRef = useRef<HTMLDivElement>(null);
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof navigator === "undefined") {
      return true;
    }

    return navigator.onLine;
  });
  const [pressedClassId, setPressedClassId] = useState<string | null>(null);
  const [pressedDeadlineId, setPressedDeadlineId] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.pageYOffset;
      if (aiIconRef.current) {
        aiIconRef.current.style.transform = `translateY(${scrolled * 0.1}px)`;
      }
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleNavigate = (
    targetId: string,
    route: "/schedule" | "/assignments" | "/exams",
    setPressedId: (value: string | null) => void,
  ) => {
    setPressedId(targetId);
    window.setTimeout(() => {
      setPressedId(null);
      router.push(route);
    }, 100);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap');
        .glass-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
        .academic-shadow {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
      `}</style>

      <div
        style={{
          fontFamily: "'Inter', sans-serif",
          backgroundColor: "#f8f9fa",
          color: "#191c1d",
          minHeight: "100dvh",
        }}
      >
        <PageHeader
          className="sticky top-0 z-50 bg-[#f8f9fa]"
          contentClassName="flex justify-between items-center px-4 py-4 w-full"
          title="Hi, Juan"
          subtitle="Wednesday, June 3"
          leading={
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "9999px",
                overflow: "hidden",
                backgroundColor: "#e1e3e4",
                border: "1px solid #c2c6d6",
                flexShrink: 0,
              }}
            >
              <img
                alt="Juan's Avatar"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBi6bUWVAa9B1N0mhWR0j7Pjd27lA5Kd1VOymbLeUpxWqzX59u-1oHMevqXkmOFnfrLItuF9Jg5D_GXg3pbLsYrg2DUS0pcA7eJVGZ9kddm7vFvjDGD41Aeqh-yUQcs244nEB6HpPJ2Mwm2AIJaVTJZUOwgbS-qKfqknRKyJKEurmqaHhqPiXCChlLB5jcXDN0w_cx6lVMlNxeCQIK_9Udb6mkj-0jbvZH26JM1bHhM_aQW6vPLntdZNcCBPIVRADtndQmvrtLl3Wg"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          }
          titleWrapperClassName="flex flex-col"
          titleClassName="m-0 text-2xl font-semibold leading-8 text-[#3B82F6]"
          subtitleClassName="text-sm font-semibold leading-5 text-[#424754]"
          trailing={
            <button
              type="button"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "8px",
                borderRadius: "9999px",
                transition: "opacity 0.15s",
              }}
              onMouseOver={(event) => {
                event.currentTarget.style.opacity = "0.8";
              }}
              onMouseOut={(event) => {
                event.currentTarget.style.opacity = "1";
              }}
            >
              <Icon name="notifications" style={{ color: "#424754" }} />
            </button>
          }
        />

        <main
          style={{
            padding: "16px 16px 96px",
            maxWidth: "896px",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          <section
            className="glass-card academic-shadow"
            style={{
              border: "1px solid rgba(59, 130, 246, 0.2)",
              borderRadius: "12px",
              padding: "20px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                padding: "8px",
              }}
            >
              <div ref={aiIconRef}>
                <Icon
                  name={isOnline ? "smart_toy" : "cloud_off"}
                  style={{
                    color: isOnline ? "#3B82F6" : "#424754",
                    opacity: 0.2,
                    fontSize: "60px",
                    display: "block",
                    userSelect: "none",
                  }}
                />
              </div>
            </div>
            <div style={{ position: "relative", zIndex: 10 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "8px",
                }}
              >
                <Icon
                  name={isOnline ? "auto_awesome" : "wifi_off"}
                  style={{ color: isOnline ? "#3B82F6" : "#424754" }}
                />
                <h2
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: isOnline ? "#3B82F6" : "#424754",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    margin: 0,
                  }}
                >
                  {isOnline ? "AI Suggests" : "Offline AI"}
                </h2>
              </div>
              <p
                style={{
                  fontSize: "24px",
                  lineHeight: "32px",
                  fontWeight: 600,
                  color: "#191c1d",
                  margin: 0,
                }}
              >
                {isOnline ? (
                  <>
                    Start{" "}
                    <span style={{ color: "#3B82F6" }}>Research Paper</span>{" "}
                    today - due in 2 days.
                  </>
                ) : (
                  <>
                    Offline - <span style={{ color: "#424754" }}>AI features</span>{" "}
                    need internet.
                  </>
                )}
              </p>
            </div>
          </section>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "16px",
            }}
          >
            <section
              className="academic-shadow"
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #c2c6d6",
                borderRadius: "12px",
                padding: "20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "16px",
                }}
              >
                <h3
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#424754",
                    margin: 0,
                  }}
                >
                  <Icon name="menu_book" style={{ color: "#0058be" }} />
                  TODAY&apos;S CLASSES
                </h3>
                <span
                  style={{
                    color: "#10B981",
                    fontSize: "12px",
                    fontWeight: 500,
                    backgroundColor: "rgba(110, 248, 187, 0.3)",
                    padding: "4px 8px",
                    borderRadius: "9999px",
                  }}
                >
                  {todayClasses.length} Session{todayClasses.length === 1 ? "" : "s"}
                </span>
              </div>
              {!resolvedScheduleAvailable ? (
                <DashboardSectionFallback
                  icon="cloud_off"
                  title="Classes are unavailable"
                  message="We could not load today's schedule right now, but the dashboard is still available."
                />
              ) : todayClasses.length > 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  {todayClasses.map(({ id, timeLabel, subject, locationLabel }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        handleNavigate(id, "/schedule", setPressedClassId);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px",
                        borderRadius: "8px",
                        backgroundColor: "#f3f4f5",
                        border: "1px solid transparent",
                        cursor: "pointer",
                        transition: "border-color 0.2s, transform 0.1s",
                        transform:
                          pressedClassId === id ? "scale(0.98)" : "scale(1)",
                      }}
                      onMouseOver={(event) => {
                        event.currentTarget.style.borderColor = "#3B82F6";
                      }}
                      onMouseOut={(event) => {
                        event.currentTarget.style.borderColor = "transparent";
                      }}
                    >
                      <div style={{ display: "flex", gap: "12px" }}>
                        <div
                          style={{
                            color: "#3B82F6",
                            fontWeight: "bold",
                            textAlign: "center",
                          }}
                        >
                          <span
                            style={{
                              display: "block",
                              fontSize: "10px",
                              textTransform: "uppercase",
                              opacity: 0.6,
                            }}
                          >
                            Start
                          </span>
                          {timeLabel}
                        </div>
                        <div style={{ textAlign: "left" }}>
                          <h4
                            style={{
                              fontSize: "14px",
                              fontWeight: 600,
                              margin: 0,
                            }}
                          >
                            {subject}
                          </h4>
                          <p
                            style={{
                              fontSize: "12px",
                              color: "#424754",
                              margin: 0,
                            }}
                          >
                            {locationLabel}
                          </p>
                        </div>
                      </div>
                      <Icon
                        name="chevron_right"
                        style={{ color: "#424754", fontSize: "18px" }}
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <DashboardSectionFallback
                  icon="calendar_month"
                  title="No classes today"
                  message="Your next class blocks will show here once today's schedule is available."
                />
              )}
            </section>

            <section
              className="academic-shadow"
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #c2c6d6",
                borderRadius: "12px",
                padding: "20px",
              }}
            >
              <h3
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#424754",
                  margin: "0 0 16px 0",
                }}
              >
                <Icon name="assignment_late" style={{ color: "#ba1a1a" }} />
                UPCOMING DEADLINES
              </h3>
              {!resolvedDeadlinesAvailable ? (
                <DashboardSectionFallback
                  icon="assignment_late"
                  title="Deadlines are unavailable"
                  message="We could not load your deadlines right now, but the rest of the dashboard is still ready."
                />
              ) : upcomingDeadlines.length > 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {resolvedDeadlinesPartiallyAvailable ? (
                    <div className="rounded-xl border border-[#ffddb8] bg-[#fff8f1] px-4 py-3 text-left text-sm font-medium text-[#825100] shadow-sm">
                      Some deadlines may be missing right now, but available items
                      are still shown below.
                    </div>
                  ) : null}
                  {upcomingDeadlines.map((deadline) => (
                    <button
                      key={deadline.id}
                      type="button"
                      onClick={() => {
                        handleNavigate(
                          deadline.id,
                          deadline.href,
                          setPressedDeadlineId,
                        );
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                        padding: "16px",
                        borderRadius: "12px",
                        backgroundColor:
                          deadline.tone === "danger"
                            ? "rgba(255, 218, 214, 0.2)"
                            : "#f3f4f5",
                        borderLeft:
                          deadline.tone === "danger"
                            ? "4px solid #ba1a1a"
                            : "4px solid #c2c6d6",
                        borderTop: "none",
                        borderRight: "none",
                        borderBottom: "none",
                        cursor: "pointer",
                        textAlign: "left",
                        transform:
                          pressedDeadlineId === deadline.id
                            ? "scale(0.98)"
                            : "scale(1)",
                        transition: "transform 0.1s",
                      }}
                      >
                      <Icon
                        name={
                          deadline.tone === "danger"
                            ? "warning"
                            : deadline.kind === "exam"
                              ? "quiz"
                              : "assignment"
                        }
                        filled={deadline.tone === "danger"}
                        style={{
                          color:
                            deadline.tone === "danger" ? "#ba1a1a" : "#424754",
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <h4
                          style={{
                            fontSize: "14px",
                            fontWeight: 600,
                            margin: 0,
                            color: "#191c1d",
                          }}
                        >
                          {deadline.title}
                        </h4>
                        <p
                          style={{
                            fontSize: "12px",
                            color:
                              deadline.tone === "danger"
                                ? "#ba1a1a"
                                : "#424754",
                            fontWeight: deadline.tone === "danger" ? 600 : 500,
                            margin: 0,
                          }}
                        >
                          {deadline.dueLabel}
                        </p>
                      </div>
                    </button>
                  ))}

                  <div
                    style={{
                      height: "48px",
                      border: "2px dashed rgba(194, 198, 214, 0.3)",
                      borderRadius: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#424754",
                        opacity: 0.5,
                        fontStyle: "italic",
                      }}
                    >
                      + Add Task
                    </span>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {resolvedDeadlinesPartiallyAvailable ? (
                    <div className="rounded-xl border border-[#ffddb8] bg-[#fff8f1] px-4 py-3 text-left text-sm font-medium text-[#825100] shadow-sm">
                      Some deadlines may be missing right now, but no upcoming items
                      are available from the data we could load.
                    </div>
                  ) : null}
                  <DashboardSectionFallback
                    icon="task_alt"
                    title="No deadlines in the next 7 days"
                    message="You're clear for now. New upcoming work will appear here automatically."
                  />
                </div>
              )}
            </section>

            {resolvedBudgetAvailable && resolvedBudget ? (
              <BudgetProgressCard variant="dashboard" budget={resolvedBudget} />
            ) : (
              <section
                className="academic-shadow"
                style={{
                  gridColumn: "1 / -1",
                  backgroundColor: "#ffffff",
                  border: "1px solid #c2c6d6",
                  borderRadius: "12px",
                  padding: "20px",
                }}
              >
                <h3
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#424754",
                    margin: "0 0 16px 0",
                  }}
                >
                  <Icon
                    name="account_balance_wallet"
                    style={{ color: "#10B981" }}
                  />
                  BUDGET STATUS
                </h3>
                <DashboardSectionFallback
                  icon={resolvedBudgetAvailable ? "wallet" : "sync_problem"}
                  title={
                    resolvedBudgetAvailable
                      ? "No budget set yet"
                      : "Budget could not be loaded"
                  }
                  message={
                    resolvedBudgetAvailable
                      ? "Create an active budget cycle to see your allowance summary here."
                      : "We couldn't render your budget summary right now, but the rest of the dashboard is still working."
                  }
                />
              </section>
            )}

            <section
              style={{
                gridColumn: "1 / -1",
                display: "flex",
                flexWrap: "wrap",
                gap: "16px",
              }}
            >
              <div
                className="glass-card"
                style={{
                  flex: "1 1 200px",
                  padding: "16px",
                  borderRadius: "12px",
                  border: "1px solid rgba(194, 198, 214, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                }}
              >
                <div
                  style={{
                    padding: "12px",
                    backgroundColor: "rgba(59, 130, 246, 0.1)",
                    borderRadius: "8px",
                  }}
                >
                  <Icon name="trending_up" style={{ color: "#3B82F6" }} />
                </div>
                <div>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#424754",
                      margin: 0,
                    }}
                  >
                    Attendance Rate
                  </p>
                  <h4
                    style={{
                      fontSize: "24px",
                      fontWeight: 600,
                      margin: 0,
                    }}
                  >
                    94%
                  </h4>
                </div>
              </div>

              <div
                className="glass-card"
                style={{
                  flex: "1 1 200px",
                  padding: "16px",
                  borderRadius: "12px",
                  border: "1px solid rgba(194, 198, 214, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                }}
              >
                <div
                  style={{
                    padding: "12px",
                    backgroundColor: "rgba(255, 185, 95, 0.2)",
                    borderRadius: "8px",
                  }}
                >
                  <Icon name="timer" style={{ color: "#825100" }} />
                </div>
                <div>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#424754",
                      margin: 0,
                    }}
                  >
                    Study Goal
                  </p>
                  <h4
                    style={{
                      fontSize: "24px",
                      fontWeight: 600,
                      margin: 0,
                    }}
                  >
                    12h / 20h
                  </h4>
                </div>
              </div>
            </section>
          </div>
        </main>

        <button
          type="button"
          style={{
            position: "fixed",
            bottom: "96px",
            right: "24px",
            width: "56px",
            height: "56px",
            backgroundColor: "#0058be",
            color: "#ffffff",
            borderRadius: "9999px",
            boxShadow: "0 8px 24px rgba(0,88,190,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            cursor: "pointer",
            zIndex: 40,
            transition: "transform 0.15s",
          }}
          onMouseOver={(event) => {
            event.currentTarget.style.transform = "scale(1.05)";
          }}
          onMouseOut={(event) => {
            event.currentTarget.style.transform = "scale(1)";
          }}
          onMouseDown={(event) => {
            event.currentTarget.style.transform = "scale(0.95)";
          }}
          onMouseUp={(event) => {
            event.currentTarget.style.transform = "scale(1.05)";
          }}
        >
          <Icon name="add" className="text-[28px] text-white" />
        </button>
      </div>
    </>
  );
}
