import type { ZodError } from "zod";
import {
  coverLetterDocumentSchema,
  resumeDocumentSchema,
  type CoverLetterDocument,
  type ResumeDocument,
} from "./generation-schemas.js";
import { stripModelJsonFences } from "./model-json.js";

export type ParseFailure = {
  ok: false;
  code: "ERR_RESUME_JSON" | "ERR_RESUME_SCHEMA" | "ERR_COVER_LETTER_JSON" | "ERR_COVER_LETTER_SCHEMA";
  hint: string;
};

function flattenZodIssues(err: ZodError): string {
  const issues = err.issues.slice(0, 8).map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`);
  return issues.join("; ");
}

export function parseResumeDocumentFromModelText(raw: string): { ok: true; data: ResumeDocument } | ParseFailure {
  try {
    const cleaned = stripModelJsonFences(raw.trim());
    const parsed: unknown = JSON.parse(cleaned);
    const result = resumeDocumentSchema.safeParse(parsed);
    if (!result.success) {
      return {
        ok: false,
        code: "ERR_RESUME_SCHEMA",
        hint: flattenZodIssues(result.error),
      };
    }
    return { ok: true, data: result.data };
  } catch {
    return {
      ok: false,
      code: "ERR_RESUME_JSON",
      hint: "Model output was not valid JSON. Retry once; if it persists, shorten the job description or disable JD extraction.",
    };
  }
}

export function parseCoverLetterDocumentFromModelText(raw: string): { ok: true; data: CoverLetterDocument } | ParseFailure {
  try {
    const cleaned = stripModelJsonFences(raw.trim());
    const parsed: unknown = JSON.parse(cleaned);
    const result = coverLetterDocumentSchema.safeParse(parsed);
    if (!result.success) {
      return {
        ok: false,
        code: "ERR_COVER_LETTER_SCHEMA",
        hint: flattenZodIssues(result.error),
      };
    }
    return { ok: true, data: result.data };
  } catch {
    return {
      ok: false,
      code: "ERR_COVER_LETTER_JSON",
      hint: "Model output was not valid JSON. Retry once; if it persists, shorten the job description.",
    };
  }
}
