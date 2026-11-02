import { PageShell } from "@/components/page-shell";
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
    <div style={{ padding: "2rem clamp(1rem, 4vw, 3rem)" }}>
      <PageShell
        title="Admin login"
        lead="Sign in with your admin email. Session cookie: petunia_admin_session (iron-session + bcrypt)."
      >
        <AdminLoginForm nextPath={nextPath} />
      </PageShell>
    </div>
  );
}
