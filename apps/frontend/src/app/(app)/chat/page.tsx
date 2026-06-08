"use client";

import { useEffect, useRef, useState } from "react";
import { ChatBubble } from "@/components/chat/ChatBubble";
import { ChatInput } from "@/components/chat/ChatInput";
import { QuickActions } from "@/components/chat/QuickActions";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { listMockChatMessages, listMockQuickActions } from "@/lib/mock/chat";
import type { ChatMessage, ChatQuickAction, ChatTextMessage } from "@/lib/types";

const INITIAL_MESSAGES = listMockChatMessages();
const INITIAL_QUICK_ACTIONS = listMockQuickActions();

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [quickActions] = useState<ChatQuickAction[]>(INITIAL_QUICK_ACTIONS);
  const [inputValue, setInputValue] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) {
      return;
    }

    const now = new Date();
    const timeLabel = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const nextMessage: ChatTextMessage = {
      id: String(Date.now()),
      role: "user",
      kind: "text",
      text: inputValue.trim(),
      createdAt: now.toISOString(),
      timeLabel,
    };

    setMessages((prev) => [...prev, nextMessage]);
    setInputValue("");
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
        <PageHeader
          className="fixed left-0 top-0 z-50 w-full bg-[#f8f9fa] shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
          contentClassName="box-border flex justify-between items-center p-4"
          title="Chat with UniLife"
          leading={
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
          }
          titleClassName="m-0 text-2xl font-bold leading-8 text-[#0058be]"
          trailing={
            <button
              type="button"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#3B82F6",
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
              <Icon name="notifications" />
            </button>
          }
        />

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
            {messages.length > 0 ? (
              messages.map((message) => (
                <ChatBubble key={message.id} message={message} />
              ))
            ) : (
              <EmptyState
                icon="chat"
                title="No messages yet"
                description="Start a conversation with UniLife and your messages will appear here."
              />
            )}

            <QuickActions
              actions={quickActions}
              onAction={(action) => setInputValue(action.prompt)}
            />

            <div ref={chatEndRef} />
          </div>
        </main>

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
          <ChatInput
            value={inputValue}
            onValueChange={setInputValue}
            onSubmit={handleSend}
          />
        </div>
      </div>
    </>
  );
}
