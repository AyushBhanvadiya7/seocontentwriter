export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMResponse {
  text: string;
  tokensIn: number;
  tokensOut: number;
  model: string;
}

export interface LLMProvider {
  name: string;
  complete(options: {
    messages: LLMMessage[];
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
  }): Promise<LLMResponse>;
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
