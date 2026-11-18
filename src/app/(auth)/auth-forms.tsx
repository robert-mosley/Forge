"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  initialFormActionState,
  type FormActionState,
} from "@/lib/forms";
import {
  requestPasswordResetAction,
  signInAction,
  signUpAction,
  updatePasswordAction,
} from "./actions";
import styles from "./auth.module.css";

function SetupNotice() {
  return (
    <div className={styles.setupNotice} role="status">
      <span aria-hidden="true" className={styles.noticeMark}>
        !
      </span>
      <p>
        <strong>Account services are not connected.</strong> Add{" "}
        <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
        <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to enable
        authentication.
      </p>
    </div>
  );
}

function ActionFeedback({ state }: { state: FormActionState }) {
  if (!state.message) return null;

  return (
    <div
      aria-live="polite"
      className={
        state.status === "success"
          ? styles.successMessage
          : styles.errorMessage
      }
      role={state.status === "error" ? "alert" : "status"}
    >
      <span aria-hidden="true" className={styles.feedbackMark}>
        {state.status === "success" ? "✓" : "!"}
      </span>
      <p>{state.message}</p>
    </div>
  );
}

function Field({
  autoComplete,
  hint,
  label,
  name,
  type = "text",
}: {
  autoComplete?: string;
  hint?: string;
  label: string;
  name: string;
  type?: string;
}) {
  const id = `auth-${name}`;
  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      <input
        autoComplete={autoComplete}
        id={id}
        name={name}
        required
        type={type}
        aria-describedby={hint ? `${id}-hint` : undefined}
      />
      {hint ? (
        <span className={styles.fieldHint} id={`${id}-hint`}>
          {hint}
        </span>
      ) : null}
    </div>
  );
}

export function SignInForm({ configured }: { configured: boolean }) {
  const [state, action, pending] = useActionState(
    signInAction,
    initialFormActionState,
  );

  return (
    <form action={action} className={styles.form}>
      {!configured ? <SetupNotice /> : null}
        <Field autoComplete="email" label="Email address" name="email" type="email" />
      <Field
        autoComplete="current-password"
        label="Password"
        name="password"
        type="password"
      />
      <div className={styles.fieldMeta}>
        <span>Use the password for your Forge account.</span>
        <Link href="/forgot-password">Forgot password?</Link>
      </div>
      <ActionFeedback state={state} />
      <Button
        className={styles.submitButton}
        disabled={!configured || pending}
        size="lg"
        type="submit"
      >
        {pending ? "Signing in…" : "Sign in"}
        <span aria-hidden="true">↗</span>
      </Button>
    </form>
  );
}

export function SignUpForm({ configured }: { configured: boolean }) {
  const [state, action, pending] = useActionState(
    signUpAction,
    initialFormActionState,
  );

  return (
    <form action={action} className={styles.form}>
      {!configured ? <SetupNotice /> : null}
        <Field autoComplete="email" label="Email address" name="email" type="email" />
      <Field
        autoComplete="new-password"
        hint="Choose at least 10 characters."
        label="Create password"
        name="password"
        type="password"
      />
      <Field
        autoComplete="new-password"
        label="Confirm password"
        name="confirmPassword"
        type="password"
      />
      <p className={styles.formNote}>
        Depending on account settings, you may need to confirm by email.
      </p>
      <ActionFeedback state={state} />
      <Button
        className={styles.submitButton}
        disabled={!configured || pending}
        size="lg"
        type="submit"
      >
        {pending ? "Creating account…" : "Create account"}
        <span aria-hidden="true">↗</span>
      </Button>
    </form>
  );
}

export function ForgotPasswordForm({ configured }: { configured: boolean }) {
  const [state, action, pending] = useActionState(
    requestPasswordResetAction,
    initialFormActionState,
  );

  return (
    <form action={action} className={styles.form}>
      {!configured ? <SetupNotice /> : null}
      <Field
        autoComplete="email"
        hint="Use the address associated with your Forge account."
        label="Email address"
        name="email"
        type="email"
      />
      <ActionFeedback state={state} />
      <Button
        className={styles.submitButton}
        disabled={!configured || pending}
        size="lg"
        type="submit"
      >
        {pending ? "Sending link…" : "Send reset link"}
        <span aria-hidden="true">↗</span>
      </Button>
    </form>
  );
}

export function ResetPasswordForm({ configured }: { configured: boolean }) {
  const [state, action, pending] = useActionState(
    updatePasswordAction,
    initialFormActionState,
  );

  return (
    <form action={action} className={styles.form}>
      {!configured ? <SetupNotice /> : null}
      <Field
        autoComplete="new-password"
        hint="Choose at least 10 characters."
        label="New password"
        name="password"
        type="password"
      />
      <Field
        autoComplete="new-password"
        label="Confirm new password"
        name="confirmPassword"
        type="password"
      />
      <ActionFeedback state={state} />
      <Button
        className={styles.submitButton}
        disabled={!configured || pending}
        size="lg"
        type="submit"
      >
        {pending ? "Updating password…" : "Update password"}
        <span aria-hidden="true">↗</span>
      </Button>
    </form>
  );
}
