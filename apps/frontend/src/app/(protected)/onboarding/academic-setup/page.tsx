"use client";

import { useState } from "react";

type SubmitState = "idle" | "loading" | "success";

type ClassForm = {
  subject: string;
  days: string;
  time: string;
};

type TaskForm = {
  name: string;
  dueDate: string;
};

export default function AcademicSetupPage() {
  const [classForm, setClassForm] = useState<ClassForm>({
    subject: "Math 101",
    days: "Tue/Thu",
    time: "8:00 AM",
  });
  const [taskForm, setTaskForm] = useState<TaskForm>({
    name: "Research Paper",
    dueDate: "Jun 12, 11:59 PM",
  });
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleFinish = () => {
    if (submitState !== "idle") return;
    setSubmitState("loading");
    setTimeout(() => {
      setSubmitState("success");
      // Router push would go here: router.push('/dashboard')
    }, 1500);
  };

  const inputStyle = (fieldId: string): React.CSSProperties => ({
    width: "100%",
    padding: "12px 16px",
    borderRadius: "12px",
    border: `1px solid ${focusedField === fieldId ? "#3B82F6" : "#c2c6d6"}`,
    boxShadow: focusedField === fieldId ? "0 0 0 1px #3B82F6" : "none",
    outline: "none",
    fontSize: "16px",
    lineHeight: "24px",
    fontWeight: 400,
    backgroundColor: "#ffffff",
    color: "#191c1d",
    fontFamily: "'Inter', sans-serif",
    transition: "border-color 0.2s, box-shadow 0.2s, transform 0.15s",
    transform: focusedField === fieldId ? "scale(1.01)" : "scale(1)",
    boxSizing: "border-box",
  });

  const renderFinishButton = () => {
    if (submitState === "loading") {
      return (
        <>
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: "18px",
              animation: "spin 1s linear infinite",
            }}
          >
            sync
          </span>
          <span>Preparing Dashboard...</span>
        </>
      );
    }
    if (submitState === "success") {
      return <span>Success!</span>;
    }
    return (
      <>
        <span>Finish Setup</span>
        <span
          className="material-symbols-outlined"
          style={{ fontSize: "18px" }}
        >
          arrow_forward
        </span>
      </>
    );
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        .academic-card {
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .task-section:hover {
          opacity: 1 !important;
        }
      `}</style>

      <div
        style={{
          fontFamily: "'Inter', sans-serif",
          backgroundColor: "#f8f9fa",
          color: "#191c1d",
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background blobs */}
        <div
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            zIndex: -1,
            opacity: 0.2,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              width: "256px",
              height: "256px",
              backgroundColor: "#3B82F6",
              filter: "blur(100px)",
              borderRadius: "9999px",
              transform: "translate(80px, -80px)",
            }}
          />
        </div>
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            zIndex: -1,
            opacity: 0.2,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              width: "320px",
              height: "320px",
              backgroundColor: "#10B981",
              filter: "blur(120px)",
              borderRadius: "9999px",
              transform: "translate(-128px, 128px)",
            }}
          />
        </div>

        {/* Onboarding Container */}
        <main
          style={{
            width: "100%",
            maxWidth: "448px",
            padding: "32px 16px",
            display: "flex",
            flexDirection: "column",
            minHeight: "100dvh",
            boxSizing: "border-box",
          }}
        >
          {/* Header & Progress */}
          <header style={{ marginBottom: "40px", textAlign: "center" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              {/* Back button */}
              <button
                aria-label="Go back"
                style={{
                  padding: "8px",
                  borderRadius: "9999px",
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  color: "#191c1d",
                  transition: "background-color 0.2s",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.backgroundColor = "#edeeef")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </button>

              {/* Step indicator */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 500,
                    color: "#6B7280",
                    marginBottom: "8px",
                  }}
                >
                  Step 3 of 3
                </span>
                <div style={{ display: "flex", gap: "6px" }}>
                  {[false, false, true].map((active, i) => (
                    <div
                      key={i}
                      style={{
                        height: "6px",
                        width: active ? "48px" : "32px",
                        borderRadius: "9999px",
                        backgroundColor: active
                          ? "#3B82F6"
                          : "rgba(0,88,190,0.2)",
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Spacer */}
              <div style={{ width: "40px" }} />
            </div>

            <h1
              style={{
                fontSize: "28px",
                lineHeight: "34px",
                fontWeight: 700,
                color: "#111827",
                margin: "0 0 8px 0",
              }}
            >
              Final Touches
            </h1>
            <p
              style={{
                fontSize: "16px",
                lineHeight: "24px",
                color: "#6B7280",
                margin: 0,
              }}
            >
              Let&apos;s populate your schedule with a sample class and task to get
              you started.
            </p>
          </header>

          {/* Form Sections */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "24px",
              flexGrow: 1,
            }}
          >
            {/* Add First Class */}
            <section
              className="academic-card"
              style={{
                backgroundColor: "#ffffff",
                padding: "20px",
                borderRadius: "12px",
                border: "1px solid #c2c6d6",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "8px",
                    backgroundColor: "#d8e2ff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ color: "#0058be" }}
                  >
                    school
                  </span>
                </div>
                <h2
                  style={{
                    fontSize: "18px",
                    fontWeight: 600,
                    color: "#111827",
                    margin: 0,
                    lineHeight: "tight",
                  }}
                >
                  Add your first class
                </h2>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                {/* Subject */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: 600,
                      letterSpacing: "0.01em",
                      color: "#424754",
                      marginBottom: "6px",
                      marginLeft: "4px",
                    }}
                  >
                    Subject
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Psychology"
                    value={classForm.subject}
                    onChange={(e) =>
                      setClassForm({ ...classForm, subject: e.target.value })
                    }
                    onFocus={() => setFocusedField("subject")}
                    onBlur={() => setFocusedField(null)}
                    style={inputStyle("subject")}
                  />
                </div>

                {/* Days + Time grid */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "14px",
                        fontWeight: 600,
                        letterSpacing: "0.01em",
                        color: "#424754",
                        marginBottom: "6px",
                        marginLeft: "4px",
                      }}
                    >
                      Days
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Mon/Wed/Fri"
                      value={classForm.days}
                      onChange={(e) =>
                        setClassForm({ ...classForm, days: e.target.value })
                      }
                      onFocus={() => setFocusedField("days")}
                      onBlur={() => setFocusedField(null)}
                      style={inputStyle("days")}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "14px",
                        fontWeight: 600,
                        letterSpacing: "0.01em",
                        color: "#424754",
                        marginBottom: "6px",
                        marginLeft: "4px",
                      }}
                    >
                      Time
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 2:00 PM"
                      value={classForm.time}
                      onChange={(e) =>
                        setClassForm({ ...classForm, time: e.target.value })
                      }
                      onFocus={() => setFocusedField("time")}
                      onBlur={() => setFocusedField(null)}
                      style={inputStyle("time")}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Optional Task */}
            <section
              className="task-section"
              style={{
                backgroundColor: "#f3f4f5",
                padding: "20px",
                borderRadius: "12px",
                border: "2px dashed #c2c6d6",
                opacity: 0.9,
                transition: "opacity 0.2s",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "8px",
                      backgroundColor: "#6ffbbe",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ color: "#00714d" }}
                    >
                      assignment
                    </span>
                  </div>
                  <h2
                    style={{
                      fontSize: "18px",
                      fontWeight: 600,
                      color: "#111827",
                      margin: 0,
                    }}
                  >
                    Optional: add one task
                  </h2>
                </div>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 500,
                    color: "#10B981",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Recommended
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                {/* Task Name */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: 600,
                      letterSpacing: "0.01em",
                      color: "#424754",
                      marginBottom: "6px",
                      marginLeft: "4px",
                    }}
                  >
                    Task Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Finish reading Ch. 4"
                    value={taskForm.name}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, name: e.target.value })
                    }
                    onFocus={() => setFocusedField("taskName")}
                    onBlur={() => setFocusedField(null)}
                    style={inputStyle("taskName")}
                  />
                </div>

                {/* Due Date */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: 600,
                      letterSpacing: "0.01em",
                      color: "#424754",
                      marginBottom: "6px",
                      marginLeft: "4px",
                    }}
                  >
                    Due Date
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="text"
                      placeholder="Select date and time"
                      value={taskForm.dueDate}
                      onChange={(e) =>
                        setTaskForm({ ...taskForm, dueDate: e.target.value })
                      }
                      onFocus={() => setFocusedField("dueDate")}
                      onBlur={() => setFocusedField(null)}
                      style={{
                        ...inputStyle("dueDate"),
                        paddingLeft: "44px",
                      }}
                    />
                    <span
                      className="material-symbols-outlined"
                      style={{
                        position: "absolute",
                        left: "16px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#424754",
                        fontSize: "20px",
                        pointerEvents: "none",
                      }}
                    >
                      event
                    </span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Footer Actions */}
          <footer
            style={{
              marginTop: "48px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <button
              onClick={handleFinish}
              disabled={submitState !== "idle"}
              style={{
                width: "100%",
                padding: "16px",
                backgroundColor:
                  submitState === "success" ? "#10B981" : "#3B82F6",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: 600,
                letterSpacing: "0.01em",
                borderRadius: "12px",
                border: "none",
                cursor: submitState !== "idle" ? "default" : "pointer",
                boxShadow: "0 4px 20px rgba(59,130,246,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "background-color 0.3s, transform 0.1s",
                fontFamily: "'Inter', sans-serif",
              }}
              onMouseOver={(e) => {
                if (submitState === "idle")
                  e.currentTarget.style.backgroundColor = "#0058be";
              }}
              onMouseOut={(e) => {
                if (submitState === "idle")
                  e.currentTarget.style.backgroundColor = "#3B82F6";
              }}
              onMouseDown={(e) => {
                if (submitState === "idle")
                  e.currentTarget.style.transform = "scale(0.98)";
              }}
              onMouseUp={(e) => {
                if (submitState === "idle")
                  e.currentTarget.style.transform = "scale(1)";
              }}
            >
              {renderFinishButton()}
            </button>

            <button
              style={{
                width: "100%",
                padding: "12px",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 600,
                letterSpacing: "0.01em",
                color: "#6B7280",
                borderRadius: "12px",
                transition: "color 0.2s",
                fontFamily: "'Inter', sans-serif",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseOver={(e) => (e.currentTarget.style.color = "#191c1d")}
              onMouseOut={(e) => (e.currentTarget.style.color = "#6B7280")}
            >
              Skip for now
            </button>
          </footer>
        </main>
      </div>
    </>
  );
}
