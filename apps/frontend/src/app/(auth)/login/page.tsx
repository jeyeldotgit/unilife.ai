import { AuthAlternateAction } from "../components/AuthAlternateAction";
import { AuthHeader } from "../components/AuthHeader";
import { AuthPageShell } from "../components/AuthPageShell";
import LoginForm from "./components/LoginForm";

export default function LoginPage() {
  return (
    <AuthPageShell>
      <AuthHeader
        title="Welcome back"
        description="Sign in to continue planning, studying, and staying on top of campus life."
      />
      <LoginForm />
      <AuthAlternateAction
        prompt="New here?"
        href="/register"
        linkLabel="Create an account"
      />
    </AuthPageShell>
  );
}
