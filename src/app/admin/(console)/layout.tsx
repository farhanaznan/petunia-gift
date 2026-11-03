import { AdminNav } from "@/components/admin-nav";
import { requireAdminSession } from "@/lib/auth/session";

export default async function AdminConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdminSession();

  return (
    <div className="admin-shell">
      <AdminNav email={session?.email} />
      <div className="admin-main">{children}</div>
    </div>
  );
}
