"use client";

import { useEffect, useRef, type MouseEvent } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { BudgetProgressCard } from "@/components/ui/BudgetProgressCard";
import { Icon } from "@/components/ui/Icon";
import type { BudgetStatus } from "@/lib/types";

const TODAY_CLASSES = [
  {
    time: "08:00",
    subject: "Math 101",
    location: "Room 3A \u2022 Building B",
  },
  {
    time: "10:30",
    subject: "Eng Lit",
    location: "Room 12 \u2022 Library Wing",
  },
  {
    time: "13:00",
    subject: "PE",
    location: "Gym \u2022 Sports Complex",
  },
];

const DASHBOARD_BUDGET: BudgetStatus = {
  budgetId: "dashboard-budget-preview",
  period: "weekly",
  cycleLabel: "Budget Status",
  totalAmount: 2000,
  spentAmount: 760,
  remainingAmount: 1240,
  totalLabel: "\u20b1 2,000",
  spentLabel: "\u20b1 760",
  remainingLabel: "\u20b1 1,240",
  progressPercent: 38,
  progressLabel: "38% used",
  estimatedDaysLeft: 4,
  estimateLabel: "Est. lasts 4 more days",
  tone: "healthy",
};

export default function DashboardPage() {
  const aiIconRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.pageYOffset;
      if (aiIconRef.current) {
        aiIconRef.current.style.transform = `translateY(${scrolled * 0.1}px)`;
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleClassItemClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    target.style.transform = "scale(0.98)";
    window.setTimeout(() => {
      target.style.transform = "scale(1)";
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
        .study-teal-glow {
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
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
                  name="smart_toy"
                  style={{
                    color: "#3B82F6",
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
                <Icon name="auto_awesome" style={{ color: "#3B82F6" }} />
                <h2
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#3B82F6",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    margin: 0,
                  }}
                >
                  AI Suggests
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
                Start <span style={{ color: "#3B82F6" }}>Research Paper</span>{" "}
                today - due in 2 days.
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
                  3 Sessions
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                {TODAY_CLASSES.map(({ time, subject, location }) => (
                  <div
                    key={subject}
                    onClick={handleClassItemClick}
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
                          lineHeight: "tight",
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
                        {time}
                      </div>
                      <div>
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
                          {location}
                        </p>
                      </div>
                    </div>
                    <Icon
                      name="chevron_right"
                      style={{ color: "#424754", fontSize: "18px" }}
                    />
                  </div>
                ))}
              </div>
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
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    padding: "16px",
                    borderRadius: "12px",
                    backgroundColor: "rgba(255, 218, 214, 0.2)",
                    borderLeft: "4px solid #ba1a1a",
                  }}
                >
                  <Icon
                    name="warning"
                    filled
                    style={{
                      color: "#ba1a1a",
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <h4
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        margin: 0,
                      }}
                    >
                      Research Paper
                    </h4>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#ba1a1a",
                        fontWeight: 600,
                        margin: 0,
                      }}
                    >
                      Due in 2 days
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    padding: "16px",
                    borderRadius: "12px",
                    backgroundColor: "#f3f4f5",
                    borderLeft: "4px solid #c2c6d6",
                  }}
                >
                  <Icon name="quiz" style={{ color: "#424754" }} />
                  <div style={{ flex: 1 }}>
                    <h4
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        margin: 0,
                      }}
                    >
                      Quiz Review
                    </h4>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#424754",
                        margin: 0,
                      }}
                    >
                      Due in 5 days
                    </p>
                  </div>
                </div>

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
            </section>

            <BudgetProgressCard variant="dashboard" budget={DASHBOARD_BUDGET} />

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
