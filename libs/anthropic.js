// Thin wrapper over Claude. Supports two providers:
//   1. OpenRouter (OPENROUTER_API_KEY) — OpenAI-compatible, default model anthropic/claude-3.5-haiku
//   2. Anthropic native (ANTHROPIC_API_KEY) — Messages API, default claude-haiku-4-5-20251001
// OpenRouter takes precedence when both are set.
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "anthropic/claude-3.5-haiku";

function useOpenRouter() {
  return !!process.env.OPENROUTER_API_KEY;
}

export function isAnthropicConfigured() {
  return useOpenRouter() || !!process.env.ANTHROPIC_API_KEY;
}

/**
 * @param {Array<{role:'user'|'assistant',content:string}>} messages
 * @param {{maxTokens?:number, temperature?:number, system?:string}} [opts]
 * @returns {Promise<string|null>}
 */
export async function askClaude(messages, opts = {}) {
  if (!isAnthropicConfigured()) return null;

  if (useOpenRouter()) {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        max_tokens: opts.maxTokens ?? 400,
        temperature: opts.temperature ?? 0.7,
        messages: opts.system
          ? [{ role: "system", content: opts.system }, ...messages]
          : messages,
      }),
    });
    if (!res.ok) {
      console.error("[openrouter] error", res.status, (await res.text()).slice(0, 300));
      return null;
    }
    const json = await res.json();
    return json?.choices?.[0]?.message?.content ?? null;
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
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
