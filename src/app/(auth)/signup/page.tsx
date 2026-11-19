import Link from "next/link";
import { AuthFrame } from "../auth-frame";
import { SignUpForm } from "../auth-forms";
import styles from "../auth.module.css";
import { isSupabaseConfigured } from "@/lib/env";
import { redirectIfAuthenticated } from "@/lib/auth/redirect-if-authenticated";

export default async function SignupPage() {
  await redirectIfAuthenticated();
  const configured = isSupabaseConfigured();

  return (
    <AuthFrame
      description="Make a place for your practice, your projects, and the teammates you have not met yet."
      footer={
        <p>
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      }
      kicker="02 / Start with your work"
      title="Make your next build a shared one."
    >
      <SignUpForm configured={configured} />
      <span className={styles.formFootnote}>
        KSUForge is for KSU students.
      </span>
    </AuthFrame>
  );
}
