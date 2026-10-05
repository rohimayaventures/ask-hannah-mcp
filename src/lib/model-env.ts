/** Primary model when ANTHROPIC_MODEL is unset. */
export const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-5-5";

/** Used once when the primary model returns 404 or model-not-found. */
export const DEFAULT_ANTHROPIC_FALLBACK_MODEL = "claude-haiku-4-5-20251001";

/** Alias kept for existing callers; same value as DEFAULT_ANTHROPIC_MODEL. */
export const DEFAULT_ANTHROPIC_GENERATION_MODEL = DEFAULT_ANTHROPIC_MODEL;

/** JD extraction uses the primary model unless ANTHROPIC_MODEL_JD_EXTRACT is set. */
export const DEFAULT_JD_EXTRACT_MODEL = DEFAULT_ANTHROPIC_MODEL;

export function getAnthropicModel(): string {
  return process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_ANTHROPIC_MODEL;
}

export function getAnthropicFallbackModel(): string {
  return process.env.ANTHROPIC_FALLBACK_MODEL?.trim() || DEFAULT_ANTHROPIC_FALLBACK_MODEL;
}

export function getResumeGenerationModel(): string {
  return process.env.ANTHROPIC_MODEL_RESUME?.trim() || getAnthropicModel();
}

export function getCoverLetterGenerationModel(): string {
  return process.env.ANTHROPIC_MODEL_COVER_LETTER?.trim() || getAnthropicModel();
}

export function getJdExtractModel(): string {
  return process.env.ANTHROPIC_MODEL_JD_EXTRACT?.trim() || getAnthropicModel();
}

/** Max output tokens for resume JSON generation (Phase 2). Capped at 8192. */
export function getResumeGenerationMaxTokens(): number {
  return Math.min(8192, Math.max(2048, parseInt(process.env.RESUME_GENERATION_MAX_TOKENS ?? "6144", 10)));
}

/** Max output tokens for cover letter JSON generation (Phase 2). Capped at 8192. */
export function getCoverLetterGenerationMaxTokens(): number {
  return Math.min(8192, Math.max(1024, parseInt(process.env.COVER_LETTER_GENERATION_MAX_TOKENS ?? "3072", 10)));
}

/** Phase 3 fact verification against source data. Set to 0/false/off/no to disable (emergency only). */
export function isGenerationFactVerifyEnabled(): boolean {
  const v = process.env.GENERATION_FACT_VERIFY_ENABLED?.trim().toLowerCase();
  if (v === "0" || v === "false" || v === "off" || v === "no") return false;
  return true;
}
