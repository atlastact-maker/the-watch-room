import Link from "next/link";
import { ForgotPasswordForm } from "./forgot-form";

export default function ForgotPasswordPage() {
  return (
    <div className="relative z-10 flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link
          href="/login"
          className="font-mono text-[11px] uppercase tracking-widest text-(--color-text-dim) hover:text-(--color-text)"
        >
          ← Log in
        </Link>

        <div className="mt-6 rounded-sm border border-(--color-border) bg-(--color-surface) p-8">
          <p className="font-mono text-[11px] uppercase tracking-widest text-(--color-amber-dim)">
            Watch Room Access
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Reset password</h1>
          <p className="mt-2 text-sm text-(--color-text-muted)">
            Enter your account email and we&apos;ll send a reset link.
          </p>

          <div className="mt-8">
            <ForgotPasswordForm />
          </div>
        </div>
      </div>
    </div>
  );
}
