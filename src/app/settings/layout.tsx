import { requireSession } from "@/lib/auth/require-admin";

// Settings reads and writes this account's own data, so it needs a
// session of its own rather than trusting the proxy — see requireSession.
// The page itself is a client component and cannot await the check.
export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSession();
  return <>{children}</>;
}
