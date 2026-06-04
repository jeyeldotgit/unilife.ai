interface AuthDividerProps {
  label?: string;
}

export const AuthDivider = ({
  label = "or continue with",
}: AuthDividerProps) => {
  return (
    <div className="relative my-8">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t" style={{ borderColor: "#c2c6d6" }} />
      </div>
      <div className="relative flex justify-center">
        <span
          className="px-4 text-xs font-medium uppercase tracking-wider"
          style={{ backgroundColor: "#f8f9fa", color: "#424754" }}
        >
          {label}
        </span>
      </div>
    </div>
  );
};
