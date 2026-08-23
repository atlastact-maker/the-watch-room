"use client";

// Invisible: completes advisor registration for accounts that signed up
// with the advisor box ticked but only got their session after email
// confirmation (metadata → advisors table, once).

import { useEffect } from "react";
import { syncAdvisorProfile } from "@/lib/advisor-sync";

export function AdvisorSync() {
  useEffect(() => {
    void syncAdvisorProfile();
  }, []);
  return null;
}
