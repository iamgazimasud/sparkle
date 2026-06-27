"use client";
import { SignInButton, SignUpButton } from "@clerk/nextjs";

// Signed-out screen. Clerk handles the actual sign in / sign up in a modal.
export default function Landing() {
  return (
    <div className="scrim" style={{ background: "transparent", position: "static", minHeight: "100vh" }}>
      <div className="modal" style={{ textAlign: "center" }}>
        <div style={{ fontSize: 64 }}>✨</div>
        <h2>Welcome to Sparkle!</h2>
        <p className="sub">
          The friendly place where kids show off the cool stuff they make — art, videos,
          games, music &amp; more — and inspire each other to make even more!
        </p>
        <SignUpButton mode="modal">
          <button className="primary">Join Sparkle 🚀</button>
        </SignUpButton>
        <SignInButton mode="modal">
          <button className="logout" style={{ display: "block", margin: "14px auto 0" }}>
            I already have an account
          </button>
        </SignInButton>
        <div className="safe-note" style={{ marginTop: 18, textAlign: "left" }}>
          🛡️ <span>Kids should set up Sparkle with a grown-up. Never share your real full name,
          school, or address.</span>
        </div>
      </div>
    </div>
  );
}
