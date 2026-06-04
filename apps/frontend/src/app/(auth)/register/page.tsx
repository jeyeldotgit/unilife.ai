import { AuthAlternateAction } from "../components/AuthAlternateAction";
import { AuthHeader } from "../components/AuthHeader";
import { AuthPageShell } from "../components/AuthPageShell";
import RegistrationForm from "./components/RegistrationForm";

const SignUpPage = () => {
  return (
    <AuthPageShell>
      <AuthHeader
        title="Create your account"
        description="Join the modern academic companion designed for your success."
      />
      <RegistrationForm />
      <AuthAlternateAction
        prompt="Already have an account?"
        href="/login"
        linkLabel="Sign In"
      />
    </AuthPageShell>
  );
};

export default SignUpPage;
