import Link from "next/link";
import { requireUser } from "@/lib/auth/require-user";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { user } = await requireUser();

  return (
    <div className="workspace-page">
      <p className="workspace-eyebrow">Account / Settings</p>
      <h1>Profile preferences.</h1>
      <p className="workspace-lede">Control your Forge profile and account details.</p>

      <section className="settings-grid">
        <Link href="/profile?edit=1">
          <span>Profile and portfolio</span>
          <strong>Edit public information</strong>
        </Link>
        <Link href="/profile">
          <span>Discovery privacy</span>
          <strong>Manage profile visibility</strong>
        </Link>
        <div>
          <span>Signed-in account</span>
          <strong>{user.email}</strong>
        </div>
      </section>
    </div>
  );
}
