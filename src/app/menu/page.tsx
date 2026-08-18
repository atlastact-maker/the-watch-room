import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/lib/auth/actions";

export default async function MenuPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="relative z-10 flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="rounded-sm border border-(--color-border) bg-(--color-surface) p-8">
          <p className="font-mono text-[11px] uppercase tracking-widest text-(--color-amber-dim)">
            Watch Room · Main Menu
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            {user.email}
          </h1>
          <p className="mt-2 text-sm text-(--color-text-muted)">
            Choose how to enter the ops floor.
          </p>

          <nav className="mt-8 space-y-3">
            <MenuItem
              href="/dashboard?new=1"
              title="Start Shift"
              subtitle="One scored, self-contained shift · pick a patch, run the board"
              accent="primary"
            />
            <MenuItem
              title="Campaign"
              subtitle="Persistent state between shifts · coming soon"
              disabled
            />
            <MenuItem
              href="/glossary"
              title="Glossary & Reference"
              subtitle="UK codes, METHANE / JESIP, callsigns, clinical scope"
            />

            <form action={logout}>
              <button
                type="submit"
                className="group flex w-full items-center justify-between rounded-sm border border-(--color-border) bg-transparent px-4 py-3 text-left transition-colors hover:border-(--color-critical) hover:bg-(--color-critical)/5"
              >
                <div>
                  <div className="font-mono text-[11px] uppercase tracking-widest text-(--color-text-dim) group-hover:text-(--color-critical)">
                    Log out
                  </div>
                  <div className="mt-0.5 text-[12px] text-(--color-text-muted)">
                    Sign out and return to login
                  </div>
                </div>
                <span className="font-mono text-[11px] text-(--color-text-dim) group-hover:text-(--color-critical)">
                  →
                </span>
              </button>
            </form>
          </nav>
        </div>
      </div>
    </div>
  );
}

function MenuItem({
  href,
  title,
  subtitle,
  accent,
  disabled,
}: {
  href?: string;
  title: string;
  subtitle: string;
  accent?: "primary";
  disabled?: boolean;
}) {
  const isPrimary = accent === "primary";
  const base =
    "group flex w-full items-center justify-between rounded-sm border px-4 py-3 text-left transition-colors";
  const primary =
    "border-(--color-amber)/60 bg-(--color-amber)/10 hover:border-(--color-amber) hover:bg-(--color-amber)/15";
  const neutral =
    "border-(--color-border) bg-transparent hover:border-(--color-amber) hover:bg-(--color-amber)/5";
  const dead =
    "border-(--color-border-subtle) bg-transparent opacity-50 cursor-not-allowed";

  const cls = `${base} ${disabled ? dead : isPrimary ? primary : neutral}`;

  const body = (
    <>
      <div>
        <div
          className={`font-mono text-[11px] uppercase tracking-widest ${
            isPrimary ? "text-(--color-amber)" : "text-(--color-text-dim)"
          }`}
        >
          {title}
        </div>
        <div className="mt-0.5 text-[12px] text-(--color-text-muted)">
          {subtitle}
        </div>
      </div>
      <span
        className={`font-mono text-[11px] ${
          isPrimary ? "text-(--color-amber)" : "text-(--color-text-dim)"
        }`}
      >
        {disabled ? "—" : "→"}
      </span>
    </>
  );

  if (disabled || !href) {
    return (
      <div aria-disabled className={cls}>
        {body}
      </div>
    );
  }
  return (
    <Link href={href} className={cls}>
      {body}
    </Link>
  );
}
