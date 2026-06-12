"use server";

import { revalidatePath } from "next/cache";
import { sendMessage } from "@/lib/api/chat";
import type { ChatClientEffect, ChatMessage } from "@/lib/types";

export type SubmitChatMessageInput = {
  text: string;
};

export type ChatActionResult =
  | {
      ok: true;
      clientEffect?: ChatClientEffect;
      responseMessage: ChatMessage;
    }
  | {
      ok: false;
      error: string;
      responseMessage?: ChatMessage;
    };

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

  try {
    const result = await sendMessage({ text });

    revalidatePath("/chat");
    revalidatePath("/dashboard");
    revalidatePath("/assignments");
    revalidatePath("/expenses");

    return {
      ok: true,
      clientEffect: result.clientEffect,
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
