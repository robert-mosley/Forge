import Link from "next/link";
import { AuthFrame } from "../auth-frame";
import { SignInForm } from "../auth-forms";
import styles from "../auth.module.css";
import { isSupabaseConfigured } from "@/lib/env";
import { redirectIfAuthenticated } from "@/lib/auth/redirect-if-authenticated";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; signedOut?: string }>;
}) {
  await redirectIfAuthenticated();
  const configured = isSupabaseConfigured();
  const params = await searchParams;
  const notice =
    params.notice === "confirmation-failed"
      ? "That email link could not be verified. Request a fresh link or try signing in."
      : params.signedOut === "1"
        ? "You have signed out."
        : null;

  return (
    <AuthFrame
      description="Sign in to keep building with people whose strengths complement yours."
      footer={
        <p>
          New to KSUForge? <Link href="/signup">Create an account</Link>
        </p>
      }
      kicker="01 / Your workspace"
      title="Pick up where your work left off."
    >
      {notice && (
        <div
          className={
            params.signedOut === "1" ? styles.successMessage : styles.errorMessage
          }
          role={params.signedOut === "1" ? "status" : "alert"}
        >
          <span aria-hidden="true" className={styles.feedbackMark}>
            {params.signedOut === "1" ? "✓" : "!"}
          </span>
          <p>{notice}</p>
        </div>
      )}
      <SignInForm configured={configured} />
      <span className={styles.formFootnote}>
        KSU computer science + engineering
      </span>
    </AuthFrame>
  );
}
