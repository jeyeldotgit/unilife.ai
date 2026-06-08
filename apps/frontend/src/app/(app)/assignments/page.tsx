"use client";

import { useState } from "react";

type FilterTab = "All" | "Pending" | "Done";

type Assignment = {
  id: number;
  title: string;
  subject: string;
  date: string;
  icon: string;
  iconColor: string;
  status: "pending" | "done";
  urgency: {
    label: string;
    icon: string;
    bgColor: string;
    textColor: string;
  };
};

const ASSIGNMENTS: Assignment[] = [
  {
    id: 1,
    title: "Research Paper",
    subject: "Math 101",
    date: "Jun 5",
    icon: "description",
    iconColor: "#0058be",
    status: "pending",
    urgency: {
      label: "DUE IN 2 DAYS",
      icon: "schedule",
      bgColor: "#ffdad6",
      textColor: "#ba1a1a",
    },
  },
  {
    id: 2,
    title: "Book Report",
    subject: "No class",
    date: "Jun 12",
    icon: "book",
    iconColor: "#825100",
    status: "pending",
    urgency: {
      label: "DUE IN 9 DAYS",
      icon: "event",
      bgColor: "#ffddb8",
      textColor: "#653e00",
    },
  },
  {
    id: 3,
    title: "Lab Report",
    subject: "Bio 101",
    date: "Jun 1",
    icon: "science",
    iconColor: "#10B981",
    status: "done",
    urgency: {
      label: "COMPLETED",
      icon: "check_circle",
      bgColor: "#6cf8bb",
      textColor: "#00714d",
    },
  },
];

export default function AssignmentsPage() {
  const [activeFilter, setActiveFilter] = useState<FilterTab>("All");
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set());

  const toggleCheck = (id: number) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filtered = ASSIGNMENTS.filter((a) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Pending") return a.status === "pending";
    if (activeFilter === "Done") return a.status === "done";
    return true;
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        .academic-card {
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          transition: border-color 0.2s;
        }
        .academic-card:hover {
          border-color: #3B82F6 !important;
        }
        .check-circle:hover {
          border-color: #3B82F6 !important;
        }
        .filter-tabs::-webkit-scrollbar { display: none; }
        .filter-tabs { scrollbar-width: none; }
        .focus-card-blob {
          transition: transform 0.7s ease;
        }
        .focus-card:hover .focus-card-blob {
          transform: scale(1.5);
        }
      `}</style>

      <div
        style={{
          fontFamily: "'Inter', sans-serif",
          backgroundColor: "#f8f9fa",
          color: "#191c1d",
          minHeight: "100dvh",
          paddingBottom: "96px",
          WebkitFontSmoothing: "antialiased",
        }}
      >
        {/* TopAppBar */}
        <header
          style={{
            background: "rgba(248,249,250,0.8)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            position: "sticky",
            top: 0,
            zIndex: 40,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <img
                alt="User Profile Picture"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDC2kYCxJ3KzGZsUOoiFILnLBTDX6njkmIJaPO8xHj30wLChReouRi33jnXUipuMGWSgbnmQZI0Ok1wFkjldfYpuKX-tzGPk8r4DgztV6uHdQx8Busd9cUiN5xlWsjgLbTMAJ3iCJLNCu9KDejptW6ZI5QO6FgMN3mKkLrp9Uu8SboBTwZnWNduK01MXoeTgmwMU_06xELSyn6WLC7PVqoJD2LDUOLOpJiOa6GPz6tjFRCQjW1hBIBTuAQsauIRtGt7UZAQKt9DYXA"
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "9999px",
                  border: "2px solid rgba(0,88,190,0.1)",
                  objectFit: "cover",
                  flexShrink: 0,
                }}
              />
              <div>
                <h1
                  style={{
                    color: "#3B82F6",
                    fontSize: "24px",
                    lineHeight: "32px",
                    fontWeight: 700,
                    margin: 0,
                  }}
                >
                  Hi, Alex
                </h1>
                <p
                  style={{
                    fontSize: "12px",
                    fontWeight: 500,
                    color: "#424754",
                    margin: 0,
                  }}
                >
                  Stay organized today
                </p>
              </div>
            </div>
            <button
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#3B82F6",
                padding: "4px",
                transition: "opacity 0.15s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = "0.8")}
              onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <span className="material-symbols-outlined">notifications</span>
            </button>
          </div>
        </header>

        {/* Main */}
        <main
          style={{
            padding: "24px 16px 0",
            maxWidth: "672px",
            margin: "0 auto",
          }}
        >
          {/* Assignments Hero */}
          <section style={{ marginBottom: "32px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "24px",
              }}
            >
              <h2
                style={{
                  fontSize: "28px",
                  lineHeight: "34px",
                  fontWeight: 700,
                  margin: 0,
                }}
              >
                Assignments
              </h2>
              <div
                style={{
                  backgroundColor: "#d8e2ff",
                  color: "#001a42",
                  padding: "4px 12px",
                  borderRadius: "9999px",
                  fontSize: "12px",
                  fontWeight: 500,
                }}
              >
                3 Active
              </div>
            </div>

            {/* Filter Tabs */}
            <div
              className="filter-tabs"
              style={{
                display: "flex",
                gap: "8px",
                overflowX: "auto",
                paddingBottom: "8px",
              }}
            >
              {(["All", "Pending", "Done"] as FilterTab[]).map((tab) => {
                const isActive = activeFilter === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveFilter(tab)}
                    style={{
                      backgroundColor: isActive ? "#2170e4" : "#e7e8e9",
                      color: isActive ? "#fefcff" : "#424754",
                      padding: "8px 24px",
                      borderRadius: "9999px",
                      fontSize: "14px",
                      fontWeight: 600,
                      letterSpacing: "0.01em",
                      border: "none",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      transition: "all 0.2s",
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Assignment List */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {filtered.map((assignment) => {
              const isDone = assignment.status === "done";
              const isChecked = checkedIds.has(assignment.id);

              return (
                <div
                  key={assignment.id}
                  className="academic-card"
                  style={{
                    backgroundColor: isDone ? "#f3f4f5" : "#ffffff",
                    border: `1px solid ${isDone ? "rgba(194,198,214,0.3)" : "#c2c6d6"}`,
                    padding: "20px",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    opacity: isDone || isChecked ? 0.8 : 1,
                    transition: "opacity 0.2s",
                  }}
                >
                  {/* Left side */}
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
                      <span
                        className="material-symbols-outlined"
                        style={{
                          color: assignment.iconColor,
                          fontSize: "20px",
                        }}
                      >
                        {assignment.icon}
                      </span>
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
                      <span>{assignment.date}</span>
                    </div>

                    {/* Urgency badge */}
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
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: "14px" }}
                      >
                        {assignment.urgency.icon}
                      </span>
                      {assignment.urgency.label}
                    </div>
                  </div>

                  {/* Right side */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: "12px",
                    }}
                  >
                    {isDone ? (
                      <div
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "9999px",
                          backgroundColor: "#10B981",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{
                            color: "#ffffff",
                            fontSize: "16px",
                            fontVariationSettings: "'FILL' 1",
                          }}
                        >
                          check
                        </span>
                      </div>
                    ) : (
                      <div
                        className="check-circle"
                        onClick={() => toggleCheck(assignment.id)}
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "9999px",
                          border: `2px solid ${isChecked ? "#3B82F6" : "#c2c6d6"}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          transition: "border-color 0.2s",
                          backgroundColor: isChecked
                            ? "rgba(59,130,246,0.1)"
                            : "transparent",
                        }}
                      >
                        {isChecked && (
                          <div
                            style={{
                              width: "12px",
                              height: "12px",
                              borderRadius: "9999px",
                              backgroundColor: "#0058be",
                            }}
                          />
                        )}
                      </div>
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
            })}
          </div>

          {/* AI Productivity + Stats Bento */}
          <div
            style={{
              marginTop: "32px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "16px",
            }}
          >
            {/* Focus Session Card */}
            <div
              className="focus-card"
              style={{
                backgroundColor: "#0058be",
                color: "#ffffff",
                padding: "20px",
                borderRadius: "12px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: "160px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div style={{ position: "relative", zIndex: 1 }}>
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: "32px",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  bolt
                </span>
                <h4
                  style={{
                    fontSize: "24px",
                    lineHeight: "32px",
                    fontWeight: 600,
                    margin: 0,
                  }}
                >
                  Focus Session Recommended
                </h4>
                <p
                  style={{
                    fontSize: "12px",
                    fontWeight: 500,
                    marginTop: "8px",
                    opacity: 0.9,
                  }}
                >
                  Start a 45min deep work for Math 101 paper.
                </p>
              </div>
              <button
                style={{
                  position: "relative",
                  zIndex: 1,
                  marginTop: "16px",
                  backgroundColor: "rgba(255,255,255,0.2)",
                  color: "#ffffff",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  alignSelf: "flex-start",
                  backdropFilter: "blur(8px)",
                  transition: "background-color 0.2s",
                  fontFamily: "'Inter', sans-serif",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    "rgba(255,255,255,0.3)")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    "rgba(255,255,255,0.2)")
                }
              >
                Start Now
              </button>

              {/* Decorative blob */}
              <div
                className="focus-card-blob"
                style={{
                  position: "absolute",
                  right: "-16px",
                  bottom: "-16px",
                  width: "96px",
                  height: "96px",
                  backgroundColor: "rgba(255,255,255,0.1)",
                  borderRadius: "9999px",
                  filter: "blur(16px)",
                }}
              />
            </div>

            {/* Completion Rate Card */}
            <div
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #c2c6d6",
                padding: "20px",
                borderRadius: "12px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
            >
              <div>
                <h4
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#191c1d",
                    margin: "0 0 8px 0",
                    letterSpacing: "0.01em",
                  }}
                >
                  Completion Rate
                </h4>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: "8px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "40px",
                      lineHeight: "48px",
                      fontWeight: 700,
                      letterSpacing: "-0.02em",
                      color: "#3B82F6",
                    }}
                  >
                    68%
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 500,
                      color: "#10B981",
                      paddingBottom: "8px",
                    }}
                  >
                    +12% this week
                  </span>
                </div>
              </div>
              <div
                style={{
                  width: "100%",
                  backgroundColor: "#edeeef",
                  height: "8px",
                  borderRadius: "9999px",
                  overflow: "hidden",
                  marginTop: "16px",
                }}
              >
                <div
                  style={{
                    backgroundColor: "#10B981",
                    height: "100%",
                    width: "68%",
                    borderRadius: "9999px",
                  }}
                />
              </div>
            </div>
          </div>
        </main>

        {/* FAB */}
        <div
          style={{
            position: "fixed",
            bottom: "96px",
            right: "24px",
            zIndex: 50,
          }}
        >
          <button
            style={{
              width: "56px",
              height: "56px",
              backgroundColor: "#0058be",
              color: "#ffffff",
              borderRadius: "9999px",
              boxShadow: "0 4px 16px rgba(0,88,190,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
              cursor: "pointer",
              transition: "transform 0.2s",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.transform = "scale(1.05)")
            }
            onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
            onMouseDown={(e) =>
              (e.currentTarget.style.transform = "scale(0.9)")
            }
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "28px" }}
            >
              add
            </span>
          </button>
        </div>

      </div>
    </>
  );
}
