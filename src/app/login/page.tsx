import Link from "next/link";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="relative z-10 flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="font-mono text-[11px] uppercase tracking-widest text-(--color-text-dim) hover:text-(--color-text)"
        >
          ← The Watch Room
        </Link>

        <div className="mt-6 rounded-sm border border-(--color-border) bg-(--color-surface) p-8">
          <p className="font-mono text-[11px] uppercase tracking-widest text-(--color-amber-dim)">
            Watch Room Access
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Log in</h1>
          <p className="mt-2 text-sm text-(--color-text-muted)">
            Resume an existing shift or campaign.
          </p>

          {error === "verify_failed" && (
            <p className="mt-6 rounded-sm border border-(--color-critical)/50 bg-(--color-critical)/10 px-3 py-2.5 text-[13px] leading-relaxed text-(--color-critical)">
              That confirmation link didn&apos;t work — it may have expired
              or already been used. Log in below, or{" "}
              <Link href="/signup" className="underline underline-offset-2">
                register again
              </Link>{" "}
              to get a fresh one.
            </p>
          )}

          <div className="mt-8">
            <LoginForm />
          </div>

          <p className="mt-6 text-center font-mono text-[11px] uppercase tracking-widest text-(--color-text-dim)">
            No account?{" "}
            <Link href="/signup" className="text-(--color-amber) hover:text-amber-400">
              Begin a shift
            </Link>
          </p>
        </div>

        <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-widest leading-relaxed text-(--color-text-dim)">
          Part of the emergency services?{" "}
          <Link href="/signup?advisor=1" className="text-(--color-info) hover:text-blue-300">
            Register as a development advisor →
          </Link>
        </p>
      </div>
    </div>
  );
}
