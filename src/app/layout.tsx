import type { Metadata } from "next";
// The fonts ship in the package, so a build never has to reach Google
// Fonts: a fetch that fails there fails the whole deployment. The
// package sets the same --font-geist-sans and --font-geist-mono variables
// the stylesheet reads.
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

const geistSans = GeistSans;
const geistMono = GeistMono;

export const metadata: Metadata = {
  metadataBase: new URL("https://the-watch-room.vercel.app"),
  title: "The Watch Room",
  description:
    "Emergency Services Incident Management Simulator. Command Fire, Ambulance and Police from one seat — real stations, real resources. You're in command and control.",
  openGraph: {
    title: "The Watch Room",
    description:
      "Emergency Services Incident Management Simulator. Command Fire, Ambulance and Police from one seat. You're in command and control.",
    siteName: "The Watch Room",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Watch Room",
    description:
      "Emergency Services Incident Management Simulator. You're in command and control.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
