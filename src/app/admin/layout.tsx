export const metadata = {
  title: {
    default: "Admin",
    template: "%s · Petunia Admin",
  },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
