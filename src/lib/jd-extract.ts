import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { messagesCreateWithRetry, getAnthropicErrorStatus } from "./anthropic-retry.js";
import { extractAnthropicText, getGenerationFailureCode } from "./generation.js";
import { logJdExtractTelemetry } from "./generation-telemetry.js";
import { getJdExtractModel } from "./model-env.js";

const extractionSchema = z.object({
  roleSummary: z.string().max(4000).default(""),
  mustHaveRequirements: z.array(z.string().max(800)).max(30).default([]),
  niceToHaveRequirements: z.array(z.string().max(800)).max(30).default([]),
  keySkillsOrStack: z.array(z.string().max(300)).max(50).default([]),
  seniorityAndScope: z.string().max(2000).default(""),
  domainOrIndustry: z.string().max(1000).default(""),
  constraints: z.array(z.string().max(600)).max(25).default([]),
  tailoringNotes: z.string().max(3000).default(""),
});

export type JobDescriptionExtraction = z.infer<typeof extractionSchema>;

export type PreparedJobDescription = {
  /** Text inserted into the main generator user prompt under JOB SIGNALS. */
  promptSection: string;
  jdRawChars: number;
  jdPromptChars: number;
  /** True when an LLM extraction call was made (not short-circuit pass-through). */
  jdExtractUsed: boolean;
  /** False when extraction was attempted but parse/API failed and fallback excerpt was used. */
  jdExtractOk: boolean;
  extractModel?: string;
  extractMs?: number;
  extractAttempts?: number;
};

function jdExtractEnabled(): boolean {
  const v = process.env.JD_EXTRACT_ENABLED?.trim().toLowerCase();
  if (v === "0" || v === "false" || v === "no" || v === "off") return false;
  return true;
}

function skipLlmUnderChars(): number {
  return Math.max(0, parseInt(process.env.JD_EXTRACT_SKIP_LLM_UNDER_CHARS ?? "2800", 10));
}

function maxInputChars(): number {
  return Math.max(2000, parseInt(process.env.JD_EXTRACT_MAX_INPUT_CHARS ?? "32000", 10));
}

function fallbackExcerptChars(): number {
  return Math.max(2000, parseInt(process.env.JD_EXTRACT_FALLBACK_EXCERPT_CHARS ?? "10000", 10));
}

function extractMaxTokens(): number {
  return Math.min(4096, Math.max(256, parseInt(process.env.JD_EXTRACT_MAX_TOKENS ?? "1536", 10)));
}

export function stripModelJsonFences(raw: string): string {
  let t = raw.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/m, "").trim();
  }
  return t;
}

export function parseJobDescriptionExtractionJson(text: string): JobDescriptionExtraction {
  const cleaned = stripModelJsonFences(text);
  const parsed: unknown = JSON.parse(cleaned);
  const result = extractionSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error("JD extraction JSON failed schema validation");
  }
  return result.data;
}

export function formatExtractionForPrompt(e: JobDescriptionExtraction): string {
  const lines: string[] = [];
  if (e.roleSummary.trim()) lines.push("### Role summary (from posting)", e.roleSummary.trim(), "");
  if (e.mustHaveRequirements.length) {
    lines.push("### Must-have signals", ...e.mustHaveRequirements.map((s) => "- " + s), "");
  }
  if (e.niceToHaveRequirements.length) {
    lines.push("### Nice-to-have signals", ...e.niceToHaveRequirements.map((s) => "- " + s), "");
  }
  if (e.keySkillsOrStack.length) {
    lines.push("### Skills / stack emphasized", ...e.keySkillsOrStack.map((s) => "- " + s), "");
  }
  if (e.seniorityAndScope.trim()) lines.push("### Seniority and scope", e.seniorityAndScope.trim(), "");
  if (e.domainOrIndustry.trim()) lines.push("### Domain / industry", e.domainOrIndustry.trim(), "");
  if (e.constraints.length) {
    lines.push("### Constraints or flags", ...e.constraints.map((s) => "- " + s), "");
  }
  if (e.tailoringNotes.trim()) lines.push("### Tailoring notes (posting only)", e.tailoringNotes.trim(), "");
  return lines.join("\n").trim();
}

function truncateChars(s: string, max: number): string {
  if (!Number.isFinite(max) || max <= 0 || s.length <= max) return s;
  return s.slice(0, max) + "\n\n[Job description truncated for processing]";
}

function fallbackExcerpt(raw: string): string {
  const cap = fallbackExcerptChars();
  const body = raw.length <= cap ? raw : raw.slice(0, cap) + "\n\n[Excerpt truncated]";
  return (
    "## Job description (excerpt; extraction unavailable)\n\n" +
    "Use this text only to infer what the employer is asking for. Do not treat any employer claims as facts about the candidate.\n\n" +
    body
  );
}

const EXTRACTOR_SYSTEM = [
  "You read job postings for recruiting. Return a single JSON object only. No markdown code fences, no backticks, no commentary before or after the JSON.",
  "The JSON must match this shape: {\"roleSummary\":string,\"mustHaveRequirements\":string[],\"niceToHaveRequirements\":string[],\"keySkillsOrStack\":string[],\"seniorityAndScope\":string,\"domainOrIndustry\":string,\"constraints\":string[],\"tailoringNotes\":string}.",
  "Use only information that appears in the JOB_DESCRIPTION. If something is unknown, use an empty string or empty array. Keep strings concise. Do not invent employers, teams, or requirements not stated.",
].join("\n");

async function runLlmExtraction(
  anthropic: Anthropic,
  jobDescriptionTruncated: string
): Promise<{ text: string; model: string; attempts: number; ms: number }> {
  const model = getJdExtractModel();
  const started = Date.now();
  const { response, attempts } = await messagesCreateWithRetry(anthropic, {
    model,
    max_tokens: extractMaxTokens(),
    stream: false,
    system: EXTRACTOR_SYSTEM,
    messages: [
      {
        role: "user",
        content:
          "Extract recruiting signals from the following JOB_DESCRIPTION as JSON only.\n\nJOB_DESCRIPTION:\n\n" +
          jobDescriptionTruncated,
      },
    ],
  });
  const text = extractAnthropicText(response.content);
  return { text, model, attempts, ms: Date.now() - started };
}

/**
 * Prepares job description text for resume/cover generation: optional LLM extraction for long JDs,
 * pass-through for short JDs or when disabled, deterministic excerpt fallback on failure.
 */
export async function prepareJobDescriptionForGeneration(
  anthropic: Anthropic,
  rawJobDescription: string
): Promise<PreparedJobDescription> {
  const jdRawChars = rawJobDescription.length;

  const passThrough = (label: string): PreparedJobDescription => {
    const promptSection =
      "## " +
      label +
      "\n\n" +
      "Use this text only to infer what the employer is asking for. Verified facts about the candidate come only from the system context, not from the posting.\n\n" +
      rawJobDescription;
    const jdPromptChars = promptSection.length;
    logJdExtractTelemetry({
      ok: true,
      rawChars: jdRawChars,
      promptChars: jdPromptChars,
      extractUsed: false,
      extractMs: 0,
    });
    return {
      promptSection,
      jdRawChars,
      jdPromptChars,
      jdExtractUsed: false,
      jdExtractOk: true,
    };
  };

  if (!jdExtractEnabled()) {
    return passThrough("Full job description");
  }

  if (jdRawChars <= skipLlmUnderChars()) {
    return passThrough("Full job description (short posting)");
  }

  const truncated = truncateChars(rawJobDescription, maxInputChars());
  const fallbackExtractModel = getJdExtractModel();
  try {
    const { text, model, attempts, ms } = await runLlmExtraction(anthropic, truncated);
    if (!text) {
      const promptSection = fallbackExcerpt(truncated);
      const jdPromptChars = promptSection.length;
      logJdExtractTelemetry({
        ok: false,
        rawChars: jdRawChars,
        promptChars: jdPromptChars,
        extractUsed: true,
        extractMs: ms,
        model,
        attempts,
        errorCode: "ERR_JD_EXTRACT_EMPTY",
      });
      return {
        promptSection,
        jdRawChars,
        jdPromptChars,
        jdExtractUsed: true,
        jdExtractOk: false,
        extractModel: model,
        extractMs: ms,
        extractAttempts: attempts,
      };
    }
    try {
      const extraction = parseJobDescriptionExtractionJson(text);
      const formatted = formatExtractionForPrompt(extraction);
      const promptSection =
        "## JOB SIGNALS (extracted from posting; not verified facts about the candidate)\n\n" + formatted;
      const jdPromptChars = promptSection.length;
      logJdExtractTelemetry({
        ok: true,
        rawChars: jdRawChars,
        promptChars: jdPromptChars,
        extractUsed: true,
        extractMs: ms,
        model,
        attempts,
      });
      return {
        promptSection,
        jdRawChars,
        jdPromptChars,
        jdExtractUsed: true,
        jdExtractOk: true,
        extractModel: model,
        extractMs: ms,
        extractAttempts: attempts,
      };
    } catch {
      const promptSection = fallbackExcerpt(truncated);
      const jdPromptChars = promptSection.length;
      logJdExtractTelemetry({
        ok: false,
        rawChars: jdRawChars,
        promptChars: jdPromptChars,
        extractUsed: true,
        extractMs: ms,
        model,
        attempts,
        errorCode: "ERR_JD_EXTRACT_PARSE",
      });
      return {
        promptSection,
        jdRawChars,
        jdPromptChars,
        jdExtractUsed: true,
        jdExtractOk: false,
        extractModel: model,
        extractMs: ms,
        extractAttempts: attempts,
      };
    }
  } catch (err) {
    const promptSection = fallbackExcerpt(truncated);
    const jdPromptChars = promptSection.length;
    logJdExtractTelemetry({
      ok: false,
      rawChars: jdRawChars,
      promptChars: jdPromptChars,
      extractUsed: true,
      extractMs: 0,
      model: fallbackExtractModel,
      errorCode: getGenerationFailureCode(err),
      httpStatus: getAnthropicErrorStatus(err),
    });
    return {
      promptSection,
      jdRawChars,
      jdPromptChars,
      jdExtractUsed: true,
      jdExtractOk: false,
      extractModel: fallbackExtractModel,
    };
  }
}
