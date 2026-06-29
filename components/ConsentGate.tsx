"use client";
import { useState } from "react";
import type { User } from "./types";
import { api } from "./api";

// Shown to under-13 makers who haven't gotten a grown-up's permission yet (COPPA).
// They can browse, but must get consent before posting/commenting.
export default function ConsentGate({
  onConsented,
  onSkip,
}: {
  onConsented: (u: User) => void;
  onSkip: () => void;
}) {
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setErr("");
    if (!agreed) return setErr("Please ask your grown-up to check the box. 🛡️");
    setBusy(true);
    try {
      const u = await api.consent(email.trim());
      onConsented(u);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="scrim" style={{ background: "transparent", position: "static", minHeight: "100vh" }}>
      <div className="modal">
        <div style={{ textAlign: "center", fontSize: 56 }}>🛡️</div>
        <h2>One step for grown-ups</h2>
        <p className="sub">
          Sparkle is for kids, so we need a parent or guardian to say it&apos;s okay before you
          share projects. (You can still look around in the meantime!)
        </p>
        {err && <div className="err">{err}</div>}
        <div className="field">
          <label>Grown-up&apos;s email</label>
          <input type="text" inputMode="email" value={email}
            onChange={(e) => setEmail(e.target.value)} placeholder="mom-or-dad@email.com" />
        </div>
        <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontWeight: 700, fontSize: 14, cursor: "pointer", margin: "4px 2px 8px" }}>
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ marginTop: 3 }} />
          <span>I&apos;m a parent/guardian and I give permission for my child to use Sparkle and share projects.</span>
        </label>
        <button className="primary" disabled={busy} onClick={submit}>
          {busy ? "Saving..." : "Give permission ✅"}
        </button>
        <button className="logout" style={{ display: "block", margin: "12px auto 0" }} onClick={onSkip}>
          Just look around for now
        </button>
        <div className="safe-note" style={{ marginTop: 14 }}>
          🛡️ <span>We only use this email for safety and account help — never shown to other kids.</span>
        </div>
      </div>
    </div>
  );
}
