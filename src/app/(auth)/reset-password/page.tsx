import Link from "next/link";
import { AuthFrame } from "../auth-frame";
import { ResetPasswordForm } from "../auth-forms";
import styles from "../auth.module.css";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export default async function ResetPasswordPage() {
  const configured = isSupabaseConfigured();
  const supabase = configured ? await createClient() : null;
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  if (!configured) {
    return (
      <AuthFrame
        description="Forge cannot securely verify an account until its authentication service is connected."
        footer={
          <p>
            <Link href="/">Return to Forge</Link>
          </p>
        }
        kicker="Account recovery"
        title="Password reset is not available yet."
      >
        <div className={styles.setupNotice} role="status">
          <span aria-hidden="true" className={styles.noticeMark}>!</span>
          <p>
            <strong>Account services are not connected.</strong> Add{" "}
            <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to
            enable authentication.
          </p>
        </div>
      </AuthFrame>
    );
  }

  if (!user) {
    return (
      <AuthFrame
        description="A valid reset link opens a short-lived recovery session. This page does not have one right now."
        footer={
          <p>
            <Link href="/login">Return to sign in</Link>
          </p>
        }
        kicker="Recovery link unavailable"
        title="Request a fresh reset link."
      >
        <div className={styles.recoveryNotice} role="status">
          <span aria-hidden="true" className={styles.noticeMark}>i</span>
          <p>
            There is no active recovery session. For your security, request a
            new link and open it from the same browser.
          </p>
        </div>
        <Link className={styles.recoveryAction} href="/forgot-password">
          Request a new reset link <span aria-hidden="true">↗</span>
        </Link>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame
      description="Choose a new password for your Forge account."
      footer={
        <p>
          Need another link? <Link href="/forgot-password">Request a reset</Link>
        </p>
      }
      kicker="Recovery session verified"
      title="Set a new password."
    >
      <ResetPasswordForm configured={configured} />
      <span className={styles.formFootnote}>
        After updating it, you can continue into Forge.
      </span>
    </AuthFrame>
  );
}
