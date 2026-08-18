"use client";

import { useRouter } from "next/navigation";
import { GlossaryOverlay } from "@/app/dashboard/components/glossary-overlay";

export function GlossaryPageView() {
  const router = useRouter();
  return <GlossaryOverlay open onClose={() => router.push("/menu")} />;
}
