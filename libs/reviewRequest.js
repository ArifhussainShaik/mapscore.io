import { Resend } from "resend";
import config from "@/config";

/** Google review deep link for a place id. */
export function reviewLink(placeId) {
  return `https://search.google.com/local/writereview?placeid=${placeId}`;
}

export async function sendReviewRequest({ to, businessName, link }) {
  if (!process.env.RESEND_API_KEY || !to) {
    console.warn("[reviewRequest] skipped (no key or recipient)");
    return { skipped: true };
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = config.resend?.fromNoReply || "reviews@localscore.io";
  await resend.emails.send({
    from,
    to,
    subject: `How was your experience with ${businessName}?`,
    html: `<p>Thanks for choosing ${businessName}!</p><p>Would you mind leaving us a quick Google review?</p><p><a href="${link}">Leave a review</a></p>`,
  });
  return { sent: true };
}
