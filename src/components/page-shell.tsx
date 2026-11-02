import type { ReactNode } from "react";

export function PageShell({
  title,
  lead,
  kicker,
  children,
  align = "center",
}: {
  title: string;
  lead?: string;
  kicker?: string;
  children?: ReactNode;
  align?: "center" | "left";
}) {
  return (
    <main
      className="page-shell"
      style={align === "left" ? { textAlign: "left" } : undefined}
    >
      {kicker ? <p className="page-kicker">{kicker}</p> : null}
      <h1 style={align === "left" ? { textAlign: "left" } : undefined}>
        {title}
      </h1>
      {lead ? (
        <p
          className="lead"
          style={
            align === "left"
              ? { textAlign: "left", marginLeft: 0, marginRight: 0 }
              : undefined
          }
        >
          {lead}
        </p>
      ) : null}
      {children}
    </main>
  );
}
