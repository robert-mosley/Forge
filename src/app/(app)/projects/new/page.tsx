import { ProjectForm } from "@/components/projects/project-form";
import { requireUser } from "@/lib/auth/require-user";

export const metadata = { title: "Add project" };

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  await requireUser();
  const params = await searchParams;

  return (
    <div className="workspace-page workspace-form-page">
      <div className="workspace-form-intro">
        <p className="workspace-eyebrow">Portfolio / New project</p>
        <h1>Show how you solve problems.</h1>
        <p className="workspace-lede">
          Add the work, your role, and the evidence you are comfortable sharing.
        </p>
      </div>
      <ProjectForm returnTo={params.from === "setup" ? "/profile" : "/projects"} />
    </div>
  );
}
