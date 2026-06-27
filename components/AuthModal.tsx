"use client";
import { useState } from "react";
import { AVATARS } from "@/lib/constants";
import type { User } from "./types";
import { api } from "./api";

export default function AuthModal({ onDone }: { onDone: (u: User) => void }) {
  const [mode, setMode] = useState<"welcome" | "join" | "login">("welcome");
  const [step, setStep] = useState(1);
  const [avatar, setAvatar] = useState("🦊");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function join() {
    setErr("");
    if (!name.trim()) return setErr("Pick a nickname!");
    if (!/^\d{4}$/.test(pin)) return setErr("Your secret PIN must be 4 numbers.");
    setBusy(true);
    try {
      const u = await api.signup({ name: name.trim(), pin, age: Number(age) || 10, avatar });
      onDone(u);
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }

  async function login() {
    setErr("");
    setBusy(true);
    try {
      const u = await api.login({ name: name.trim(), pin });
      onDone(u);
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }

  return (
    <div className="scrim">
      <div className="modal">
        {mode === "welcome" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 64 }}>✨</div>
            <h2>Welcome to Sparkle!</h2>
            <p className="sub">
              The friendly place where kids show off the cool stuff they make — art, videos,
              games, music & more — and inspire each other to make even more!
            </p>
            <button className="primary" onClick={() => { setMode("join"); setStep(1); }}>
              I&apos;m new — let&apos;s go! 🚀
            </button>
            <button className="logout" onClick={() => setMode("login")}>I already have an account</button>
          </div>
        )}

        {mode === "join" && (
          <>
            {step === 1 && (
              <>
                <h2>Pick your avatar 🦊</h2>
                <p className="sub">Choose a fun character. No photos needed — stay anonymous & safe!</p>
                <div className="emoji-grid" style={{ maxHeight: 180 }}>
                  {AVATARS.map((a) => (
                    <button key={a} className={a === avatar ? "on" : ""} onClick={() => setAvatar(a)}>{a}</button>
                  ))}
                </div>
                <button className="primary" onClick={() => setStep(2)}>Next</button>
              </>
            )}
            {step === 2 && (
              <>
                <h2>Make your account</h2>
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
                <div className="field">
                  <label>Secret PIN (4 numbers — remember it!)</label>
                  <input type="password" inputMode="numeric" maxLength={4} value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} placeholder="••••" />
                </div>
                <button className="primary" disabled={busy} onClick={join}>
                  {busy ? "Creating..." : "Start Sparkling! ✨"}
                </button>
                <div className="safe-note">🛡️ <span>Keep your PIN secret. Never share your real name, school, or address.</span></div>
              </>
            )}
            <div className="ob-dots"><i className={step >= 1 ? "on" : ""} /><i className={step >= 2 ? "on" : ""} /></div>
          </>
        )}

        {mode === "login" && (
          <>
            <h2>Welcome back! 👋</h2>
            <p className="sub">Log in with your nickname and secret PIN.</p>
            {err && <div className="err">{err}</div>}
            <div className="field">
              <label>Nickname</label>
              <input type="text" maxLength={16} value={name}
                onChange={(e) => setName(e.target.value)} placeholder="StarMaker123" />
            </div>
            <div className="field">
              <label>Secret PIN</label>
              <input type="password" inputMode="numeric" maxLength={4} value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} placeholder="••••" />
            </div>
            <button className="primary" disabled={busy} onClick={login}>
              {busy ? "Logging in..." : "Log in"}
            </button>
            <button className="logout" onClick={() => { setMode("welcome"); setErr(""); }}>
              ← Back
            </button>
          </>
        )}
      </div>
    </div>
  );
}
