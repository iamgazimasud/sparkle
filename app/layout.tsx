import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { clerkEnabledPublic } from "@/lib/clerk";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sparkle ✨ — Where Kids Show Off Cool Projects",
  description:
    "A friendly, safe place for kids to share their art, videos, games, music and YouTube projects — and cheer each other on.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ff5fa2",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Wrap content with Clerk only when keys are configured; otherwise the app still
  // renders (showing a "finish setup" screen). ClerkProvider lives inside <body>.
  const content = clerkEnabledPublic ? (
    <ClerkProvider appearance={{ variables: { colorPrimary: "#8a5cff" } }}>{children}</ClerkProvider>
  ) : (
    children
  );

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
      </head>
      <body>
        <div className="blob b1" /><div className="blob b2" />
        <div className="blob b3" /><div className="blob b4" />
        {content}
      </body>
    </html>
  );
}
