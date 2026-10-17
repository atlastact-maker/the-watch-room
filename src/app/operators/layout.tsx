import { requireShift } from "@/lib/auth/require-admin";

// Operators only: the colleague list belongs to the console, so the
// console's door applies.
export default async function Layout({ children }: { children: React.ReactNode }) {
  await requireShift();
  return <>{children}</>;
}
