import type { MetadataRoute } from "next";

// Makes Sparkle an installable PWA — the foundation for the Play Store (TWA) wrapper.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sparkle — Show Off Cool Projects",
    short_name: "Sparkle",
    description:
      "A friendly, safe place for kids to share art, videos, games, music & links — and inspire each other to make more.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fff7fb",
    theme_color: "#ff5fa2",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    categories: ["education", "social", "kids"],
  };
}
