import { PageShell } from "@/components/page-shell";

export const metadata = { title: "Login" };

/**
 * Admin credentials session stub.
 * Wire iron-session + bcrypt verify against `admins` in Phase 1.
 */
export default function AdminLoginPage() {
  return (
    <PageShell
      title="Admin login"
      lead="Email + password stub. Session cookie: petunia_admin_session (iron-session)."
    >
      <form className="panel stack" style={{ maxWidth: 360 }}>
        <label className="stack">
          <span>Email</span>
          <input name="email" type="email" autoComplete="username" disabled placeholder="admin@petunia.local" />
        </label>
        <label className="stack">
          <span>Password</span>
          <input name="password" type="password" autoComplete="current-password" disabled placeholder="••••••••" />
        </label>
        <button className="button" type="button" disabled>
          Sign in (wire in Phase 1)
        </button>
      </form>
    </PageShell>
  );
}
