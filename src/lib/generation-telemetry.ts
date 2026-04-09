export type GenerationTool = "resume" | "cover_letter";

export type GenerationTelemetryPayload = {
  tool: GenerationTool;
  ok: boolean;
  durationMs: number;
  jdChars: number;
  /** Length of the job-description block actually inserted into the main generator prompt (may be extracted or excerpt). */
  jdPromptChars: number;
  jdExtractUsed: boolean;
  jdExtractOk: boolean;
  companyChars: number;
  jobTitleChars: number;
  model: string;
  /** Present when at least one Anthropic request completed (success or empty body). Omitted on thrown API errors before a successful HTTP response. */
  attempts?: number;
  /** Phase 4 ATS serialization mode for the returned document text (markdown vs plain). */
  atsMode?: string;
  errorCode?: string;
  httpStatus?: number;
};

export type JdExtractTelemetryPayload = {
  ok: boolean;
  rawChars: number;
  promptChars: number;
  extractUsed: boolean;
  extractMs: number;
  model?: string;
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

/** One JSON line on stderr for JD extraction pass. Never includes posting body text. */
export function logJdExtractTelemetry(payload: JdExtractTelemetryPayload): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    event: "jd_extract",
    ...payload,
  });
  console.error(line);
}
