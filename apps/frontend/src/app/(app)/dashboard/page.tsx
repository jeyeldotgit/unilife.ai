"use client";

import { useEffect, useRef } from "react";

export default function DashboardPage() {
  const aiIconRef = useRef<HTMLSpanElement>(null);

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

  const handleClassItemClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    target.style.transform = "scale(0.98)";
    setTimeout(() => {
      target.style.transform = "scale(1)";
    }, 100);
  };

  return (
    <>
      {/* Google Fonts */}
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
        {/* TopAppBar */}
        <header
          style={{
            backgroundColor: "#f8f9fa",
            position: "sticky",
            top: 0,
            zIndex: 50,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px",
              width: "100%",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
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
              <div style={{ display: "flex", flexDirection: "column" }}>
                <h1
                  style={{
                    color: "#3B82F6",
                    fontSize: "24px",
                    lineHeight: "32px",
                    fontWeight: 600,
                    margin: 0,
                  }}
                >
                  Hi, Juan
                </h1>
                <span
                  style={{
                    fontSize: "14px",
                    lineHeight: "20px",
                    fontWeight: 600,
                    color: "#424754",
                  }}
                >
                  Wednesday, June 3
                </span>
              </div>
            </div>
            <button
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "8px",
                borderRadius: "9999px",
                transition: "opacity 0.15s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = "0.8")}
              onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <span
                className="material-symbols-outlined"
                style={{ color: "#424754" }}
              >
                notifications
              </span>
            </button>
          </div>
        </header>

        {/* Main Content */}
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
          {/* AI Suggests Card */}
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
              <span
                ref={aiIconRef}
                className="material-symbols-outlined"
                style={{
                  color: "#3B82F6",
                  opacity: 0.2,
                  fontSize: "60px",
                  display: "block",
                  userSelect: "none",
                }}
              >
                smart_toy
              </span>
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
                <span
                  className="material-symbols-outlined"
                  style={{ color: "#3B82F6" }}
                >
                  auto_awesome
                </span>
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
                today — due in 2 days.
              </p>
            </div>
          </section>

          {/* Bento Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "16px",
            }}
          >
            {/* Today's Classes */}
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
                  <span
                    className="material-symbols-outlined"
                    style={{ color: "#0058be" }}
                  >
                    menu_book
                  </span>
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
                {[
                  {
                    time: "08:00",
                    subject: "Math 101",
                    location: "Room 3A • Building B",
                  },
                  {
                    time: "10:30",
                    subject: "Eng Lit",
                    location: "Room 12 • Library Wing",
                  },
                  {
                    time: "13:00",
                    subject: "PE",
                    location: "Gym • Sports Complex",
                  },
                ].map(({ time, subject, location }) => (
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
                    onMouseOver={(e) =>
                      (e.currentTarget.style.borderColor = "#3B82F6")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.borderColor = "transparent")
                    }
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
                    <span
                      className="material-symbols-outlined"
                      style={{ color: "#424754", fontSize: "18px" }}
                    >
                      chevron_right
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Upcoming Deadlines */}
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
                <span
                  className="material-symbols-outlined"
                  style={{ color: "#ba1a1a" }}
                >
                  assignment_late
                </span>
                UPCOMING DEADLINES
              </h3>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {/* Urgent deadline */}
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
                  <span
                    className="material-symbols-outlined"
                    style={{
                      color: "#ba1a1a",
                      fontVariationSettings: "'FILL' 1",
                    }}
                  >
                    warning
                  </span>
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

                {/* Normal deadline */}
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
                  <span
                    className="material-symbols-outlined"
                    style={{ color: "#424754" }}
                  >
                    quiz
                  </span>
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

                {/* Add Task placeholder */}
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

            {/* Budget Status — full width */}
            <section
              className="academic-shadow"
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #c2c6d6",
                borderRadius: "12px",
                padding: "20px",
                gridColumn: "1 / -1",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
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
                    <span
                      className="material-symbols-outlined"
                      style={{ color: "#10B981" }}
                    >
                      account_balance_wallet
                    </span>
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
                      ₱ 1,240
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
                    Est. lasts 4 more days
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
                        color: "#10B981",
                      }}
                    >
                      62% left
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
                        width: "62%",
                        backgroundColor: "#10B981",
                        borderRadius: "9999px",
                        transition: "width 1s ease-out",
                      }}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Stats Preview — full width */}
            <section
              style={{
                gridColumn: "1 / -1",
                display: "flex",
                flexWrap: "wrap",
                gap: "16px",
              }}
            >
              {/* Attendance Rate */}
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
                  <span
                    className="material-symbols-outlined"
                    style={{ color: "#3B82F6" }}
                  >
                    trending_up
                  </span>
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

              {/* Study Goal */}
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
                  <span
                    className="material-symbols-outlined"
                    style={{ color: "#825100" }}
                  >
                    timer
                  </span>
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

        {/* FAB */}
        <button
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
          onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
          onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
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
    </>
  );
}
