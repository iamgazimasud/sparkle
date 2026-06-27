"use client";
import { useState } from "react";
import { AVATARS } from "@/lib/constants";
import type { User } from "./types";
import { api } from "./api";
import { confetti } from "./fx";

// Shown after a user signs in with Clerk but hasn't created their Sparkle profile yet.
export default function Onboarding({ onDone }: { onDone: (u: User) => void }) {
  const [step, setStep] = useState(1);
  const [avatar, setAvatar] = useState("🦊");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function finish() {
    setErr("");
    if (!name.trim()) return setErr("Pick a nickname!");
    setBusy(true);
    try {
      const u = await api.createProfile({ name: name.trim(), age: Number(age) || 10, avatar });
      confetti();
      onDone(u);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="scrim" style={{ background: "transparent", position: "static", minHeight: "100vh" }}>
      <div className="modal">
        {step === 1 ? (
          <>
            <h2>Pick your avatar 🦊</h2>
            <p className="sub">Choose a fun character. No photos needed — stay anonymous &amp; safe!</p>
            <div className="emoji-grid" style={{ maxHeight: 200 }}>
              {AVATARS.map((a) => (
                <button key={a} className={a === avatar ? "on" : ""} onClick={() => setAvatar(a)}>{a}</button>
              ))}
            </div>
            <button className="primary" onClick={() => setStep(2)}>Next</button>
          </>
        ) : (
          <>
            <h2>Make your maker profile</h2>
            <p className="sub">Use a nickname — never your real full name. 🛡️</p>
            {err && <div className="err">{err}</div>}
            <div className="field">
              <label>Nickname</label>
              <input type="text" maxLength={16} value={name}
                onChange={(e) => setName(e.target.value)} placeholder="StarMaker123" />
            </div>
            <div className="field">
              <label>How old are you?</label>
              <select value={age} onChange={(e) => setAge(e.target.value)}>
                <option value="">Choose...</option>
                {Array.from({ length: 9 }, (_, i) => i + 6).map((a) => (
                  <option key={a} value={a}>{a} years old</option>
                ))}
              </select>
            </div>
            <button className="primary" disabled={busy} onClick={finish}>
              {busy ? "Creating..." : "Start Sparkling! ✨"}
            </button>
          </>
        )}
        <div className="ob-dots"><i className={step >= 1 ? "on" : ""} /><i className={step >= 2 ? "on" : ""} /></div>
      </div>
    </div>
  );
}
