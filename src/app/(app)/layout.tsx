import "./workspace.css";
import { WorkspaceShell } from "@/components/app/workspace-shell";
import { WorkspaceMessage } from "@/components/app/workspace-message";
import { requireUser } from "@/lib/auth/require-user";
import { isSupabaseConfigured } from "@/lib/env";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  if (!isSupabaseConfigured()) {
    return (
      <WorkspaceShell email="Supabase not configured">
        <WorkspaceMessage
          title="Account services are not connected."
          message="Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your local .env.local file or Replit Secrets, then restart the development server."
          actionHref="/login"
          actionLabel="Open account setup"
        />
      </WorkspaceShell>
    );
  }

  const { user } = await requireUser();

  return <WorkspaceShell email={user.email ?? "Signed-in student"}>{children}</WorkspaceShell>;
}
