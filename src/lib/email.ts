import { Resend } from "resend";

// All outgoing mail goes through Resend (free 100/day, no card).
// Key goes in .env as RESEND_API_KEY. Without a key, mail is skipped
// with a console note — register/login never break because of email.

let client: Resend | null = null;

function resend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

function fromAddress(): string {
  return process.env.EMAIL_FROM || "SEO Content Writer <onboarding@resend.dev>";
}

// Returns true when the mail was accepted. Never throws.
export async function sendEmail(to: string, subject: string, html: string, text: string): Promise<boolean> {
  const r = resend();
  if (!r) {
    console.log(`[email:skipped-no-key] to=${to} subject=${subject}`);
    return false;
  }
  try {
    const { error } = await r.emails.send({ from: fromAddress(), to, subject, html, text });
    if (error) {
      console.error(`[email:failed] to=${to} — ${error.message}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[email:error] to=${to} — ${err instanceof Error ? err.message : err}`);
    return false;
  }
}

export function welcomeEmail(name: string): { subject: string; html: string; text: string } {
  const subject = "Welcome to SEO Content Writer — 10 free credits inside";
  const text = `Hi ${name},\n\nYour account is ready. You have 10 free credits — 1 credit makes 1 full SEO article with real Google research, meta tags and Word export.\n\nLog in and create your first project. Happy publishing!\n\n— SEO Content Writer`;
  const html = `<div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1e293b;">
    <h2 style="color: #1d4ed8;">Welcome, ${escapeHtml(name)}!</h2>
    <p>Your account is ready. You have <strong>10 free credits</strong> — 1 credit makes 1 full SEO article with real Google research, meta tags and Word export.</p>
    <p>Log in and create your first project. Happy publishing!</p>
    <p style="color: #64748b; font-size: 13px;">— SEO Content Writer</p>
  </div>`;
  return { subject, html, text };
}

export function resetEmail(name: string, link: string): { subject: string; html: string; text: string } {
  const subject = "Reset your SEO Content Writer password";
  const text = `Hi ${name},\n\nClick this link to set a new password (valid for 1 hour):\n${link}\n\nIf you did not ask for this, ignore this email — your password stays unchanged.\n\n— SEO Content Writer`;
  const html = `<div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1e293b;">
    <h2 style="color: #1d4ed8;">Reset your password</h2>
    <p>Hi ${escapeHtml(name)}, click the button below to set a new password. The link works for <strong>1 hour</strong>.</p>
    <p><a href="${link}" style="display: inline-block; background: #2563eb; color: #ffffff; padding: 10px 22px; border-radius: 8px; text-decoration: none; font-weight: bold;">Set a new password</a></p>
    <p style="color: #64748b; font-size: 13px;">If you did not ask for this, ignore this email — your password stays unchanged.</p>
  </div>`;
  return { subject, html, text };
}

export function articleReadyEmail(name: string, title: string, url: string): { subject: string; html: string; text: string } {
  const subject = `Your article is ready: ${title}`;
  const text = `Hi ${name},\n\nYour article "${title}" is ready to read and export.\n\nOpen it here:\n${url}\n\n— SEO Content Writer`;
  const html = `<div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1e293b;">
    <h2 style="color: #1d4ed8;">Your article is ready</h2>
    <p>Hi ${escapeHtml(name)}, <strong>${escapeHtml(title)}</strong> is ready to read and export.</p>
    <p><a href="${url}" style="display: inline-block; background: #2563eb; color: #ffffff; padding: 10px 22px; border-radius: 8px; text-decoration: none; font-weight: bold;">Open article</a></p>
    <p style="color: #64748b; font-size: 13px;">— SEO Content Writer</p>
  </div>`;
  return { subject, html, text };
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
