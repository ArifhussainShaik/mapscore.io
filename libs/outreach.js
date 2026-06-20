import { Resend } from "resend";
import { askClaude, isAnthropicConfigured } from "@/libs/anthropic";
import OutreachEmail from "@/models/OutreachEmail";
import config from "@/config";

/**
 * Generate a personalized outreach email referencing the prospect's gaps.
 * Falls back to a template when AI is unconfigured.
 *
 * @param {Object} prospect - Prospect doc/object with businessName + auditSnapshot
 * @param {{agencyName:string}} opts
 * @returns {Promise<{subject:string, body:string}>}
 */
export async function generateOutreach(prospect, { agencyName }) {
  const gaps = prospect.auditSnapshot?.topGaps || [];
  const subject = `Improving ${prospect.businessName}'s Google ranking`;

  if (!isAnthropicConfigured()) {
    const body =
      `Hi,\n\nI ran a quick audit of ${prospect.businessName}'s Google Business Profile and noticed a few quick wins: ` +
      `${gaps.join(", ")}. These are hurting your local ranking and are straightforward to fix.\n\n` +
      `I'm with ${agencyName} — happy to share the full audit. Worth a quick chat?\n\n— ${agencyName}`;
    return { subject, body };
  }

  const system =
    "You write short, friendly, non-spammy cold outreach emails for a local-SEO agency. No hype. Reference the specific gaps. Return JSON {subject, body}.";
  const prompt = `Business: ${prospect.businessName}\nGaps: ${gaps.join(", ")}\nAgency: ${agencyName}`;
  const raw = await askClaude([{ role: "user", content: prompt }], { system, maxTokens: 400 });
  try {
    const parsed = JSON.parse(raw);
    return { subject: parsed.subject || subject, body: parsed.body };
  } catch {
    return {
      subject,
      body: raw || `Hi, a few quick wins for ${prospect.businessName}: ${gaps.join(", ")}. — ${agencyName}`,
    };
  }
}

/**
 * Send an outreach email with compliance footer (unsubscribe), agency reply-to,
 * and record it. Honors the suppression list.
 *
 * @param {{orgId:any, prospect:Object, to:string, agencyName:string, replyTo?:string}} args
 */
export async function sendOutreach({ orgId, prospect, to, agencyName, replyTo }) {
  const suppressed = await OutreachEmail.findOne({ toEmail: to, unsubscribed: true });
  if (suppressed) return { skipped: "suppressed" };

  const { subject, body } = await generateOutreach(prospect, { agencyName });
  const record = await OutreachEmail.create({
    orgId,
    prospectId: prospect._id,
    toEmail: to,
    subject,
    body,
  });

  if (!process.env.RESEND_API_KEY) {
    console.warn("[outreach] Resend not configured — recorded but not sent");
    return { record, skipped: "no-resend" };
  }

  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const unsub = `${base}/api/outreach/unsubscribe?token=${record.unsubscribeToken}`;
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    await resend.emails.send({
      from: config.resend?.fromAdmin || "outreach@localscore.io",
      to,
      replyTo: replyTo || undefined,
      subject,
      html: `<p>${body.replace(/\n/g, "<br/>")}</p><hr/><p style="font-size:12px;color:#888">You received this because your business appears in public Google Maps results. <a href="${unsub}">Unsubscribe</a>.</p>`,
    });
    return { record, sent: true };
  } catch (e) {
    record.status = "failed";
    await record.save();
    return { record, error: e.message };
  }
}
