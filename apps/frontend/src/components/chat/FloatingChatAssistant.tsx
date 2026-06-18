"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { submitChatMessageAction } from "@/actions/chat";
import { ChatBubble } from "@/components/chat/ChatBubble";
import { ChatInput } from "@/components/chat/ChatInput";
import { Icon } from "@/components/ui/Icon";
import { executeChatClientEffect, resolveLocalChat } from "@/lib/chat/local-executor";
import type { ChatMessage, ChatTextMessage } from "@/lib/types";

function createUserMessage(text: string): ChatTextMessage {
  const createdAt = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
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

export function FloatingChatAssistant() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || submitting) return;

    setMessages((current) => [...current, createUserMessage(text)]);
    setInputValue("");
    setSubmitting(true);
    setError(null);

    try {
      const localResult = await resolveLocalChat(text);
      if (localResult.handled) {
        setMessages((current) => [...current, localResult.message]);
        return;
      }

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setMessages((current) => [...current, localResult.offlineMessage]);
        return;
      }

      const result = await submitChatMessageAction({ text });
      if (result.ok) {
        const response = result.clientEffect
          ? await executeChatClientEffect(result.clientEffect)
          : result.responseMessage;
        if (!response) {
          setError("Chat could not respond.");
          return;
        }
        setMessages((current) => [...current, response]);
      } else {
        const responseMessage = result.responseMessage;
        if (responseMessage) {
          setMessages((current) => [...current, responseMessage]);
        } else {
          setError(result.error);
        }
      }
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Chat could not respond.");
    } finally {
      setSubmitting(false);
    }
  };

  if (pathname === "/chat" || pathname.startsWith("/chat/")) {
    return null;
  }

  return (
    <>
      {open ? (
        <aside className="fixed bottom-24 right-4 z-[60] flex h-[560px] max-h-[calc(100dvh-120px)] w-[min(380px,calc(100vw-32px))] flex-col overflow-hidden rounded-2xl border border-[#c2c6d6] bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-[#c2c6d6] px-4 py-3">
            <div className="flex items-center gap-2">
              <Icon name="smart_toy" className="text-[#0058be]" />
              <h2 className="m-0 text-sm font-semibold text-[#191c1d]">UniLife Assistant</h2>
            </div>
            <button
              aria-label="Close assistant"
              className="rounded-full p-2 text-[#424754] hover:bg-[#f3f4f5]"
              type="button"
              onClick={() => setOpen(false)}
            >
              <Icon name="close" size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto bg-[#f8f9fa] p-3">
            {messages.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#c2c6d6] bg-white p-4 text-sm text-[#424754]">
                Ask about your schedule, tasks, exams, or budget.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {messages.map((message) => (
                  <ChatBubble
                    key={message.id}
                    message={message}
                    onAssignmentCtaClick={() => null}
                    onClassCtaClick={() => null}
                    onExamCtaClick={() => null}
                    onExpenseCtaClick={() => null}
                    onProposalChange={(proposal) => {
                      setMessages((current) =>
                        current.map((item) =>
                          item.kind === "proposal_review" && item.payload.id === proposal.id
                            ? { ...item, payload: proposal }
                            : item,
                        ),
                      );
                    }}
                  />
                ))}
              </div>
            )}
            {error ? <p className="mt-3 text-sm text-[#ba1a1a]">{error}</p> : null}
          </div>
          <div className="border-t border-[#c2c6d6] p-3">
            <ChatInput
              disabled={submitting}
              value={inputValue}
              onSubmit={() => {
                void handleSend();
              }}
              onValueChange={setInputValue}
            />
            <Link className="mt-2 block text-center text-xs font-semibold text-[#0058be]" href="/chat">
              Open full chat
            </Link>
          </div>
        </aside>
      ) : null}
      <button
        aria-label="Open UniLife Assistant"
        className="fixed bottom-24 right-4 z-[55] flex h-14 w-14 items-center justify-center rounded-full bg-[#0058be] text-white shadow-xl"
        type="button"
        onClick={() => setOpen((current) => !current)}
      >
        <Icon name={open ? "close" : "smart_toy"} className="text-[28px] text-white" />
      </button>
    </>
  );
}
