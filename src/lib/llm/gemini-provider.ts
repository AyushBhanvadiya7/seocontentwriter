import { LLMProvider, LLMMessage, LLMResponse, estimateTokens } from "./provider";

// Google Gemini provider.
// - Sends the key via header (required for new AQ. keys)
// - Retries on rate limit (429) and server errors (5xx)
// - 90s timeout so serverless functions never hang
// - Clear error messages for invalid key, bad model, safety blocks
export class GeminiProvider implements LLMProvider {
  name = "gemini";
  private apiKey: string;
  private model: string;
  private maxRetries: number;
  private timeoutMs: number;

  constructor(apiKey: string, model: string = "gemini-2.5-flash") {
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

    const systemMessages = messages.filter((m) => m.role === "system");
    const nonSystemMessages = messages.filter((m) => m.role !== "system");

    const systemInstruction =
      systemMessages.length > 0
        ? { parts: [{ text: systemMessages.map((m) => m.content).join("\n\n") }] }
        : undefined;

    const contents = nonSystemMessages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    if (contents.length === 0 && systemInstruction) {
      contents.push({
        role: "user",
        parts: [{ text: "Please generate the requested content based on instructions." }],
      });
    }

    const generationConfig: Record<string, unknown> = {
      temperature,
      maxOutputTokens: maxTokens,
    };

    if (jsonMode) {
      generationConfig.responseMimeType = "application/json";
    }

    // Key goes in the header, not the URL (new AQ. keys require this).
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`;

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": this.apiKey,
          },
          body: JSON.stringify({ contents, systemInstruction, generationConfig }),
          signal: controller.signal,
        });

        clearTimeout(timer);

        // Rate limit: wait and retry.
        if (res.status === 429) {
          const waitMs = attempt * 8000; // 8s, 16s, 24s
          console.warn(`Gemini 429 (rate limit) — attempt ${attempt}/${this.maxRetries}, ${waitMs}ms wait`);
          lastError = new Error(
            "Gemini free quota exceeded (429). Wait a minute and retry, or upgrade to a paid plan."
          );
          if (attempt < this.maxRetries) {
            await new Promise((r) => setTimeout(r, waitMs));
            continue;
          }
          throw lastError;
        }

        // Google-side error: retry.
        if (res.status >= 500) {
          console.warn(`Gemini ${res.status} (server error) — attempt ${attempt}/${this.maxRetries}`);
          lastError = new Error(`Google server is busy (${res.status}). Retry in a moment.`);
          if (attempt < this.maxRetries) {
            await new Promise((r) => setTimeout(r, attempt * 2000));
            continue;
          }
          throw lastError;
        }

        // Client error: retrying will not help.
        if (!res.ok) {
          const errorText = (await res.text()).slice(0, 400);
          console.error("Gemini API Error:", res.status, errorText);

          if (res.status === 401 || res.status === 403) {
            throw new Error(
              "Gemini API key is invalid (401/403). Create a new key: aistudio.google.com/apikey — then update GEMINI_API_KEY in .env and restart the server."
            );
          }
          if (res.status === 404) {
            throw new Error(
              `Model "${this.model}" not found (404). Check GEMINI_MODEL in .env (e.g. gemini-2.5-flash).`
            );
          }
          throw new Error(`Google Gemini Error (${res.status}): ${errorText}`);
        }

        // Success: extract the answer.
        const data = await res.json();
        const candidate = data.candidates?.[0];
        const finishReason = candidate?.finishReason;

        const text: string =
          candidate?.content?.parts?.map((p: { text?: string }) => p.text || "").join("") || "";

        if (!text) {
          if (finishReason === "SAFETY") {
            throw new Error(
              "Gemini blocked the response due to safety filters. Adjust the prompt or keyword (e.g. remove brand names)."
            );
          }
          throw new Error(
            `Gemini returned an empty response (finishReason: ${finishReason || "unknown"}). Retry.`
          );
        }

        // Output was cut at the token limit: warn so we know the article may be incomplete.
        if (finishReason === "MAX_TOKENS") {
          console.warn("Gemini output was cut at MAX_TOKENS — article may be incomplete.");
        }

        const fullPromptText = messages.map((m) => m.content).join(" ");
        const tokensIn = data.usageMetadata?.promptTokenCount || estimateTokens(fullPromptText);
        const tokensOut = data.usageMetadata?.candidatesTokenCount || estimateTokens(text);

        return { text, tokensIn, tokensOut, model: this.model };
      } catch (err) {
        clearTimeout(timer);

        if (err instanceof Error && err.name === "AbortError") {
          lastError = new Error(
            `Gemini did not respond within ${this.timeoutMs / 1000} seconds (timeout). Check your internet connection, or retry.`
          );
          if (attempt < this.maxRetries) continue;
          throw lastError;
        }

        // Our own error messages: pass through untouched.
        if (err instanceof Error && /Gemini|Model|safety|quota|invalid|timeout|blocked|empty/i.test(err.message)) {
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

    throw lastError || new Error("Gemini call failed");
  }
}
