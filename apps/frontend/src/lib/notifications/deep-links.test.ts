import { describe, expect, it } from "vitest";

import {
  buildNotificationDeepLink,
  parseNotificationDeepLink,
} from "@/lib/notifications/deep-links";

describe("notification deep links", () => {
  it("builds and parses the related detail context", () => {
    const link = buildNotificationDeepLink({
      entityId: "exam-1",
      entityType: "exam",
      notificationId: "notification-1",
    });

    expect(link).toBe("/exams?item=exam-1&notification=notification-1");
    expect(parseNotificationDeepLink(link.split("?")[1])).toEqual({
      itemId: "exam-1",
      notificationId: "notification-1",
    });
  });
});
