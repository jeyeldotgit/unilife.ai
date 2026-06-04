interface PasswordStrengthBarProps {
  password: string;
}

export const getStrength = (password: string): number => {
  if (!password) return 0;

  let score = 0;

  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  return score;
};

const COLORS = ["#e1e3e4", "#ba1a1a", "#F59E0B", "#3B82F6", "#10B981"];

const PasswordStrengthBar = ({ password }: PasswordStrengthBarProps) => {
  const strength = getStrength(password);

  return (
    <div className="mt-1 flex gap-1">
      {[1, 2, 3, 4].map((level) => (
        <div
          key={level}
          className="h-1 flex-1 rounded-full transition-colors duration-300"
          style={{
            backgroundColor: strength >= level ? COLORS[strength] : "#e1e3e4",
          }}
        />
      ))}
    </div>
  );
};

export default PasswordStrengthBar;
