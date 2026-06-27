export const metadata = { title: "Terms of Use — Sparkle" };

export default function Terms() {
  return (
    <main className="wrap" style={{ maxWidth: 760 }}>
      <div className="hero" style={{ display: "block" }}>
        <h1>Terms of Use</h1>
        <p>Last updated: 2026. <a href="/">← Back to Sparkle</a></p>
      </div>
      <div className="badges" style={{ lineHeight: 1.6 }}>
        <h3>Be kind</h3>
        <p>Sparkle is a friendly place. Only post things that are kind, safe, and your own work.
        No bullying, no mean words, no sharing personal information (real name, school, address, phone).</p>
        <h3>Accounts</h3>
        <p>Children should set up Sparkle with a parent or guardian. Keep your PIN secret.
        You&apos;re responsible for what your account posts.</p>
        <h3>Subscriptions</h3>
        <p>Sparkle Pro is an optional paid subscription billed through Stripe. You can cancel any time;
        access continues until the end of the billing period. Prices are shown before you pay.</p>
        <h3>Moderation</h3>
        <p>We may remove posts or accounts that break these rules to keep everyone safe.</p>
        <p style={{ color: "var(--ink-soft)", fontSize: 13 }}>
          This template is a starting point and is not legal advice. Have a lawyer review it before launch.
        </p>
      </div>
    </main>
  );
}
