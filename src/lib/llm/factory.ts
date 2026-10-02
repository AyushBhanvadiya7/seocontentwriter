import { LLMProvider } from "./provider";
import { OpenAIProvider } from "./openai-provider";
import { GeminiProvider } from "./gemini-provider";
import { AIMLAPIProvider } from "./aimlapi-provider";

// Picks the AI provider: AIMLAPI first, then Gemini, then OpenAI.
// Throws a clear error when no key is set. Never fakes content.
export function createLLMProvider(): LLMProvider {
  const aimlapiKey = process.env.AIMLAPI_KEY?.trim();
  if (aimlapiKey) {
    const model = process.env.AIMLAPI_MODEL?.trim() || "openai/gpt-5-5";
    return new AIMLAPIProvider(aimlapiKey, model);
  }

  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  if (geminiKey) {
    const model = process.env.GEMINI_MODEL?.trim() || "gemini-3.6-flash";
    return new GeminiProvider(geminiKey, model);
  }

  const openAiKey = process.env.OPENAI_API_KEY?.trim();
  if (openAiKey) {
    const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
    return new OpenAIProvider(openAiKey, model);
  }

  throw new Error(
    "No AI key found. Add AIMLAPI_KEY to .env (local) or Vercel environment variables (live). Get a key: https://aimlapi.com"
  );
}

// Display-only info about the active provider. Never exposes the key.
export function getProviderInfo(): { provider: string; model: string } {
  if (process.env.AIMLAPI_KEY?.trim()) {
    return { provider: "AIMLAPI", model: process.env.AIMLAPI_MODEL?.trim() || "openai/gpt-5-5" };
  }
  if (process.env.GEMINI_API_KEY?.trim()) {
    return { provider: "Gemini", model: process.env.GEMINI_MODEL?.trim() || "gemini-3.6-flash" };
  }
  if (process.env.OPENAI_API_KEY?.trim()) {
    return { provider: "OpenAI", model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini" };
  }
  return { provider: "none", model: "" };
}
