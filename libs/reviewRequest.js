import { Resend } from "resend";
import config from "@/config";

const escapeHtml = (s = "") =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/** Google review deep link for a place id. */
export function reviewLink(placeId) {
  return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`;
}

export async function sendReviewRequest({ to, businessName, link }) {
  if (!process.env.RESEND_API_KEY || !to) {
    console.warn("[reviewRequest] skipped (no key or recipient)");
    return { skipped: true };
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = config.resend?.fromNoReply || "reviews@localscore.io";
  const name = escapeHtml(businessName);
  await resend.emails.send({
    from,
    to,
    subject: `How was your experience with ${name}?`,
    html: `<p>Thanks for choosing ${name}!</p><p>Would you mind leaving us a quick Google review?</p><p><a href="${escapeHtml(link)}">Leave a review</a></p>`,
  });
  return { sent: true };
}
