"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { submitChatMessageAction } from "@/actions/chat";
import { ChatBubble } from "@/components/chat/ChatBubble";
import { ChatInput } from "@/components/chat/ChatInput";
import { QuickActions } from "@/components/chat/QuickActions";
import { AuthenticatedPageHeader } from "@/components/profile/AuthenticatedPageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { MutationStatus } from "@/components/ui/MutationStatus";
import { RecoverableError } from "@/components/ui/RecoverableError";
import {
  executeChatClientEffect,
  resolveLocalChat,
} from "@/lib/chat/local-executor";
import { normalizeRecoverableError } from "@/lib/errors/recoverable";
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
        ? "You are offline. Local actions can still be reviewed and applied, but connected replies may be limited."
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
  const [sendError, setSendError] = useState<string | null>(null);
  const [lastFailedText, setLastFailedText] = useState<string | null>(null);
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

  const handleSend = async (draftText?: string) => {
    const text = (draftText ?? inputValue).trim();

    if (!text || isSubmitting) {
      return;
    }

    const optimisticMessage = createOptimisticUserMessage(text);
    setMessages((current) => [...current, optimisticMessage]);
    setInputValue("");
    setSendError(null);
    setLastFailedText(null);
    setIsSubmitting(true);

    try {
      const localResult = await resolveLocalChat(text);

      if (localResult.handled) {
        setMessages((current) => [...current, localResult.message]);
        setIsSubmitting(false);
        return;
      }

      if (isOffline) {
        setMessages((current) => [...current, localResult.offlineMessage]);
        setSendError("You’re offline, so only local quick actions can complete right now.");
        setLastFailedText(text);
        setIsSubmitting(false);
        return;
      }

      const result = await submitChatMessageAction({ text });

      if (result.ok) {
        const response = result.clientEffect
          ? await executeChatClientEffect(result.clientEffect)
          : result.responseMessage;
        setMessages((current) => [...current, response]);
      } else if (result.responseMessage) {
        const responseMessage = result.responseMessage;
        setMessages((current) => [...current, responseMessage]);
      } else {
        setSendError(result.error);
        setLastFailedText(text);
      }
    } catch (error) {
      const recoverable = normalizeRecoverableError(error);
      setSendError(recoverable.message);
      setLastFailedText(text);
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
        <AuthenticatedPageHeader className="fixed left-0 top-0 z-50 w-full bg-[#f8f9fa] shadow-[0_1px_4px_rgba(0,0,0,0.06)]" pageTitle="Chat" />

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
            <div className="flex justify-end">
              <Link
                className="rounded-xl border border-[#c2c6d6] bg-white px-3 py-2 text-sm font-semibold text-[#0058be]"
                href="/chat/history"
              >
                AI action history
              </Link>
            </div>

            {sendError ? (
              <RecoverableError
                title="Message not sent"
                message={sendError}
                onRetry={
                  lastFailedText
                    ? () => {
                        void handleSend(lastFailedText);
                      }
                    : null
                }
                retryLabel="Retry send"
              />
            ) : null}

            <MutationStatus
              state={isSubmitting ? "pending" : "idle"}
              label="Sending your message..."
            />

            {messages.length > 0 ? (
              messages.map((message) => (
                <ChatBubble
                  key={message.id}
                  message={message}
                  onAssignmentCtaClick={() => router.push("/assignments")}
                  onClassCtaClick={() => router.push("/schedule")}
                  onExamCtaClick={() => router.push("/exams")}
                  onExpenseCtaClick={() => router.push("/expenses")}
                  onProposalChange={(proposal) => {
                    setMessages((current) =>
                      current.map((item) =>
                        item.kind === "proposal_review" &&
                        item.payload.id === proposal.id
                          ? { ...item, payload: proposal }
                          : item,
                      ),
                    );
                  }}
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
