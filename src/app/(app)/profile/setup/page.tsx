import Link from "next/link";
import { WorkspaceMessage } from "@/components/app/workspace-message";
import { EngineeringProfileForm } from "@/components/profile/engineering-profile-form";
import { requireUser } from "@/lib/auth/require-user";
import { isSupabaseConfigured } from "@/lib/env";
import { isProfileComplete } from "@/schemas/profile.schema";
import {
  getProfileBundle,
  ProfileServiceError,
} from "@/services/profile.service";

export const metadata = { title: "Set up your profile" };

export default async function ProfileSetupPage({
  searchParams,
}: {
  searchParams: Promise<{ imported?: string }>;
}) {
  if (!isSupabaseConfigured()) {
    return (
      <WorkspaceMessage
        title="Profile setup is not ready."
        message="Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
        actionHref="/login"
        actionLabel="Open account setup"
      />
    );
  }

  const { supabase, user } = await requireUser();

  try {
    const bundle = await getProfileBundle(supabase, user.id);
    const params = await searchParams;

    if (isProfileComplete(bundle.profile, bundle.selectedSkills.length)) {
      return (
        <div className="workspace-page">
          <p className="workspace-eyebrow">Profile / 02 / Portfolio</p>
          <h1>Add a project you are proud of.</h1>
          <p className="workspace-lede">
            Your profile is ready. Projects give teammates concrete evidence of
            how you think and build, but this step is optional.
          </p>
          <div className="onboarding-actions">
            <Link className="workspace-button" href="/projects/new?from=setup">
              Add my first project
            </Link>
            <Link className="portfolio-edit-link" href="/dashboard">
              Skip for now
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="workspace-page workspace-form-page">
        <div className="workspace-form-intro">
          {params.imported === "1" && (
            <p className="workspace-success" role="status">
              Your GitHub portfolio draft is ready. Review the details below and
              finish setup.
            </p>
          )}
          <p className="workspace-eyebrow">First, your profile / 01</p>
          <h1>What do you bring to the work?</h1>
          <p className="workspace-lede">
            Give other KSU builders a clear, honest introduction. Skills here
            are self-reported until you connect project evidence.
          </p>
        </div>
        <EngineeringProfileForm
          initialProfile={bundle.profile}
          skills={bundle.skills}
          selectedSkills={bundle.selectedSkills}
          mode="setup"
        />
      </div>
    );
  } catch (error) {
    return (
      <WorkspaceMessage
        title="Profile setup is not ready."
        message={
          error instanceof ProfileServiceError
            ? error.message
            : "Forge could not load the profile setup data. Apply the Supabase migrations and try again."
        }
      />
    );
  }
}
