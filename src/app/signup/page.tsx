import Link from "next/link";
import { SignupForm } from "./signup-form";

export default function SignupPage() {
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
            Begin a shift
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Create account</h1>
          <p className="mt-2 text-sm text-(--color-text-muted)">
            Required to save campaign progress between shifts.
          </p>

          <div className="mt-8">
            <SignupForm />
          </div>

          <p className="mt-6 text-center font-mono text-[11px] uppercase tracking-widest text-(--color-text-dim)">
            Existing operator?{" "}
            <Link href="/login" className="text-(--color-amber) hover:text-amber-400">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
