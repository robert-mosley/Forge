import { WorkspaceMessage } from "@/components/app/workspace-message";
import { ProfileForm } from "@/components/profile/profile-form";
import { requireUser } from "@/lib/auth/require-user";
import { isProfileComplete } from "@/schemas/profile.schema";
import {
  getProfileBundle,
  ProfileServiceError,
} from "@/services/profile.service";

export const metadata = { title: "My profile" };

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string }>;
}) {
  const { supabase, user } = await requireUser();

  try {
    const bundle = await getProfileBundle(supabase, user.id);

    if (!isProfileComplete(bundle.profile, bundle.selectedSkills.length)) {
      return (
        <WorkspaceMessage
          title="Finish your profile first."
          message="Add your academic details and at least one skill before reviewing your profile."
          actionHref="/profile/setup"
          actionLabel="Continue setup"
        />
      );
    }

    const params = await searchParams;

    return (
      <div className="workspace-page workspace-form-page">
        <p className="workspace-eyebrow">Your profile / KSU</p>
        <h1>Make your strengths visible.</h1>
        <p className="workspace-lede">
          This information is visible to signed-in Forge students. Your
          availability and course records remain private.
        </p>
        {params.updated === "1" && (
          <p className="workspace-success" role="status">
            Your profile has been updated.
          </p>
        )}
        <ProfileForm
          initialProfile={bundle.profile}
          skills={bundle.skills}
          selectedSkills={bundle.selectedSkills}
          mode="edit"
        />
      </div>
    );
  } catch (error) {
    return (
      <WorkspaceMessage
        title="Your profile could not be loaded."
        message={
          error instanceof ProfileServiceError
            ? error.message
            : "Try again after checking the Supabase setup."
        }
      />
    );
  }
}
