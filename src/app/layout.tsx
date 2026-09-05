import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
      <body className="min-h-full flex flex-col">
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
