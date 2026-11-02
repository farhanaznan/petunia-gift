import { AdminLoginForm } from "./login-form";

export const metadata = { title: "Login" };

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const nextPath =
    next && next.startsWith("/admin") && !next.startsWith("//")
      ? next
      : "/admin";

  return (
    <div className="admin-login-page">
      <div className="admin-login-card panel elevated stack">
        <p className="page-kicker">Petunia Ops</p>
        <h1
          style={{
            fontFamily: "var(--font-display), sans-serif",
            fontSize: "2.2rem",
            letterSpacing: "-0.04em",
            margin: 0,
            lineHeight: 1,
          }}
        >
          Admin login
        </h1>
        <p className="lead" style={{ marginBottom: 0 }}>
          Soft-launch console — email and password required.
        </p>
        <AdminLoginForm nextPath={nextPath} />
      </div>
    </div>
  );
}
