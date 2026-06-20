import { askClaude, isAnthropicConfigured } from "@/libs/anthropic";

/**
 * Generate GBP post copy. Falls back to a templated string when Anthropic
 * is not configured (keeps dev + tests working offline).
 * @param {{businessName:string, type:string, topic:string, tone?:string}} args
 * @returns {Promise<string>}
 */
export async function generatePost({ businessName, type, topic, tone = "professional" }) {
  if (!isAnthropicConfigured()) {
    return `${businessName}: ${topic}. Contact us today! (${type})`;
  }
  const system =
    "You write concise Google Business Profile posts (max 1500 chars), local-SEO friendly, with a clear call to action. Return only the post text.";
  const prompt = `Business: ${businessName}\nPost type: ${type}\nTopic: ${topic}\nTone: ${tone}\nWrite the post.`;
  const text = await askClaude([{ role: "user", content: prompt }], { system, maxTokens: 400 });
  return text || `${businessName}: ${topic}.`;
}
