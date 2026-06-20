// Thin wrapper over the Anthropic Messages API. Default model: Claude Haiku 4.5.
const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";

export function isAnthropicConfigured() {
  return !!process.env.ANTHROPIC_API_KEY;
}

/**
 * @param {Array<{role:'user'|'assistant',content:string}>} messages
 * @param {{maxTokens?:number, temperature?:number, system?:string}} [opts]
 * @returns {Promise<string|null>}
 */
export async function askClaude(messages, opts = {}) {
  if (!isAnthropicConfigured()) return null;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: opts.maxTokens ?? 400,
      temperature: opts.temperature ?? 0.7,
      system: opts.system,
      messages,
    }),
  });
  if (!res.ok) {
    console.error("[anthropic] error", res.status, (await res.text()).slice(0, 300));
    return null;
  }
  const json = await res.json();
  return json?.content?.[0]?.text ?? null;
}
