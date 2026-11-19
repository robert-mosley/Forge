import Link from "next/link";
import { AuthFrame } from "../auth-frame";
import { ForgotPasswordForm } from "../auth-forms";
import styles from "../auth.module.css";
import { isSupabaseConfigured } from "@/lib/env";

export default function ForgotPasswordPage() {
  const configured = isSupabaseConfigured();

  return (
    <AuthFrame
      description="We’ll send a secure link to the email address on your KSUForge account."
      footer={
        <p>
          Remembered it? <Link href="/login">Return to sign in</Link>
        </p>
      }
      kicker="Account recovery"
      title="Let’s get you back in."
    >
      <ForgotPasswordForm configured={configured} />
      <span className={styles.formFootnote}>
        Reset links expire. Request a new one if yours is no longer valid.
      </span>
    </AuthFrame>
  );
}
