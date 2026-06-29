"use client";
import { useEffect, useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import type { FeedItem, User } from "./types";
import { api } from "./api";
import MainApp from "./MainApp";
import Landing from "./Landing";
import Onboarding from "./Onboarding";
import ConsentGate from "./ConsentGate";

export default function SparkleApp({
  clerkEnabled,
  initialUser,
  initialFeed,
}: {
  clerkEnabled: boolean;
  authed: boolean;
  initialUser: User | null;
  initialFeed: FeedItem[];
}) {
  // Without Clerk keys the app still boots — show a friendly setup screen.
  if (!clerkEnabled) return <SetupNotice />;
  return <ClerkGate initialUser={initialUser} initialFeed={initialFeed} />;
}

function Spinner() {
  return <main className="wrap"><div className="spinner" /></main>;
}

// Uses Clerk hooks — only ever mounted when ClerkProvider is present.
function ClerkGate({
  initialUser,
  initialFeed,
}: {
  initialUser: User | null;
  initialFeed: FeedItem[];
}) {
  const { isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const [profile, setProfile] = useState<User | null>(initialUser);
  const [checking, setChecking] = useState(false);
  const [consentSkipped, setConsentSkipped] = useState(false);

  // Signed in (per Clerk) but no profile loaded yet -> fetch it.
  useEffect(() => {
    if (isSignedIn && !profile) {
      setChecking(true);
      api.me().then((r) => setProfile(r.user)).finally(() => setChecking(false));
    }
  }, [isSignedIn, profile]);

  async function logout() {
    setProfile(null);
    await signOut();
  }

  if (!profile) {
    if (!isLoaded) return <Spinner />;
    if (!isSignedIn) return <Landing />;
    if (checking) return <Spinner />;
    return <Onboarding onDone={setProfile} />;
  }

  // Under-13 makers must get a grown-up's permission before they can post.
  // They may "look around" (consentSkipped) but posting is blocked server-side too.
  if (!profile.consented && !consentSkipped) {
    return <ConsentGate onConsented={setProfile} onSkip={() => setConsentSkipped(true)} />;
  }

  return <MainApp profile={profile} initialFeed={initialFeed} onLogout={logout} />;
}

function SetupNotice() {
  return (
    <main className="wrap">
      <div className="hero" style={{ display: "block" }}>
        <h1>✨ Sparkle is almost ready</h1>
        <p>One step left: add your Clerk keys to switch on logins.</p>
      </div>
      <div className="badges" style={{ lineHeight: 1.6 }}>
        <h3>Turn on accounts (2 minutes)</h3>
        <ol>
          <li>Create a free app at <b>clerk.com</b>.</li>
          <li>Copy the <b>Publishable key</b> and <b>Secret key</b>.</li>
          <li>Add them to <code>.env</code> (and Vercel) as
            <br /><code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> and <code>CLERK_SECRET_KEY</code>.</li>
          <li>Restart the app — logins go live. 🎉</li>
        </ol>
        <p style={{ color: "var(--ink-soft)", fontSize: 14 }}>
          Everything else (projects, scoring, Stripe, emails) is already built and waiting.
          See <b>LAUNCH.md</b> for the full checklist.
        </p>
      </div>
    </main>
  );
}
