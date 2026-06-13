import { AuthenticatedPageHeader } from "@/components/profile/AuthenticatedPageHeader";

export function RouteSkeleton({
  title,
  sections = 3,
}: {
  title: string;
  sections?: number;
}) {
  return (
    <div
      className="min-h-screen animate-pulse bg-[#f8f9fa] pb-24"
      aria-hidden="true"
    >
      <AuthenticatedPageHeader pageTitle={title} />
      <main className="mx-auto max-w-4xl space-y-5 px-4 pt-6 md:px-8">
        <div className="h-8 w-40 rounded-full bg-[#e7e8e9]" />
        {Array.from({ length: sections }).map((_, index) => (
          <section
            key={index}
            className="rounded-3xl border border-[#c2c6d6]/30 bg-white p-5 shadow-sm"
          >
            <div className="h-5 w-32 rounded-full bg-[#edeeef]" />
            <div className="mt-4 space-y-3">
              <div className="h-4 w-full rounded-full bg-[#f3f4f5]" />
              <div className="h-4 w-5/6 rounded-full bg-[#f3f4f5]" />
              <div className="h-20 rounded-2xl bg-[#f3f4f5]" />
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
