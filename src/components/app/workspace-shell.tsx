import Link from "next/link";
import { signOutAction } from "@/app/(auth)/actions";

export function WorkspaceShell({
  children,
  email,
}: {
  children: React.ReactNode;
  email: string;
}) {
  return (
    <div className="workspace-shell">
      <a className="workspace-skip" href="#workspace-main">
        Skip to content
      </a>
      <header className="workspace-header">
        <Link aria-label="Forge dashboard" className="workspace-brand" href="/dashboard">
          <span aria-hidden="true" className="workspace-brand-mark">
            F
          </span>
          Forge
        </Link>
        <nav aria-label="Workspace navigation" className="workspace-nav">
          <Link href="/dashboard">Overview</Link>
          <Link href="/profile">My profile</Link>
        </nav>
        <div className="workspace-account">
          <span className="workspace-email">{email}</span>
          <form action={signOutAction}>
            <button className="workspace-signout" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="workspace-main" id="workspace-main">
        {children}
      </main>
      <footer className="workspace-footer">
        <span>Forge · KSU</span>
        <span>Built around the work ahead.</span>
      </footer>
    </div>
  );
}
