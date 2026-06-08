"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { submitChatMessageAction } from "@/actions/chat";
import { ChatBubble } from "@/components/chat/ChatBubble";
import { ChatInput } from "@/components/chat/ChatInput";
import { QuickActions } from "@/components/chat/QuickActions";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import type { ChatMessage, ChatQuickAction, ChatTextMessage } from "@/lib/types";

export type ChatClientProps = {
  initialMessages: ChatMessage[];
  quickActions: ChatQuickAction[];
  chatAvailable: boolean;
};

function OfflineNotice({
  isOffline,
  chatAvailable,
}: {
  isOffline: boolean;
  chatAvailable: boolean;
}) {
  if (!isOffline && chatAvailable) {
    return null;
  }

  return (
    <div
      className={`rounded-xl px-4 py-3 text-sm font-medium shadow-sm ${
        isOffline
          ? "border border-[#ffddb8] bg-[#fff8f1] text-[#825100]"
          : "border border-[#d8e2ff] bg-[#f8fbff] text-[#0058be]"
      }`}
    >
      {isOffline
        ? "You are offline. Quick logging still works, but chat replies that depend on a connection may be limited."
        : "We could not load your earlier messages right now, but you can still start a new chat."}
    </div>
  );
}

function createOptimisticUserMessage(text: string): ChatTextMessage {
  const createdAt = new Date().toISOString();

  return {
    id: `optimistic-${crypto.randomUUID()}`,
    role: "user",
    kind: "text",
    text,
    createdAt,
    timeLabel: new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(createdAt)),
  };
}

function buildFailureMessage(error: string): ChatMessage {
  return {
    id: `fallback-${crypto.randomUUID()}`,
    role: "ai",
    kind: "text",
    text: error,
    createdAt: new Date().toISOString(),
  };
}

export default function ChatClient({
  initialMessages,
  quickActions,
  chatAvailable,
}: ChatClientProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [isOffline, setIsOffline] = useState(() => {
    if (typeof navigator === "undefined") {
      return false;
    }

    return !navigator.onLine;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSubmitting]);

  const handleSend = async () => {
    const text = inputValue.trim();

    if (!text || isSubmitting) {
      return;
    }

    const optimisticMessage = createOptimisticUserMessage(text);
    setMessages((current) => [...current, optimisticMessage]);
    setInputValue("");
    setIsSubmitting(true);

    const result = await submitChatMessageAction({
      text,
      offline: isOffline,
    });

    if (result.ok) {
      setMessages((current) => [...current, result.responseMessage]);
    } else {
      const responseMessage = result.responseMessage;

      if (responseMessage) {
        setMessages((current) => [...current, responseMessage]);
      } else {
        setMessages((current) => [...current, buildFailureMessage(result.error)]);
      }
    }

    setIsSubmitting(false);
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
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <OfflineNotice isOffline={isOffline} chatAvailable={chatAvailable} />

            {messages.length > 0 ? (
              messages.map((message) => (
                <ChatBubble
                  key={message.id}
                  message={message}
                  onAssignmentCtaClick={() => router.push("/assignments")}
                  onExpenseCtaClick={() => router.push("/expenses")}
                />
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
            onSubmit={() => {
              void handleSend();
            }}
            disabled={isSubmitting}
          />
        </div>
      </div>
    </>
  );
}
