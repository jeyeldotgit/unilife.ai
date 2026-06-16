import type { ChatMessage, ChatQuickAction } from "@/lib/types";

const quickActions: ChatQuickAction[] = [
  {
    id: "quick-task",
    label: "+ Task",
    icon: "assignment_add",
    prompt: "book report next friday 11:59pm",
    kind: "create_assignment",
  },
  {
    id: "quick-expense",
    label: "+ Expense",
    icon: "payments",
    prompt: "lunch 85",
    kind: "log_expense",
  },
  {
    id: "quick-class",
    label: "+ Class",
    icon: "calendar_add_on",
    prompt: "add class",
    kind: "create_class",
  },
  {
    id: "quick-exam",
    label: "+ Exam",
    icon: "quiz",
    prompt: "add exam",
    kind: "create_exam",
  },
  {
    id: "quick-due",
    label: "What's due?",
    icon: "event_upcoming",
    prompt: "what's due?",
    kind: "ask_due",
  },
];

const messages: ChatMessage[] = [
  {
    id: "chat-greeting",
    role: "ai",
    kind: "text",
    text: "Hey Lea! What would you like to do today?",
    createdAt: "2026-06-03T10:40:00+08:00",
  },
  {
    id: "chat-user-book-report",
    role: "user",
    kind: "text",
    text: "book report next friday 11:59pm",
    createdAt: "2026-06-03T10:42:00+08:00",
    timeLabel: "10:42 AM",
  },
  {
    id: "chat-book-report-confirmation",
    role: "ai",
    kind: "assignment_confirmation",
    createdAt: "2026-06-03T10:42:05+08:00",
    payload: {
      assignmentId: "assignment-book-report",
      title: "Book Report",
      dueLabel: "Fri, Jun 12 • 11:59 PM",
      subjectLabel: "No class linked",
      classLinkLabel: "No class linked",
      ctaLabel: "View Assignment",
      icon: "assignment",
    },
  },
];

export function listMockChatMessages() {
  return messages;
}

export function listMockQuickActions() {
  return quickActions;
}

export function appendMockChatMessages(nextMessages: ChatMessage[]) {
  messages.push(...nextMessages);
}
