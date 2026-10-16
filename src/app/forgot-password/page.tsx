import type { Metadata } from "next";
import { PublicShell } from "@/app/menu/console-shell";
import { ForgotView } from "./forgot-view";

export const metadata: Metadata = { title: "Reset password · The Watch Room" };

export default function ForgotPasswordPage() {
  return (
    <PublicShell brandLine="Operator access" width="narrow" links={[{ href: "/login", label: "Log in", button: true }]}>
      <ForgotView />
    </PublicShell>
  );
}
