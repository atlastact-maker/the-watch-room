import { notFound } from "next/navigation";

// Read the flag per request, never at build: a static render would bake
// the 404 in.
export const dynamic = "force-dynamic";

// Development harness only. The page renders the real MDT against a
// fixture world so its screens can be looked at and screenshotted without
// a shift, a login or Supabase. It does not exist unless the server was
// started with TWR_DEV_HARNESS=1, and the auth proxy keeps it behind a
// session wherever Supabase is configured.
export default function Layout({ children }: { children: React.ReactNode }) {
  if (process.env.TWR_DEV_HARNESS !== "1") notFound();
  return <>{children}</>;
}
