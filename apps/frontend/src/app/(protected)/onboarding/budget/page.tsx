"use client";

import { useState, useRef } from "react";

const FREQUENCIES = ["Weekly", "Bi-Weekly", "Monthly"] as const;
type Frequency = (typeof FREQUENCIES)[number];

export default function BudgetOnboardingPage() {
  const [selectedFreq, setSelectedFreq] = useState<Frequency>("Weekly");
  const [amount, setAmount] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFreqSelect = (freq: Frequency) => {
    setSelectedFreq(freq);
    // Micro-interaction: nudge the input
    if (inputRef.current) {
      inputRef.current.style.transform = "scale(1.02)";
      setTimeout(() => {
        if (inputRef.current) inputRef.current.style.transform = "scale(1)";
      }, 150);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, "");
    setAmount(value);
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
        .academic-card {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .illustration-img {
          transition: transform 0.7s ease;
        }
        .illustration-wrapper:hover .illustration-img {
          transform: scale(1.05);
        }
        .budget-input {
          transition: transform 0.15s ease, box-shadow 0.2s ease;
        }
        .budget-input:focus {
          box-shadow: 0 0 0 2px #3B82F6;
          border-color: #3B82F6;
          outline: none;
        }
        .check-icon {
          opacity: 0;
          transition: opacity 0.2s;
        }
        .input-wrapper:focus-within .check-icon {
          opacity: 1;
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
          justifyContent: "center",
          overflowX: "hidden",
          position: "relative",
        }}
      >
        {/* Background gradient blobs */}
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
          }}
        >
          {/* Header */}
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
                  Step 2 of 3
                </span>
                <div style={{ display: "flex", gap: "6px" }}>
                  {[false, true, false].map((active, i) => (
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
              Set Up Your Budget
            </h1>
            <p
              style={{
                fontSize: "16px",
                lineHeight: "24px",
                color: "#6B7280",
                margin: 0,
              }}
            >
              Help us understand your finances to provide smarter suggestions.
            </p>
          </header>

          {/* Illustration Card */}
          <div
            className="illustration-wrapper academic-card"
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
            {/* Gradient overlay + glass card */}
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
                  <span
                    className="material-symbols-outlined"
                    style={{ color: "#3B82F6" }}
                  >
                    savings
                  </span>
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
                    Students save 15% more with structured intervals.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "32px" }}
          >
            {/* Frequency Selection */}
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
                {FREQUENCIES.map((freq) => {
                  const isActive = selectedFreq === freq;
                  return (
                    <button
                      key={freq}
                      onClick={() => handleFreqSelect(freq)}
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
                        boxShadow: isActive
                          ? "0 1px 3px rgba(0,0,0,0.1)"
                          : "none",
                      }}
                    >
                      {freq}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Amount Input */}
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

              <div className="input-wrapper" style={{ position: "relative" }}>
                {/* ₱ prefix */}
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
                    ₱
                  </span>
                </div>

                <input
                  ref={inputRef}
                  id="budget-amount"
                  name="budget-amount"
                  type="text"
                  placeholder="3,000.00"
                  value={amount}
                  onChange={handleAmountChange}
                  className="budget-input"
                  style={{
                    width: "100%",
                    backgroundColor: "#ffffff",
                    border: "1px solid #c2c6d6",
                    borderRadius: "12px",
                    padding: "16px 48px 16px 40px",
                    fontSize: "24px",
                    lineHeight: "32px",
                    fontWeight: 600,
                    color: "#191c1d",
                    boxSizing: "border-box",
                    fontFamily: "'Inter', sans-serif",
                  }}
                />

                {/* Check icon — visible when input is focused */}
                <div
                  className="check-icon"
                  style={{
                    position: "absolute",
                    right: "16px",
                    top: "50%",
                    transform: "translateY(-50%)",
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ color: "#10B981" }}
                  >
                    check_circle
                  </span>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <button
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
                cursor: "pointer",
                boxShadow: "0 4px 20px rgba(59, 130, 246, 0.2)",
                transition: "opacity 0.15s, transform 0.1s",
                fontFamily: "'Inter', sans-serif",
              }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = "0.9")}
              onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
              onMouseDown={(e) =>
                (e.currentTarget.style.transform = "scale(0.98)")
              }
              onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <span>Let&apos;s Go!</span>
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>

            {/* Skip link */}
            <button
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
              onMouseOver={(e) => (e.currentTarget.style.color = "#191c1d")}
              onMouseOut={(e) => (e.currentTarget.style.color = "#424754")}
            >
              I&apos;ll set this up later
            </button>
          </div>
        </main>
      </div>
    </>
  );
}
