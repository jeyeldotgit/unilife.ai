"use server";

import { revalidatePath } from "next/cache";
import { sendMessage } from "@/lib/api/chat";
import type { ChatMessage } from "@/lib/types";

export type SubmitChatMessageInput = {
  text: string;
  offline?: boolean;
};

export type ChatActionResult =
  | {
      ok: true;
      responseMessage: ChatMessage;
    }
  | {
      ok: false;
      error: string;
      responseMessage?: ChatMessage;
    };

function buildOfflineTextMessage(text: string): ChatMessage {
  const normalized = text.toLowerCase();

  if (
    normalized.includes("allowance") ||
    normalized.includes("budget") ||
    normalized.includes("last until")
  ) {
    return {
      id: crypto.randomUUID(),
      role: "ai",
      kind: "text",
      text:
        "You are offline right now, so I cannot run an allowance forecast yet. I can still help capture expenses and assignments while you are disconnected.",
      createdAt: new Date().toISOString(),
    };
  }

  if (
    normalized.includes("add class") ||
    normalized.includes("may pasok") ||
    normalized.includes("klase")
  ) {
    return {
      id: crypto.randomUUID(),
      role: "ai",
      kind: "text",
      text:
        "I need an internet connection before I can interpret a new class schedule from chat. Try again once you are back online.",
      createdAt: new Date().toISOString(),
    };
  }

  return {
    id: crypto.randomUUID(),
    role: "ai",
    kind: "text",
    text:
      "You are offline right now. I can still help with simple local actions, and I will keep the chat stable until you reconnect.",
    createdAt: new Date().toISOString(),
  };
}

export async function submitChatMessageAction(
  input: SubmitChatMessageInput,
): Promise<ChatActionResult> {
  const text = input.text.trim();

  if (!text) {
    return {
      ok: false,
      error: "Type a message before sending.",
    };
  }

  if (
    input.offline &&
    (text.toLowerCase().includes("allowance") ||
      text.toLowerCase().includes("budget") ||
      text.toLowerCase().includes("last until") ||
      text.toLowerCase().includes("add class") ||
      text.toLowerCase().includes("may pasok") ||
      text.toLowerCase().includes("klase"))
  ) {
    return {
      ok: false,
      error: "Offline fallback used.",
      responseMessage: buildOfflineTextMessage(text),
    };
  }

  try {
    const result = await sendMessage({ text });

    revalidatePath("/chat");
    revalidatePath("/dashboard");
    revalidatePath("/assignments");
    revalidatePath("/expenses");

    return {
      ok: true,
      responseMessage: result.responseMessage,
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "We could not send that message right now.",
    };
  }
}
