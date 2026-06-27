import { Resend } from "resend";

// Email is optional. Set RESEND_API_KEY (and EMAIL_FROM) to send real emails.
// Without it, send* functions are safe no-ops so the app keeps working.
const key = process.env.RESEND_API_KEY;
const resend = key ? new Resend(key) : null;
const FROM = process.env.EMAIL_FROM || "Sparkle <onboarding@resend.dev>";

export const emailEnabled = !!resend;

export async function sendWelcomeEmail(to: string, nickname: string) {
  if (!resend) return;
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: "✨ Welcome to Sparkle!",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto">
          <h1 style="color:#8a5cff">Welcome to Sparkle! ✨</h1>
          <p>Hi! An account with the nickname <b>${escapeHtml(nickname)}</b> was just created on Sparkle —
          the friendly place where kids show off cool projects and inspire each other.</p>
          <p>If your child made this account, you're all set. They can now share art, videos,
          games and music, and cheer other young makers on.</p>
          <p style="color:#6a6390;font-size:13px">If you didn't expect this email, you can safely ignore it.</p>
        </div>`,
    });
  } catch (e) {
    console.error("welcome email failed", e);
  }
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
}
