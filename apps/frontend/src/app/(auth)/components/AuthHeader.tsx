import Link from "next/link";

interface AuthHeaderProps {
  title: string;
  description: string;
  backHref?: string;
}

export const AuthHeader = ({
  title,
  description,
  backHref = "/",
}: AuthHeaderProps) => {
  return (
    <header className="mb-10 flex flex-col gap-6">
      <Link
        href={backHref}
        aria-label="Back to welcome"
        className="flex h-10 w-10 items-center justify-center rounded-full text-[#191c1d] transition-colors hover:bg-[#e7e8e9]"
      >
        <span className="material-symbols-outlined">arrow_back</span>
      </Link>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-[#191c1d] md:text-4xl">
          {title}
        </h1>
        <p className="text-base leading-relaxed" style={{ color: "#424754" }}>
          {description}
        </p>
      </div>
    </header>
  );
};
