let currentUserId: string | null = null;

export function setCurrentUserId(userId: string) {
  currentUserId = userId;
}

export function getCurrentUserId() {
  return currentUserId;
}

export function requireCurrentUserId() {
  if (!currentUserId) {
    throw new Error("The current user is not available in the browser session.");
  }

  return currentUserId;
}
