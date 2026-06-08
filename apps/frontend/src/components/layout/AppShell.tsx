"use client";

import type { ReactNode } from "react";
import { BottomNav } from "@/components/layout/BottomNav";
import { OfflineBanner } from "@/components/layout/OfflineBanner";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <OfflineBanner />
      {children}
      <BottomNav />
    </>
  );
}
