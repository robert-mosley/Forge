import Link from "next/link";

export function WorkspaceMessage({
  title,
  message,
  actionHref = "/dashboard",
  actionLabel = "Return to overview",
}: {
  title: string;
  message: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <section aria-labelledby="workspace-message-title" className="workspace-message">
      <p className="workspace-eyebrow">KSUForge setup</p>
      <h1 id="workspace-message-title">{title}</h1>
      <p>{message}</p>
      <Link className="workspace-button" href={actionHref}>
        {actionLabel}
      </Link>
    </section>
  );
}
