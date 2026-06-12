import { beforeEach, describe, expect, it, vi } from "vitest";

const { getMock, updateMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  updateMock: vi.fn(),
}));

vi.mock("@/lib/db/dexie", () => ({
  db: {
    notifications: {
      get: getMock,
      update: updateMock,
    },
  },
}));

import {
  dismissNotification,
  getNotificationPermission,
  showLocalNotification,
} from "@/lib/notifications/runtime";

describe("notification lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { Notification: {} },
    });
    Object.defineProperty(globalThis, "Notification", {
      configurable: true,
      value: {
        permission: "denied",
        requestPermission: vi.fn(),
      },
    });
  });

  it("degrades gracefully when permission is denied", async () => {
    expect(getNotificationPermission()).toBe("denied");
    await expect(
      showLocalNotification({
        body: "Body",
        created_at: "2026-06-12T00:00:00.000Z",
        entity_id: "assignment-1",
        entity_type: "assignment",
        id: "notification-1",
        scheduled_at: "2026-06-12T00:00:00.000Z",
        status: "pending",
        title: "Title",
        user_id: "user-1",
      }),
    ).resolves.toBe(false);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("marks a consumed notification deep link dismissed once", async () => {
    getMock.mockResolvedValue({ status: "sent" });

    await dismissNotification("notification-1");

    expect(updateMock).toHaveBeenCalledWith("notification-1", {
      status: "dismissed",
    });
  });
});
