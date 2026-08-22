"use client";

import { useEffect, useState } from "react";

/** Live UTC clock for the terminal HUD. Renders a placeholder until
 *  mounted so server and client markup agree. */
export function UtcClock() {
  const [now, setNow] = useState<string | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date().toISOString().slice(11, 19));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="tabular-nums">UTC {now ?? "--:--:--"}</span>;
}
