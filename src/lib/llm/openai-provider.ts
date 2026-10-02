import { LLMProvider, LLMMessage, LLMResponse, estimateTokens } from "./provider";

export class OpenAIProvider implements LLMProvider {
  name = "openai";
  private apiKey: string;
  private baseUrl = "https://api.openai.com/v1";
  private model: string;

  constructor(apiKey: string, model = "gpt-4o-mini") {
    this.apiKey = apiKey;
    this.model = model;
  }

  async complete(options: {
    messages: LLMMessage[];
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
  }): Promise<LLMResponse> {
    if (!this.apiKey) {
      throw new Error("OpenAI API key is not configured");
    }

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: options.messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 2000,
        response_format: options.jsonMode ? { type: "json_object" } : undefined,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI error ${res.status}: ${err}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "";
    return {
      text,
      tokensIn: data.usage?.prompt_tokens || estimateTokens(options.messages.map((m) => m.content).join(" ")),
      tokensOut: data.usage?.completion_tokens || estimateTokens(text),
      model: this.model,
    };
  }
}
