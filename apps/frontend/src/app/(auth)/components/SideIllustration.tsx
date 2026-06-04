import Image from "next/image";

interface SideIllustrationProps {
  title?: string;
  description?: string;
}

export const SideIllustration = ({
  title = "Elevate your academic life.",
  description = "Smart scheduling, AI-powered study assistance, and budget tracking - all in one place.",
}: SideIllustrationProps) => {
  return (
    <aside
      className="fixed top-0 right-0 hidden h-full w-[40%] items-center justify-center overflow-hidden lg:flex"
      style={{
        backgroundColor: "#edeeef",
        borderLeft: "1px solid #c2c6d6",
      }}
    >
      <div className="relative flex h-full w-full flex-col items-center justify-center space-y-8 p-12">
        <div className="relative z-10 max-w-sm text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-[#191c1d]">
            {title}
          </h2>
          <p className="text-lg leading-relaxed" style={{ color: "#424754" }}>
            {description}
          </p>
        </div>

        <div
          className="relative w-full max-w-md overflow-hidden rounded-3xl shadow-xl"
          style={{
            aspectRatio: "1 / 1",
            backgroundColor: "#ffffff",
            border: "1px solid #c2c6d6",
          }}
        >
          <Image
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDKTvQeKPthIL4VY3gwCoL4V-BMwfZz-_NHsRkQycFz0uzcJBAbG1n8_HgxG133F_t3OAs7CLdPJ2QYO4CQvPPXCb-CXoQO1p7bjQGUYGUkyGVcb27Z8v9r7vfMbbZ02gLytfO_C18dwOYfkNJibWuAfVAaxD01j5kfjpOlS_hb0KKKYZn_wjOu33d5Db-fmgNDibtzLQLLA4kqlzSiOVuLp86jZzBqZUwS44LsFnIAVGcDraDD3QWjYo0ipeFpf12QSm44PktJIZI"
            alt="University students collaborating"
            className="object-cover"
            fill
            sizes="(min-width: 1024px) 40vw, 100vw"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, rgba(0,0,0,0.2), transparent)",
            }}
          />

          <div
            className="absolute right-6 bottom-6 left-6 rounded-xl p-4 shadow-lg"
            style={{
              background: "rgba(255,255,255,0.7)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.4)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-white"
                style={{ backgroundColor: "#10B981" }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 20 }}
                >
                  auto_awesome
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#191c1d]">
                  AI Study Guide
                </p>
                <p className="text-xs" style={{ color: "#424754" }}>
                  Generating personalized plan...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
