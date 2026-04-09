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
