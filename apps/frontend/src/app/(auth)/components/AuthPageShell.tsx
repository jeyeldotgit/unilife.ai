import type { ReactNode } from "react";

import { BackgroundBlobs } from "./BackgroundBlobs";
import { SideIllustration } from "./SideIllustration";

interface AuthPageShellProps {
  children: ReactNode;
  sideTitle?: string;
  sideDescription?: string;
}

export const AuthPageShell = ({
  children,
  sideTitle,
  sideDescription,
}: AuthPageShellProps) => {
  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center overflow-x-hidden"
      style={{
        backgroundColor: "#f8f9fa",
        color: "#191c1d",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      `}</style>

      <BackgroundBlobs />

      <main className="w-full max-w-md px-4 py-8 md:py-12 lg:mr-[40%]">
        {children}
      </main>

      <SideIllustration title={sideTitle} description={sideDescription} />
    </div>
  );
};
