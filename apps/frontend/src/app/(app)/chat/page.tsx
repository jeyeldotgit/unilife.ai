import ChatClient from "@/app/(app)/chat/ChatClient";
import { getChatState } from "@/lib/api/chat";

export default async function ChatPage() {
  const chatStateResult = await Promise.allSettled([getChatState()]);
  const chatState =
    chatStateResult[0].status === "fulfilled" ? chatStateResult[0].value : null;

  return (
    <ChatClient
      initialMessages={chatState?.messages ?? []}
      quickActions={chatState?.quickActions ?? []}
      chatAvailable={chatState !== null}
    />
  );
}
