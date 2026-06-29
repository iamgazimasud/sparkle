"use client";
import { linkInfo } from "@/lib/constants";

// A friendly, tappable card for a shared social/video link (TikTok, Vimeo, etc.).
// Opens in a new tab. Used when a link isn't an embeddable YouTube video.
export default function LinkCard({ url, big = false }: { url: string; big?: boolean }) {
  const info = linkInfo(url);
  if (!info) return null;
  return (
    <a
      className={`link-card${big ? " big" : ""}`}
      href={url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      onClick={(e) => e.stopPropagation()}
    >
      <span className="lc-emoji">{info.emoji}</span>
      <div className="lc-body">
        <div className="lc-label">Watch on {info.label}</div>
        <div className="lc-domain">{info.domain}</div>
      </div>
      <span className="lc-open">Open ↗</span>
    </a>
  );
}
