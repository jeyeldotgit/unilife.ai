"use client";

import type { CSSProperties } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  completeOnboardingAction,
  saveOnboardingBudgetAction,
} from "@/actions/onboarding";
import { Icon } from "@/components/ui/Icon";
import type {
  BudgetPeriod,
  DayOfWeek,
  OnboardingStarterAssignmentInput,
  OnboardingStarterClassInput,
} from "@/lib/types";

const FREQUENCIES = ["Weekly", "Bi-Weekly", "Monthly"] as const;

type Frequency = (typeof FREQUENCIES)[number];
type Step = "budget" | "academic";
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

const dayLookup: Record<string, DayOfWeek> = {
  mon: "monday",
  monday: "monday",
  tue: "tuesday",
  tues: "tuesday",
  tuesday: "tuesday",
  wed: "wednesday",
  wednesday: "wednesday",
  thu: "thursday",
  thur: "thursday",
  thurs: "thursday",
  thursday: "thursday",
  fri: "friday",
  friday: "friday",
  sat: "saturday",
  saturday: "saturday",
  sun: "sunday",
  sunday: "sunday",
};

function toBudgetPeriod(frequency: Frequency): BudgetPeriod {
  if (frequency === "Weekly") {
    return "weekly";
  }

  if (frequency === "Bi-Weekly") {
    return "biweekly";
  }

  return "monthly";
}

function to24HourTime(value: string) {
  const trimmed = value.trim();
  const twelveHourMatch = trimmed.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);

  if (twelveHourMatch) {
    let hour = Number.parseInt(twelveHourMatch[1], 10);
    const minute = Number.parseInt(twelveHourMatch[2] ?? "0", 10);
    const meridiem = twelveHourMatch[3].toUpperCase();

    if (hour < 1 || hour > 12 || minute < 0 || minute > 59) {
      return null;
    }

    if (meridiem === "PM" && hour < 12) {
      hour += 12;
    }

    if (meridiem === "AM" && hour === 12) {
      hour = 0;
    }

    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }

  const twentyFourHourMatch = trimmed.match(/^(\d{1,2}):(\d{2})$/);

  if (!twentyFourHourMatch) {
    return null;
  }

  const hour = Number.parseInt(twentyFourHourMatch[1], 10);
  const minute = Number.parseInt(twentyFourHourMatch[2], 10);

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function addMinutesToTime(time: string, minutesToAdd: number) {
  const [hour, minute] = time.split(":").map((value) => Number.parseInt(value, 10));
  const totalMinutes = hour * 60 + minute + minutesToAdd;
  const nextHour = Math.floor(totalMinutes / 60) % 24;
  const nextMinute = totalMinutes % 60;

  return `${String(nextHour).padStart(2, "0")}:${String(nextMinute).padStart(2, "0")}`;
}

function parseDays(value: string) {
  const tokens = value
    .toLowerCase()
    .replace(/and/g, " ")
    .split(/[^a-z]+/)
    .filter(Boolean);
  const days: DayOfWeek[] = [];

  for (const token of tokens) {
    const mapped = dayLookup[token];

    if (mapped && !days.includes(mapped)) {
      days.push(mapped);
    }
  }

  return days;
}

function parseDueDateInput(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const directParse = new Date(trimmed);

  if (Number.isFinite(directParse.getTime())) {
    return directParse.toISOString();
  }

  const withYear = new Date(`${trimmed}, ${new Date().getFullYear()}`);

  if (Number.isFinite(withYear.getTime())) {
    return withYear.toISOString();
  }

  return null;
}

function buildStarterClassInput(
  classForm: ClassForm,
): OnboardingStarterClassInput | null {
  const subject = classForm.subject.trim();
  const days = parseDays(classForm.days);
  const startTime = to24HourTime(classForm.time);

  if (!subject && !classForm.days.trim() && !classForm.time.trim()) {
    return null;
  }

  if (!subject || days.length === 0 || !startTime) {
    return null;
  }

  return {
    subject,
    days,
    startTime,
    endTime: addMinutesToTime(startTime, 90),
  };
}

function buildStarterAssignmentInput(
  taskForm: TaskForm,
  starterClass: OnboardingStarterClassInput | null,
): OnboardingStarterAssignmentInput | null {
  const title = taskForm.name.trim();
  const dueAt = parseDueDateInput(taskForm.dueDate);

  if (!title && !taskForm.dueDate.trim()) {
    return null;
  }

  if (!title || !dueAt) {
    return null;
  }

  return {
    title,
    dueAt,
    subject: starterClass?.subject,
  };
}

export default function OnboardingClient() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("budget");
  const [selectedFreq, setSelectedFreq] = useState<Frequency>("Weekly");
  const [amount, setAmount] = useState("");
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const inputStyle = (fieldId: string): CSSProperties => ({
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

  const handleBack = () => {
    setErrorMessage(null);

    if (step === "academic") {
      setStep("budget");
      return;
    }

    router.push("/register");
  };

  const handleBudgetContinue = async () => {
    const numericAmount = Number.parseFloat(amount.replace(/,/g, ""));

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setErrorMessage("Enter a valid allowance amount to continue.");
      return;
    }

    setSubmitState("loading");
    setErrorMessage(null);

    const result = await saveOnboardingBudgetAction({
      period: toBudgetPeriod(selectedFreq),
      amount: numericAmount,
    });

    if (!result.ok) {
      setSubmitState("idle");
      setErrorMessage(result.error ?? "We could not save your budget right now.");
      return;
    }

    setSubmitState("idle");
    setStep("academic");
  };

  const handleFinish = async () => {
    const starterClass = buildStarterClassInput(classForm);
    const starterAssignment = buildStarterAssignmentInput(taskForm, starterClass);
    const touchedClassFields =
      classForm.subject.trim().length > 0 ||
      classForm.days.trim().length > 0 ||
      classForm.time.trim().length > 0;
    const touchedTaskFields =
      taskForm.name.trim().length > 0 || taskForm.dueDate.trim().length > 0;

    if (touchedClassFields && !starterClass) {
      setErrorMessage("Enter a class subject, meeting days, and a valid start time.");
      return;
    }

    if (touchedTaskFields && !starterAssignment) {
      setErrorMessage("Enter both a task name and a valid due date, or clear the task fields.");
      return;
    }

    if (!starterClass && !starterAssignment) {
      setErrorMessage("Add a starter class or task, or use Skip for now.");
      return;
    }

    setSubmitState("loading");
    setErrorMessage(null);

    const result = await completeOnboardingAction({
      starterClass,
      starterAssignment,
    });

    if (!result.ok) {
      setSubmitState("idle");
      setErrorMessage(
        result.error ?? "We could not finish onboarding right now.",
      );
      return;
    }

    setSubmitState("success");
    router.push("/dashboard");
    router.refresh();
  };

  const handleSkip = () => {
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        .glass-panel {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
        .onboarding-card {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
        .illustration-img {
          transition: transform 0.7s ease;
        }
        .illustration-wrapper:hover .illustration-img {
          transform: scale(1.05);
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
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
          overflowX: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "fixed",
            top: "-10%",
            right: "-10%",
            width: "40%",
            height: "40%",
            backgroundColor: "rgba(59, 130, 246, 0.05)",
            filter: "blur(120px)",
            borderRadius: "9999px",
            zIndex: -1,
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "fixed",
            bottom: "-10%",
            left: "-10%",
            width: "30%",
            height: "30%",
            backgroundColor: "rgba(16, 185, 129, 0.05)",
            filter: "blur(100px)",
            borderRadius: "9999px",
            zIndex: -1,
            pointerEvents: "none",
          }}
        />

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
          <header style={{ marginBottom: "40px", textAlign: "center" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <button
                type="button"
                aria-label="Go back"
                onClick={handleBack}
                style={{
                  padding: "8px",
                  borderRadius: "9999px",
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  color: "#191c1d",
                  transition: "background-color 0.2s",
                }}
                onMouseOver={(event) => {
                  event.currentTarget.style.backgroundColor = "#edeeef";
                }}
                onMouseOut={(event) => {
                  event.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <Icon name="arrow_back" />
              </button>

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
                  {step === "budget" ? "Step 2 of 3" : "Step 3 of 3"}
                </span>
                <div style={{ display: "flex", gap: "6px" }}>
                  {(step === "budget"
                    ? [false, true, false]
                    : [false, false, true]
                  ).map((active, index) => (
                    <div
                      key={index}
                      style={{
                        height: "6px",
                        width: active ? "48px" : "32px",
                        borderRadius: "9999px",
                        backgroundColor: active ? "#3B82F6" : "rgba(0,88,190,0.2)",
                      }}
                    />
                  ))}
                </div>
              </div>

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
              {step === "budget" ? "Set Up Your Budget" : "Final Touches"}
            </h1>
            <p
              style={{
                fontSize: "16px",
                lineHeight: "24px",
                color: "#6B7280",
                margin: 0,
              }}
            >
              {step === "budget"
                ? "Help us understand your finances to provide smarter suggestions."
                : "Let's populate your schedule with a sample class and task to get you started."}
            </p>
          </header>

          {errorMessage ? (
            <div className="mb-6 rounded-xl border border-[#ffdad6] bg-[#fff8f7] px-4 py-3 text-sm font-medium text-[#ba1a1a] shadow-sm">
              {errorMessage}
            </div>
          ) : null}

          {step === "budget" ? (
            <>
              <div
                className="illustration-wrapper onboarding-card"
                style={{
                  width: "100%",
                  aspectRatio: "4 / 3",
                  borderRadius: "12px",
                  overflow: "hidden",
                  marginBottom: "32px",
                  position: "relative",
                }}
              >
                <img
                  className="illustration-img"
                  alt="Budgeting Tools"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDJfX7CECpDoCuFmOntnKTSCzNqHciqSwpUKFHrjMZZyoooDjZTFBq1uSemzi91xx2osIYovIAmqNe-zPemnK03a53xASUga7YWiGXeGu3Eo3fqgiClrxYIsi_frCgYu4yTusvakVl5Iw7g3zU3jXKhER0t_ss8mA5xvwfnfQtBIi9QLGHgU1koxvkejkfmTQ-A1dYWVefYwvojOtY7cAPiePAbaScl1qiH54ZcofqH_jZmMQZQNQ-Mf9B2DLzL64F-3THmqAbFMqQ"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.4), transparent)",
                    display: "flex",
                    alignItems: "flex-end",
                    padding: "24px",
                  }}
                >
                  <div
                    className="glass-panel"
                    style={{
                      padding: "16px",
                      borderRadius: "8px",
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: "rgba(59, 130, 246, 0.1)",
                        padding: "8px",
                        borderRadius: "9999px",
                        flexShrink: 0,
                      }}
                    >
                      <Icon name="savings" className="text-[#3B82F6]" />
                    </div>
                    <div>
                      <p
                        style={{
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#191c1d",
                          margin: "0 0 2px 0",
                        }}
                      >
                        Smart Suggestion
                      </p>
                      <p
                        style={{
                          fontSize: "12px",
                          color: "#424754",
                          margin: 0,
                        }}
                      >
                        Students save more when they plan allowance by a clear cycle.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: "16px" }}
                >
                  <label
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#424754",
                      letterSpacing: "0.01em",
                    }}
                  >
                    How often do you receive your allowance?
                  </label>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: "8px",
                      backgroundColor: "#f3f4f5",
                      padding: "4px",
                      borderRadius: "12px",
                    }}
                  >
                    {FREQUENCIES.map((frequency) => {
                      const isActive = selectedFreq === frequency;

                      return (
                        <button
                          key={frequency}
                          type="button"
                          onClick={() => setSelectedFreq(frequency)}
                          style={{
                            padding: "12px",
                            borderRadius: "8px",
                            fontSize: "14px",
                            fontWeight: 600,
                            letterSpacing: "0.01em",
                            border: "none",
                            cursor: "pointer",
                            transition: "all 0.2s",
                            backgroundColor: isActive ? "#ffffff" : "transparent",
                            color: isActive ? "#3B82F6" : "#424754",
                            boxShadow: isActive ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                          }}
                        >
                          {frequency}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div
                  style={{ display: "flex", flexDirection: "column", gap: "16px" }}
                >
                  <label
                    htmlFor="budget-amount"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#424754",
                      letterSpacing: "0.01em",
                    }}
                  >
                    Budget Amount (PHP)
                    <span style={{ color: "#10B981" }}>
                      Recommended for {selectedFreq}
                    </span>
                  </label>

                  <div style={{ position: "relative" }}>
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        bottom: 0,
                        left: 0,
                        paddingLeft: "16px",
                        display: "flex",
                        alignItems: "center",
                        pointerEvents: "none",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#424754",
                        }}
                      >
                        PHP
                      </span>
                    </div>

                    <input
                      id="budget-amount"
                      name="budget-amount"
                      type="text"
                      placeholder="3,000.00"
                      value={amount}
                      onChange={(event) =>
                        setAmount(event.target.value.replace(/[^0-9.,]/g, ""))
                      }
                      style={{
                        width: "100%",
                        backgroundColor: "#ffffff",
                        border: "1px solid #c2c6d6",
                        borderRadius: "12px",
                        padding: "16px 48px 16px 56px",
                        fontSize: "24px",
                        lineHeight: "32px",
                        fontWeight: 600,
                        color: "#191c1d",
                        boxSizing: "border-box",
                        fontFamily: "'Inter', sans-serif",
                      }}
                    />

                    <div
                      style={{
                        position: "absolute",
                        right: "16px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#10B981",
                      }}
                    >
                      <Icon name="check_circle" />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    void handleBudgetContinue();
                  }}
                  disabled={submitState === "loading"}
                  style={{
                    width: "100%",
                    backgroundColor: "#3B82F6",
                    color: "#ffffff",
                    padding: "16px",
                    borderRadius: "12px",
                    fontSize: "14px",
                    fontWeight: 600,
                    letterSpacing: "0.01em",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    border: "none",
                    cursor: submitState === "loading" ? "default" : "pointer",
                    boxShadow: "0 4px 20px rgba(59, 130, 246, 0.2)",
                    transition: "opacity 0.15s, transform 0.1s",
                    fontFamily: "'Inter', sans-serif",
                    opacity: submitState === "loading" ? 0.85 : 1,
                  }}
                >
                  {submitState === "loading" ? (
                    <span className="flex items-center gap-2">
                      <Icon
                        name="sync"
                        style={{ animation: "spin 1s linear infinite" }}
                      />
                      Saving...
                    </span>
                  ) : (
                    <>
                      <span>Let&apos;s Go!</span>
                      <Icon name="arrow_forward" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSkip}
                  style={{
                    width: "100%",
                    background: "none",
                    border: "none",
                    padding: "8px",
                    fontSize: "12px",
                    fontWeight: 500,
                    color: "#424754",
                    cursor: "pointer",
                    transition: "color 0.2s",
                    fontFamily: "'Inter', sans-serif",
                  }}
                  onMouseOver={(event) => {
                    event.currentTarget.style.color = "#191c1d";
                  }}
                  onMouseOut={(event) => {
                    event.currentTarget.style.color = "#424754";
                  }}
                >
                  I&apos;ll set this up later
                </button>
              </div>
            </>
          ) : (
            <>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "24px",
                  flexGrow: 1,
                }}
              >
                <section
                  className="onboarding-card"
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
                      <Icon name="school" className="text-[#0058be]" />
                    </div>
                    <h2
                      style={{
                        fontSize: "18px",
                        fontWeight: 600,
                        color: "#111827",
                        margin: 0,
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
                        onChange={(event) =>
                          setClassForm({
                            ...classForm,
                            subject: event.target.value,
                          })
                        }
                        onFocus={() => setFocusedField("subject")}
                        onBlur={() => setFocusedField(null)}
                        style={inputStyle("subject")}
                      />
                    </div>

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
                          onChange={(event) =>
                            setClassForm({
                              ...classForm,
                              days: event.target.value,
                            })
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
                          onChange={(event) =>
                            setClassForm({
                              ...classForm,
                              time: event.target.value,
                            })
                          }
                          onFocus={() => setFocusedField("time")}
                          onBlur={() => setFocusedField(null)}
                          style={inputStyle("time")}
                        />
                      </div>
                    </div>
                  </div>
                </section>

                <section
                  style={{
                    backgroundColor: "#f3f4f5",
                    padding: "20px",
                    borderRadius: "12px",
                    border: "2px dashed #c2c6d6",
                    opacity: 0.95,
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
                        <Icon name="assignment" className="text-[#00714d]" />
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
                        onChange={(event) =>
                          setTaskForm({
                            ...taskForm,
                            name: event.target.value,
                          })
                        }
                        onFocus={() => setFocusedField("taskName")}
                        onBlur={() => setFocusedField(null)}
                        style={inputStyle("taskName")}
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
                        Due Date
                      </label>
                      <div style={{ position: "relative" }}>
                        <input
                          type="text"
                          placeholder="Select date and time"
                          value={taskForm.dueDate}
                          onChange={(event) =>
                            setTaskForm({
                              ...taskForm,
                              dueDate: event.target.value,
                            })
                          }
                          onFocus={() => setFocusedField("dueDate")}
                          onBlur={() => setFocusedField(null)}
                          style={{
                            ...inputStyle("dueDate"),
                            paddingLeft: "44px",
                          }}
                        />
                        <span
                          style={{
                            position: "absolute",
                            left: "16px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: "#424754",
                            pointerEvents: "none",
                          }}
                        >
                          <Icon name="event" />
                        </span>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              <footer
                style={{
                  marginTop: "48px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    void handleFinish();
                  }}
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
                >
                  {submitState === "loading" ? (
                    <>
                      <Icon
                        name="sync"
                        style={{ animation: "spin 1s linear infinite" }}
                      />
                      <span>Preparing Dashboard...</span>
                    </>
                  ) : submitState === "success" ? (
                    <span>Success!</span>
                  ) : (
                    <>
                      <span>Finish Setup</span>
                      <Icon name="arrow_forward" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSkip}
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
                  onMouseOver={(event) => {
                    event.currentTarget.style.color = "#191c1d";
                  }}
                  onMouseOut={(event) => {
                    event.currentTarget.style.color = "#6B7280";
                  }}
                >
                  Skip for now
                </button>
              </footer>
            </>
          )}
        </main>
      </div>
    </>
  );
}
