"use client";
/* eslint-disable react/no-unescaped-entities */

import { useState, useRef, useEffect } from "react";

type MessageRole = "ai" | "user";

type Message = {
  id: number;
  role: MessageRole;
  content: React.ReactNode;
  time?: string;
};

const AssignmentCard = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
    <p style={{ fontSize: "16px", lineHeight: "24px", margin: 0 }}>
      ✅ Got it! I've added:
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
        <span
          className="material-symbols-outlined"
          style={{ color: "#10B981" }}
        >
          assignment
        </span>
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
          Book Report
        </h4>
        <p style={{ fontSize: "12px", color: "#424754", margin: 0 }}>
          Fri, Jun 12 • 11:59 PM
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
      <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
        link_off
      </span>
      No class linked
    </div>
    <button
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
      onMouseOver={(e) => (e.currentTarget.style.opacity = "0.9")}
      onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      View Assignment
      <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
        arrow_forward
      </span>
    </button>
  </div>
);

const INITIAL_MESSAGES: Message[] = [
  {
    id: 1,
    role: "ai",
    content: "👋 Hey Lea! What would you like to do today?",
  },
  {
    id: 2,
    role: "user",
    content: "book report next friday 11:59pm",
    time: "10:42 AM",
  },
  {
    id: 3,
    role: "ai",
    content: <AssignmentCard />,
  },
];

const AiAvatar = () => (
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
    <span
      className="material-symbols-outlined"
      style={{
        fontSize: "14px",
        color: "#ffffff",
        fontVariationSettings: "'FILL' 1",
      }}
    >
      smart_toy
    </span>
  </div>
);

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const now = new Date();
    const time = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        role: "user",
        content: inputValue.trim(),
        time,
      },
    ]);
    setInputValue("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        .glass-panel {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
        .chat-scroll::-webkit-scrollbar { width: 4px; }
        .chat-scroll::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 10px;
        }
        .chat-input:focus { outline: none; box-shadow: none; }
      `}</style>

      <div
        style={{
          fontFamily: "'Inter', sans-serif",
          backgroundColor: "#f8f9fa",
          color: "#191c1d",
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* TopAppBar */}
        <header
          style={{
            backgroundColor: "#f8f9fa",
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            zIndex: 50,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "9999px",
                overflow: "hidden",
                border: "2px solid #e7e8e9",
                flexShrink: 0,
              }}
            >
              <img
                alt="User Profile"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDk0F9yuCw5aYwob7-amRY0OhXWoK196Cew1ljYHU04rhePgVrPPNINxzaTPjaGtf0tKQuBmeYYbhS4cqrYyDOZWBPKAfDLDvmN1hCK4uXHCXny5KxJdBEu5w1bgc6JEmYB8I-PY1c17woSEqRtbo97HJvFvPQAMzfcUu7DKQDYFtbBnMcO5HCgBPaJnq0t1-Ih_R_UuHDMzGICuVXRK5-kL3DAOdThAS-De-IvXPC5DXXjalRltr5W4hDQpg3WFv7T4TTN0LtFfKM"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </div>
            <h1
              style={{
                fontSize: "24px",
                lineHeight: "32px",
                fontWeight: 700,
                color: "#0058be",
                margin: 0,
              }}
            >
              Chat with UniLife
            </h1>
          </div>
          <button
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#3B82F6",
              padding: "8px",
              borderRadius: "9999px",
              transition: "opacity 0.15s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = "0.8")}
            onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <span className="material-symbols-outlined">notifications</span>
          </button>
        </header>

        {/* Chat Canvas */}
        <main
          className="chat-scroll"
          style={{
            flexGrow: 1,
            paddingTop: "96px",
            paddingBottom: "128px",
            padding: "96px 16px 128px",
            maxWidth: "768px",
            width: "100%",
            margin: "0 auto",
            overflowY: "auto",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{ display: "flex", flexDirection: "column", gap: "24px" }}
          >
            {messages.map((msg) =>
              msg.role === "ai" ? (
                /* AI Bubble */
                <div
                  key={msg.id}
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
                    {typeof msg.content === "string" ? (
                      <p
                        style={{
                          fontSize: "16px",
                          lineHeight: "24px",
                          margin: 0,
                          color: "#191c1d",
                        }}
                      >
                        {msg.content}
                      </p>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ) : (
                /* User Bubble */
                <div
                  key={msg.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: "4px",
                  }}
                >
                  {msg.time && (
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
                        {msg.time}
                      </span>
                    </div>
                  )}
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
                      {msg.content}
                    </p>
                  </div>
                </div>
              ),
            )}
            <div ref={chatEndRef} />
          </div>
        </main>

        {/* Chat Input */}
        <div
          style={{
            position: "fixed",
            bottom: "72px",
            left: 0,
            width: "100%",
            padding: "0 16px 16px",
            zIndex: 40,
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              maxWidth: "768px",
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "#ffffff",
              border: "1px solid #c2c6d6",
              padding: "8px",
              borderRadius: "9999px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
            }}
          >
            <button
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "8px",
                color: "#424754",
                transition: "color 0.2s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.color = "#0058be")}
              onMouseOut={(e) => (e.currentTarget.style.color = "#424754")}
            >
              <span className="material-symbols-outlined">add_circle</span>
            </button>

            <input
              ref={inputRef}
              className="chat-input"
              type="text"
              placeholder="Type a message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{
                flexGrow: 1,
                background: "transparent",
                border: "none",
                fontSize: "16px",
                lineHeight: "24px",
                color: "#191c1d",
                padding: "8px 4px",
                fontFamily: "'Inter', sans-serif",
              }}
            />

            <button
              onClick={handleSend}
              style={{
                width: "40px",
                height: "40px",
                backgroundColor: "#3B82F6",
                color: "#ffffff",
                borderRadius: "9999px",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "opacity 0.15s, transform 0.1s",
                flexShrink: 0,
              }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = "0.9")}
              onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
              onMouseDown={(e) =>
                (e.currentTarget.style.transform = "scale(0.9)")
              }
              onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1", fontSize: "20px" }}
              >
                send
              </span>
            </button>
          </div>
        </div>

      </div>
    </>
  );
}
