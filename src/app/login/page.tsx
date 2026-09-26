import Link from "next/link";
import { LoginForm } from "./login-form";
import { Notice } from "@/app/components/notice";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;
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
            <Notice tone="critical" title="That link didn't work" className="mt-6">
              <p>
                It may have expired or already been used. Log in below, or get a fresh one by{" "}
                <Link href="/signup" className="text-(--color-text) underline underline-offset-2">registering</Link>{" "}
                or{" "}
                <Link href="/forgot-password" className="text-(--color-text) underline underline-offset-2">resetting your password</Link>.
              </p>
            </Notice>
          )}

          <div className="mt-8">
            <LoginForm next={next} />
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
