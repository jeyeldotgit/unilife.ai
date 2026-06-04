import Link from "next/link";

interface AuthAlternateActionProps {
  prompt: string;
  href: string;
  linkLabel: string;
}

export const AuthAlternateAction = ({
  prompt,
  href,
  linkLabel,
}: AuthAlternateActionProps) => {
  return (
    <p
      className="mt-8 text-center text-base leading-relaxed"
      style={{ color: "#424754" }}
    >
      {prompt}{" "}
      <Link
        href={href}
        className="font-semibold hover:underline"
        style={{ color: "#3B82F6" }}
      >
        {linkLabel}
      </Link>
    </p>
  );
};
