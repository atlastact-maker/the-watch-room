import { requireAdmin } from "@/lib/auth/require-admin";

// Administrator-only while the site is closed to everything but the
// advisor programme. Gating in the layout covers this route whether its
// page is a server or a client component.
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return <>{children}</>;
}
