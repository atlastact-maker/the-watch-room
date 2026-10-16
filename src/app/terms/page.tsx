import type { Metadata } from "next";
import { PublicShell } from "@/app/menu/console-shell";
import { TermsView } from "./terms-view";

export const metadata: Metadata = { title: "Terms and conditions · The Watch Room" };

export default function TermsPage() {
  return (
    <PublicShell brandLine="Terms and conditions" links={[{ href: "/login", label: "Sign in" }, { href: "/signup", label: "Create an account", button: true }]}>
      <TermsView />
    </PublicShell>
  );
}
