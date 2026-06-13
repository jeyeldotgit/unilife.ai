let currentUserId: string | null = null;
const listeners = new Set<(userId: string | null) => void>();

export function setCurrentUserId(userId: string) {
  if (currentUserId === userId) {
    return;
  }

  currentUserId = userId;
  for (const listener of listeners) {
    listener(currentUserId);
  }
}

export function getCurrentUserId() {
  return currentUserId;
}

export function subscribeCurrentUserId(
  listener: (userId: string | null) => void,
) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function requireCurrentUserId() {
  if (!currentUserId) {
    throw new Error("The current user is not available in the browser session.");
  }

  return currentUserId;
}
