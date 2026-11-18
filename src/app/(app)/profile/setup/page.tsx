import Link from "next/link";
import { WorkspaceMessage } from "@/components/app/workspace-message";
import { ProfileForm } from "@/components/profile/profile-form";
import { requireUser } from "@/lib/auth/require-user";
import { isProfileComplete } from "@/schemas/profile.schema";
import {
  getProfileBundle,
  ProfileServiceError,
} from "@/services/profile.service";

export const metadata = { title: "Set up your profile" };

export default async function ProfileSetupPage() {
  const { supabase, user } = await requireUser();

  try {
    const bundle = await getProfileBundle(supabase, user.id);

    if (isProfileComplete(bundle.profile, bundle.selectedSkills.length)) {
      return (
        <div className="workspace-page">
          <p className="workspace-eyebrow">Profile / Ready</p>
          <h1>Your profile is set.</h1>
          <p className="workspace-lede">
            You can review or update your information whenever you need to.
          </p>
          <Link className="workspace-button" href="/profile">
            Review my profile
          </Link>
        </div>
      );
    }

    return (
      <div className="workspace-page workspace-form-page">
        <div className="workspace-form-intro">
          <p className="workspace-eyebrow">First, your profile / 01</p>
          <h1>What do you bring to the work?</h1>
          <p className="workspace-lede">
            Give other KSU builders a clear, honest introduction. Skills here
            are self-reported until you connect project evidence.
          </p>
        </div>
        <ProfileForm
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
