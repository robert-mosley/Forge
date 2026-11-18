import "./workspace.css";
import { WorkspaceShell } from "@/components/app/workspace-shell";
import { requireUser } from "@/lib/auth/require-user";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { user } = await requireUser();

  return <WorkspaceShell email={user.email ?? "Signed-in student"}>{children}</WorkspaceShell>;
}
