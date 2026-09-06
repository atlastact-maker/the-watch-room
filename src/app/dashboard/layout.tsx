import { requireAdmin } from "@/lib/auth/require-admin";

// Administrator-only while the site is closed to everything but the
// advisor programme. Gating in the layout covers this route whether its
// page is a server or a client component.
//
// VECTOR's type is IBM Plex, the face the CAD prototype was drawn in.
// It is linked at runtime rather than pulled through next/font so the
// build never depends on reaching Google Fonts; vector.css carries a
// system fallback stack for a browser that cannot fetch it either.
const PLEX_URL =
  "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="stylesheet" href={PLEX_URL} />
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </>
  );
}
