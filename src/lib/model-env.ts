/** Default when no env override is set (keep in sync with generation rollout). */
export const DEFAULT_ANTHROPIC_GENERATION_MODEL = "claude-sonnet-4-20250514";

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
