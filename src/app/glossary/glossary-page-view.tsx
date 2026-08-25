"use client";

import { useRouter } from "next/navigation";
import { GlossaryOverlay } from "@/app/dashboard/components/glossary-overlay";
import type { StationWithAppliances } from "@/app/dashboard/page";

export function GlossaryPageView({
  stations,
}: {
  stations: StationWithAppliances[];
}) {
  const router = useRouter();
  return (
    <GlossaryOverlay open onClose={() => router.push("/menu")} stations={stations} />
  );
}
