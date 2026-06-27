export const metadata = { title: "Privacy Policy — Sparkle" };

export default function Privacy() {
  return (
    <main className="wrap" style={{ maxWidth: 760 }}>
      <div className="hero" style={{ display: "block" }}>
        <h1>Privacy Policy</h1>
        <p>Last updated: 2026. <a href="/">← Back to Sparkle</a></p>
      </div>
      <div className="badges" style={{ lineHeight: 1.6 }}>
        <p><b>Sparkle is built for children, so we collect as little as possible.</b></p>
        <h3>What we collect</h3>
        <ul>
          <li><b>A nickname</b> (not a real name) and an emoji avatar.</li>
          <li><b>An age</b> (a number only).</li>
          <li><b>A 4-digit PIN</b>, stored encrypted, used only to log in.</li>
          <li><b>An optional grown-up&apos;s email</b>, used only for receipts and account help — never shown to other users.</li>
          <li>The projects, comments, and likes a child chooses to post.</li>
        </ul>
        <h3>What we do NOT collect</h3>
        <p>No real names, no photos of children&apos;s faces required, no location, no phone numbers, no third-party ad tracking.</p>
        <h3>Parents &amp; guardians</h3>
        <p>
          You can request to see, change, or delete your child&apos;s account and data at any time by emailing
          us. We do not sell children&apos;s data. Payments are processed securely by Stripe; we never store card numbers.
        </p>
        <h3>Contact</h3>
        <p>Questions? Email the address shown in the app footer or your account settings.</p>
        <p style={{ color: "var(--ink-soft)", fontSize: 13 }}>
          This template is a starting point and is not legal advice. Before launching to real
          children, have a lawyer review it for COPPA (US) and GDPR-K (EU) compliance.
        </p>
      </div>
    </main>
  );
}
