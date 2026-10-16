"use client";

// Dev harness for the operator console menu: the real WatchMenu with fixture
// account details, so each view can be looked at and screenshotted
// without a login.
//
//   ?view=overview|shift|guide|updates   which view (default overview)
//   ?admin=1                              show the administrator items
//
// Only served when the server was started with TWR_DEV_HARNESS=1.

import { useEffect, useState } from "react";
import { WatchMenu } from "../../menu/watch-menu";
import { countyFacts, plateStations } from "../../menu/county-facts";
import type { MenuView } from "../../menu/menu-types";

function param(name: string): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(name);
}

const facts = countyFacts();
const stations = plateStations();

export default function MenuHarness() {
  const [opts, setOpts] = useState<{ view: MenuView; admin: boolean } | null>(null);
  useEffect(() => {
    const t = setTimeout(() => {
      const v = param("view");
      setOpts({ view: v === "shift" || v === "guide" || v === "updates" ? v : "overview", admin: param("admin") === "1" });
    }, 0);
    return () => clearTimeout(t);
  }, []);
  if (!opts) return null;
  return <WatchMenu key={opts.view} view={opts.view} userId="dev-user" callsign="M2 CONTROL" email="dev@example.test" discord="watchroom" isAdmin={opts.admin} viewAs={opts.admin ? "admin" : null} facts={facts} stations={stations} />;
}
