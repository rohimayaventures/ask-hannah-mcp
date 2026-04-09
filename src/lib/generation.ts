import Anthropic from "@anthropic-ai/sdk";
import { getAnthropicErrorStatus } from "./anthropic-retry.js";

export function extractAnthropicText(content: Anthropic.Message["content"]): string {
  const parts: string[] = [];
  for (const block of content) {
    if (block.type === "text" && typeof block.text === "string") {
      parts.push(block.text);
    }
  }
  return parts.join("\n").trim();
}

export function getGenerationFailureCode(err: unknown): string {
  const status = getAnthropicErrorStatus(err);
  if (status === 401) return "ERR_ANTHROPIC_AUTH";
  if (status === 429) return "ERR_ANTHROPIC_RATE_LIMIT";
  if (status === 408) return "ERR_ANTHROPIC_TIMEOUT";
  const message = err instanceof Error ? err.message : String(err);
  const lower = message.toLowerCase();
  if (lower.includes("authentication") || message.includes("401")) return "ERR_ANTHROPIC_AUTH";
  if (lower.includes("rate") || message.includes("429")) return "ERR_ANTHROPIC_RATE_LIMIT";
  if (lower.includes("timeout")) return "ERR_ANTHROPIC_TIMEOUT";
  return "ERR_GENERATION_FAILED";
}

export function buildGenerationError(kind: "resume" | "cover_letter", err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  const code = getGenerationFailureCode(err);
  const hint =
    "Check ANTHROPIC_API_KEY, confirm model availability, and retry with a shorter job description (3-6 key requirements).";
  const label = kind === "resume" ? "Resume" : "Cover letter";
  return `[${code}] ${label} generation failed: ${message}. ${hint}`;
}
