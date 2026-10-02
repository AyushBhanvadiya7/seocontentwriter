import { LLMProvider, LLMMessage, LLMResponse, estimateTokens } from "./provider";

// AIMLAPI provider (OpenAI-compatible chat completions API).
// - Key goes in the Authorization header, never in the URL
// - Retries on rate limit (429) and server errors (5xx)
// - 90s timeout so serverless functions never hang
// - Clear error messages for invalid key and bad model
export class AIMLAPIProvider implements LLMProvider {
  name = "aimlapi";
  private apiKey: string;
  private model: string;
  private baseUrl = "https://api.aimlapi.com/v1";
  private maxRetries: number;
  private timeoutMs: number;

  constructor(apiKey: string, model: string = "openai/gpt-5-5") {
    this.apiKey = apiKey;
    this.model = model;
    this.maxRetries = 3;
    this.timeoutMs = 90_000;
  }

  async complete(options: {
    messages: LLMMessage[];
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
  }): Promise<LLMResponse> {
    const { messages, temperature = 0.7, maxTokens = 8000, jsonMode = false } = options;

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const res = await fetch(`${this.baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: this.model,
            messages: messages.map((m) => ({ role: m.role, content: m.content })),
            temperature,
            max_tokens: maxTokens,
            response_format: jsonMode ? { type: "json_object" } : undefined,
          }),
          signal: controller.signal,
        });

        clearTimeout(timer);

        // Rate limit: wait and retry.
        if (res.status === 429) {
          const waitMs = attempt * 8000; // 8s, 16s, 24s
          console.warn(`AIMLAPI 429 (rate limit) - attempt ${attempt}/${this.maxRetries}, ${waitMs}ms wait`);
          lastError = new Error(
            "AIMLAPI rate limit hit (429). Wait a minute and retry, or check your quota."
          );
          if (attempt < this.maxRetries) {
            await new Promise((r) => setTimeout(r, waitMs));
            continue;
          }
          throw lastError;
        }

        // Server error: retry.
        if (res.status >= 500) {
          console.warn(`AIMLAPI ${res.status} (server error) - attempt ${attempt}/${this.maxRetries}`);
          lastError = new Error(`AIMLAPI server is busy (${res.status}). Retry in a moment.`);
          if (attempt < this.maxRetries) {
            await new Promise((r) => setTimeout(r, attempt * 2000));
            continue;
          }
          throw lastError;
        }

        // Client error: retrying will not help.
        if (!res.ok) {
          const errorText = (await res.text()).slice(0, 400);
          console.error("AIMLAPI Error:", res.status, errorText);

          if (res.status === 401 || res.status === 403) {
            throw new Error(
              "AIMLAPI key is invalid (401/403). Check AIMLAPI_KEY in .env (local) or Vercel environment variables (live)."
            );
          }
          if (res.status === 404) {
            throw new Error(
              `Model "${this.model}" not found (404). Check AIMLAPI_MODEL in .env (see the model list at aimlapi.com).`
            );
          }
          throw new Error(`AIMLAPI Error (${res.status}): ${errorText}`);
        }

        // Success: extract the answer.
        const data = await res.json();
        const text: string = data.choices?.[0]?.message?.content || "";

        if (!text) {
          throw new Error("AIMLAPI returned an empty response. Retry.");
        }

        const fullPromptText = messages.map((m) => m.content).join(" ");
        const tokensIn = data.usage?.prompt_tokens || estimateTokens(fullPromptText);
        const tokensOut = data.usage?.completion_tokens || estimateTokens(text);

        return { text, tokensIn, tokensOut, model: this.model };
      } catch (err) {
        clearTimeout(timer);

        if (err instanceof Error && err.name === "AbortError") {
          lastError = new Error(
            `AIMLAPI did not respond within ${this.timeoutMs / 1000} seconds (timeout). Retry.`
          );
          if (attempt < this.maxRetries) continue;
          throw lastError;
        }

        // Our own error messages: pass through untouched.
        if (err instanceof Error && /AIMLAPI|Model|quota|invalid|timeout|empty/i.test(err.message)) {
          throw err;
        }

        lastError = err instanceof Error ? err : new Error("Unknown error");
        if (attempt < this.maxRetries) {
          await new Promise((r) => setTimeout(r, attempt * 2000));
          continue;
        }
        throw lastError;
      }
    }

    throw lastError || new Error("AIMLAPI call failed");
  }
}
