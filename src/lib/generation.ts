import Anthropic from "@anthropic-ai/sdk";

export function extractAnthropicText(content: Anthropic.Message["content"]): string {
  const parts: string[] = [];
  for (const block of content) {
    if (block.type === "text" && typeof block.text === "string") {
      parts.push(block.text);
    }
  }
  return parts.join("\n").trim();
}

export function buildGenerationError(kind: "resume" | "cover_letter", err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  let code = "ERR_GENERATION_FAILED";
  if (message.toLowerCase().includes("authentication") || message.includes("401")) code = "ERR_ANTHROPIC_AUTH";
  else if (message.toLowerCase().includes("rate") || message.includes("429")) code = "ERR_ANTHROPIC_RATE_LIMIT";
  else if (message.toLowerCase().includes("timeout")) code = "ERR_ANTHROPIC_TIMEOUT";
  const hint =
    "Check ANTHROPIC_API_KEY, confirm model availability, and retry with a shorter job description (3-6 key requirements).";
  const label = kind === "resume" ? "Resume" : "Cover letter";
  return `[${code}] ${label} generation failed: ${message}. ${hint}`;
}
