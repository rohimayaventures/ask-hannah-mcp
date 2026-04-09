/** Default when no env override is set (keep in sync with generation rollout). */
export const DEFAULT_ANTHROPIC_GENERATION_MODEL = "claude-sonnet-4-20250514";

/** Default extractor model (Haiku-class) to keep posting analysis cheaper than main generation. Override if your account requires a different ID. */
export const DEFAULT_JD_EXTRACT_MODEL = "claude-3-5-haiku-20241022";

export function getResumeGenerationModel(): string {
  const fromEnv =
    process.env.ANTHROPIC_MODEL_RESUME?.trim() || process.env.ANTHROPIC_MODEL?.trim();
  return fromEnv || DEFAULT_ANTHROPIC_GENERATION_MODEL;
}

export function getCoverLetterGenerationModel(): string {
  const fromEnv =
    process.env.ANTHROPIC_MODEL_COVER_LETTER?.trim() || process.env.ANTHROPIC_MODEL?.trim();
  return fromEnv || DEFAULT_ANTHROPIC_GENERATION_MODEL;
}

export function getJdExtractModel(): string {
  const fromEnv =
    process.env.ANTHROPIC_MODEL_JD_EXTRACT?.trim() || process.env.ANTHROPIC_MODEL?.trim();
  return fromEnv || DEFAULT_JD_EXTRACT_MODEL;
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
