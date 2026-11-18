import Link from "next/link";
import { WorkspaceMessage } from "@/components/app/workspace-message";
import { requireUser } from "@/lib/auth/require-user";
import { isProfileComplete } from "@/schemas/profile.schema";
import {
  getProfileBundle,
  ProfileServiceError,
} from "@/services/profile.service";

export const metadata = { title: "Workspace" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { supabase, user } = await requireUser();
  let bundle;

  try {
    bundle = await getProfileBundle(supabase, user.id);
  } catch (error) {
    return (
      <WorkspaceMessage
        title="Forge needs its database setup."
        message={
          error instanceof ProfileServiceError
            ? error.message
            : "Profile data could not be loaded. Apply the Supabase migrations and try again."
        }
        actionHref="/profile/setup"
        actionLabel="Try profile setup"
      />
    );
  }

  if (!isProfileComplete(bundle.profile, bundle.selectedSkills.length)) {
    const params = await searchParams;
    if (params.notice === "signout-failed") {
      return (
        <WorkspaceMessage
          title="Sign out did not finish."
          message="Your session is still active. Try signing out again."
        />
      );
    }
    const firstName = bundle.profile?.full_name?.split(" ")[0];
    return (
      <WorkspaceMessage
        title={`Welcome${firstName ? `, ${firstName}` : ""}.`}
        message="Finish your profile to make it easier for other KSU students to understand your interests and skills."
        actionHref="/profile/setup"
        actionLabel="Continue profile setup"
      />
    );
  }

  const params = await searchParams;
  const firstName = bundle.profile?.full_name?.split(" ")[0] ?? "there";

  return (
    <div className="workspace-page">
      {params.notice === "signout-failed" && (
        <p className="workspace-alert" role="alert">
          Sign out did not finish. Your session is still active; try again.
        </p>
      )}
      <p className="workspace-eyebrow">Workspace / Overview</p>
      <h1>Welcome, {firstName}.</h1>
      <p className="workspace-lede">
        Your profile is ready. Forge is being built to help KSU students turn
        complementary skills into better project teams.
      </p>
      <section aria-labelledby="next-step-title" className="workspace-next">
        <div>
          <p className="workspace-eyebrow">Your next step</p>
          <h2 id="next-step-title">Make sure your profile says what you want it to.</h2>
          <p>
            Keep your interests and self-reported skills current. Repository
            evidence and collaborator discovery are not available yet.
          </p>
        </div>
        <Link className="workspace-button" href="/profile">
          Review my profile
        </Link>
      </section>
      <p className="workspace-footnote">
        You can update your profile at any time. Your availability and course
        details are not shown here.
      </p>
    </div>
  );
}
