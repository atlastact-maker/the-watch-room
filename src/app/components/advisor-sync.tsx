"use client";

// Invisible: completes advisor registration for accounts that signed up
// with the advisor box ticked but only got their session after email
// confirmation (metadata → advisors table, once).
//
// Mounted on /standby as well as /menu, and that is the point: an
// applicant who is not an operator never reaches /menu — they are held
// at /standby — so mounting this only there left their application
// sitting in user_metadata, invisible to the admin area, while the page
// told them it had been received.
//
// On a successful file, refresh so the server re-renders the page with
// the row present and the applicant's standing updates in place.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { syncAdvisorProfile } from "@/lib/advisor-sync";

export function AdvisorSync() {
  const router = useRouter();
  useEffect(() => {
    let cancelled = false;
    void syncAdvisorProfile().then((filed) => {
      if (filed && !cancelled) router.refresh();
    });
    return () => {
      cancelled = true;
    };
  }, [router]);
  return null;
}
