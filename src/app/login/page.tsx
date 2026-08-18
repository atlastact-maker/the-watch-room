import Link from "next/link";
import { LoginForm } from "./login-form";

export default function LoginPage() {
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
      </div>
    </div>
  );
}
