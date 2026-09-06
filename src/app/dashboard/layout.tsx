import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { requireAdmin } from "@/lib/auth/require-admin";

// VECTOR's type: IBM Plex, the face the CAD prototype was drawn in. Loaded
// here rather than in the root layout so the rest of the site keeps Geist.
const plexSans = IBM_Plex_Sans({
  variable: "--font-vector-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});
const plexMono = IBM_Plex_Mono({
  variable: "--font-vector-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

// Administrator-only while the site is closed to everything but the
// advisor programme. Gating in the layout covers this route whether its
// page is a server or a client component.
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return (
    <div className={`${plexSans.variable} ${plexMono.variable} flex min-h-0 flex-1 flex-col`}>
      {children}
    </div>
  );
}
