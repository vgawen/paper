// Pluggable LLM client. Without an API key it runs a deterministic stub that
// returns the caller-provided template `fallback`, so the whole pipeline is
// reproducible offline. With a key it calls the provider's chat API.

export function detectProvider(env = process.env) {
  if (env.OPENAI_API_KEY) return 'openai';
  if (env.DEEPSEEK_API_KEY) return 'deepseek';
  if (env.ANTHROPIC_API_KEY) return 'anthropic';
  return 'stub';
}

export function createClient(env = process.env) {
  const provider = detectProvider(env);
  if (provider === 'stub') {
    return { provider, async complete(_prompt, { fallback = '' } = {}) { return fallback; } };
  }
  return {
    provider,
    async complete(prompt, { system = 'You are a Playwright test engineer. Output only code.' } = {}) {
      if (provider === 'anthropic') {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({ model: 'claude-3-5-sonnet-latest', max_tokens: 1200, system, messages: [{ role: 'user', content: prompt }] }),
        });
        const j = await res.json();
        return (j.content || []).map((c) => c.text || '').join('');
      }
      const base = provider === 'deepseek' ? 'https://api.deepseek.com/chat/completions' : 'https://api.openai.com/v1/chat/completions';
      const key = provider === 'deepseek' ? env.DEEPSEEK_API_KEY : env.OPENAI_API_KEY;
      const model = provider === 'deepseek' ? 'deepseek-chat' : 'gpt-4o-mini';
      const res = await fetch(base, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
        body: JSON.stringify({ model, messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }] }),
      });
      const j = await res.json();
      return j.choices?.[0]?.message?.content || '';
    },
  };
}
