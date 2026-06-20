// libs/aiVisibility.js
import { askClaude, isAnthropicConfigured } from "@/libs/anthropic";

function buildQuery(category, city) {
  return `best ${category} in ${city}`;
}

function detectMention(answer, businessName) {
  if (!answer) return { mentioned: false, snippet: "" };
  const lower = answer.toLowerCase();
  const name = businessName.toLowerCase();
  const idx = lower.indexOf(name);
  if (idx === -1) return { mentioned: false, snippet: answer.slice(0, 200) };
  const start = Math.max(0, idx - 60);
  return { mentioned: true, snippet: answer.slice(start, idx + name.length + 60) };
}

// Provider map — add openai/gemini/perplexity as their keys/clients are wired.
const providers = {
  claude: {
    available: () => isAnthropicConfigured(),
    ask: (query) =>
      askClaude([{ role: "user", content: `${query}? List the top businesses by name.` }], { maxTokens: 500 }),
  },
};

/**
 * @param {{businessName, category, city, models?:string[]}} args
 * @returns {Promise<Array<{model,query,mentioned,snippet}>>}
 */
export async function checkVisibility({ businessName, category, city, models = ["claude"] }) {
  const query = buildQuery(category, city);
  const results = [];
  for (const model of models) {
    const provider = providers[model];
    if (!provider || !provider.available()) {
      results.push({ model, query, mentioned: false, snippet: "", skipped: true });
      continue;
    }
    const answer = await provider.ask(query);
    const { mentioned, snippet } = detectMention(answer, businessName);
    results.push({ model, query, mentioned, snippet });
  }
  return results;
}
