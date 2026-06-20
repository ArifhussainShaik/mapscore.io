import { Resend } from "resend";
import config from "@/config";

/**
 * Email the report share link to the client. No-op (logs) if Resend unconfigured.
 */
export async function sendReportEmail({ to, agencyName, businessName, shareUrl }) {
  if (!process.env.RESEND_API_KEY || !to) {
    console.warn("[reportEmail] skipped (no key or recipient)");
    return { skipped: true };
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = config.resend?.fromNoReply || "reports@localscore.io";
  await resend.emails.send({
    from,
    to,
    subject: `${businessName} — your monthly Google Business Profile report`,
    html: `<p>Hi,</p><p>Your latest report from ${agencyName} is ready.</p><p><a href="${shareUrl}">View your report</a></p>`,
  });
  return { sent: true };
}
