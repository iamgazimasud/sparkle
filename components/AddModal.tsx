"use client";
import { useRef, useState } from "react";
import { CATS, ART_EMOJIS, ytId } from "@/lib/constants";
import type { Project, Award } from "./types";
import { api } from "./api";

const TYPES = Object.entries(CATS).map(([k, v]) => ({ t: k, e: v.e, label: v.label }));

export default function AddModal({
  initialType,
  onClose,
  onCreated,
}: {
  initialType?: string;
  onClose: () => void;
  onCreated: (p: Project, award: Award) => void;
}) {
  const [type, setType] = useState(initialType && CATS[initialType] ? initialType : "art");
  const [cover, setCover] = useState("🎨");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [link, setLink] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const showLink = type === "youtube" || type === "video";
  const showEmoji = type !== "youtube";

  async function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const data = await compressImage(file);
    setImage(data);
  }

  async function submit() {
    setErr("");
    if (!title.trim()) return setErr("Give your project a name! ✏️");
    if (type === "youtube" && !ytId(link)) return setErr("Paste a valid YouTube link 📺");
    setBusy(true);
    try {
      const { project, award } = await api.createProject({
        type, title: title.trim(), desc: desc.trim(), cover,
        link: showLink ? link.trim() : undefined,
        image: showEmoji ? image : null,
      });
      onCreated(project, award);
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }

  return (
    <div className="scrim" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <button className="x" onClick={onClose}>×</button>
        <h2>Share your project! 🚀</h2>
        <p className="sub">Show the world what you made. You&apos;ll earn ⚡ Sparks!</p>
        {err && <div className="err">{err}</div>}

        <div className="field">
          <label>What kind of project?</label>
          <div className="type-pick">
            {TYPES.map(({ t, e, label }) => (
              <button key={t} className={`tp ${t === type ? "on" : ""}`} onClick={() => setType(t)}>
                <span className="e">{e}</span>{label}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Give it a cool name</label>
          <input type="text" maxLength={60} value={title}
            onChange={(e) => setTitle(e.target.value)} placeholder="My amazing dragon drawing!" />
        </div>

        <div className="field">
          <label>Tell us about it</label>
          <textarea maxLength={280} value={desc}
            onChange={(e) => setDesc(e.target.value)} placeholder="I drew this with markers. It took me 2 hours!" />
        </div>

        {showLink && (
          <div className="field">
            <label>{type === "youtube" ? "Paste a YouTube link 📺" : "Paste a video link (optional) 🎬"}</label>
            <input type="url" value={link} onChange={(e) => setLink(e.target.value)}
              placeholder="https://youtube.com/watch?v=..." />
            <div className="hint">We&apos;ll show your video right here ✨</div>
          </div>
        )}

        {showEmoji && (
          <div className="field">
            <label>Add a photo of your project (optional)</label>
            {image ? (
              <div className="upload-prev">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt="preview" />
                <button className="rm" onClick={() => { setImage(null); if (fileRef.current) fileRef.current.value = ""; }}>×</button>
              </div>
            ) : (
              <label className="upload-btn">
                📷 Tap to add a photo
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickFile} />
              </label>
            )}
          </div>
        )}

        {showEmoji && (
          <div className="field">
            <label>Or pick a cover picture</label>
            <div className="emoji-grid">
              {ART_EMOJIS.map((e) => (
                <button key={e} className={e === cover ? "on" : ""} onClick={() => setCover(e)}>{e}</button>
              ))}
            </div>
          </div>
        )}

        <button className="primary" disabled={busy} onClick={submit}>
          {busy ? "Posting..." : "Post it! 🎉"}
        </button>

        <div className="safe-note">🛡️ <span><b>Stay safe:</b> Never share your full name, school, address, or phone number. Be kind in everything you post!</span></div>
      </div>
    </div>
  );
}

/** Resize + compress an image to a small JPEG data URL so it fits in the DB. */
function compressImage(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 700;
        let { width, height } = img;
        if (width > max || height > max) {
          const s = max / Math.max(width, height);
          width = Math.round(width * s);
          height = Math.round(height * s);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.78));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
