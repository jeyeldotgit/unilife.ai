"use client";

import { useEffect, useState } from "react";

import {
  getCurrentUserId,
  setCurrentUserId,
  subscribeCurrentUserId,
} from "@/lib/session/current-user";
import { createClient } from "@/lib/supabase/client";

export function useCurrentUserId() {
  const [userId, setUserId] = useState<string | null>(() => getCurrentUserId());

  useEffect(() => {
    const unsubscribe = subscribeCurrentUserId(setUserId);

    if (getCurrentUserId()) {
      return unsubscribe;
    }

    void (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.id) {
        setCurrentUserId(user.id);
      }
    })();

    return unsubscribe;
  }, []);

  return userId;
}
