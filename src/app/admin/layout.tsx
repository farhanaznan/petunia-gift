import { AdminNav } from "@/components/admin-nav";

export const metadata = {
  title: {
    default: "Admin",
    template: "%s · Petunia Admin",
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-shell">
      <AdminNav />
      <div className="admin-main">{children}</div>
    </div>
  );
}
