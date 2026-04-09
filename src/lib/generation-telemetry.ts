export type GenerationTool = "resume" | "cover_letter";

export type GenerationTelemetryPayload = {
  tool: GenerationTool;
  ok: boolean;
  durationMs: number;
  jdChars: number;
  companyChars: number;
  jobTitleChars: number;
  model: string;
  /** Present when at least one Anthropic request completed (success or empty body). Omitted on thrown API errors before a successful HTTP response. */
  attempts?: number;
  errorCode?: string;
  httpStatus?: number;
};

/** One JSON line on stderr for log aggregators. Never includes job description text. */
export function logGenerationTelemetry(payload: GenerationTelemetryPayload): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    event: "generation",
    ...payload,
  });
  console.error(line);
}
