import type { ReactNode } from "react";

export function PageShell({
  title,
  lead,
  kicker,
  children,
}: {
  title: string;
  lead?: string;
  kicker?: string;
  children?: ReactNode;
}) {
  return (
    <main className="page-shell">
      {kicker ? <p className="page-kicker">{kicker}</p> : null}
      <h1>{title}</h1>
      {lead ? <p className="lead">{lead}</p> : null}
      {children}
    </main>
  );
}
