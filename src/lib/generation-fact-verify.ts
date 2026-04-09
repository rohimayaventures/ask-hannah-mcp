import type { CoverLetterDocument, ResumeDocument } from "./generation-schemas.js";

/** Phase 3: server-side check that generation output does not invent metrics, employers, or banned references. */

export type FactVerifyFailureCode = "ERR_RESUME_FACT_DRIFT" | "ERR_COVER_LETTER_FACT_DRIFT";

export type FactVerifyResult =
  | { ok: true }
  | { ok: false; code: FactVerifyFailureCode; hint: string };

type FactCorpusDeps = {
  profile: unknown;
  metrics: unknown;
  projects: unknown[];
  skills: unknown;
  voiceAnswers: Record<string, string>;
};

const FORBIDDEN_SUBSTRINGS = [
  "pagade ventures",
  "eclipselink ai",
  "moonlstudios.com",
  "moonlstudios",
] as const;

/** Lowercase, Unicode-normalize, collapse whitespace for substring checks. */
export function normalizeForFactScan(text: string): string {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Single haystack built from all structured source data the model is allowed to cite. */
export function buildVerifiedFactCorpus(deps: FactCorpusDeps): string {
  const parts = [
    JSON.stringify(deps.profile),
    JSON.stringify(deps.metrics),
    JSON.stringify(deps.projects),
    JSON.stringify(deps.skills),
    JSON.stringify(deps.voiceAnswers),
  ];
  return normalizeForFactScan(parts.join(" "));
}

export function flattenResumeDocumentForFacts(doc: ResumeDocument): string {
  const chunks: string[] = [doc.summary, doc.education, ...doc.skills];
  for (const ex of doc.experience) {
    chunks.push(ex.headline, ...ex.bullets);
  }
  for (const p of doc.projects) {
    chunks.push(p.name, ...p.bullets);
  }
  return chunks.join(" ");
}

export function flattenCoverLetterDocumentForFacts(doc: CoverLetterDocument): string {
  return [doc.salutation, ...doc.paragraphs, doc.signOff].join(" ");
}

function checkForbidden(normalizedOutput: string): string | null {
  for (const bad of FORBIDDEN_SUBSTRINGS) {
    if (normalizedOutput.includes(bad)) {
      return `Output contains a disallowed reference (${bad}).`;
    }
  }
  return null;
}

function checkWrongExperienceFraming(normalizedOutput: string): string | null {
  if (/\b15\s+years?\b/.test(normalizedOutput) || /\bfifteen\s+years?\b/.test(normalizedOutput)) {
    return "Experience duration must reflect 17 years of professional context, not 15.";
  }
  return null;
}

const QUANT_REGEXES: RegExp[] = [
  /\$[\d][\d,]*(?:\.\d+)?\s*[kmbKMB]?/g,
  /\b(?:100|\d{2,3})(?:\.\d+)?%/g,
  /\b\d+(?:\.\d+)?\s*[kmbKMB]\b/g,
  /\b130\s*\+\s*people\b/gi,
  /\b130\+\s*people\b/gi,
  /\b(?:under\s+)?90\s+days\b/gi,
  /\bn\s*=\s*\d+/gi,
  /\b7\s+turns?\s+to\s+3\b/gi,
  /\b25\s+stakeholder\b/gi,
];

function collectUnverifiedQuantClaims(outputRaw: string, corpusNorm: string): string[] {
  const failures: string[] = [];
  const seen = new Set<string>();

  for (const re of QUANT_REGEXES) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(outputRaw)) !== null) {
      const span = m[0];
      const key = normalizeForFactScan(span);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      if (!corpusNorm.includes(key)) {
        failures.push(span.trim());
      }
    }
  }

  return failures;
}

export function verifyGenerationFacts(
  role: "resume" | "cover_letter",
  modelOwnedText: string,
  corpusNormalized: string
): FactVerifyResult {
  const norm = normalizeForFactScan(modelOwnedText);
  if (!norm) {
    return { ok: true };
  }

  const forbidden = checkForbidden(norm);
  if (forbidden) {
    return {
      ok: false,
      code: role === "resume" ? "ERR_RESUME_FACT_DRIFT" : "ERR_COVER_LETTER_FACT_DRIFT",
      hint: forbidden,
    };
  }

  const wrongYears = checkWrongExperienceFraming(norm);
  if (wrongYears) {
    return {
      ok: false,
      code: role === "resume" ? "ERR_RESUME_FACT_DRIFT" : "ERR_COVER_LETTER_FACT_DRIFT",
      hint: wrongYears,
    };
  }

  const badQuants = collectUnverifiedQuantClaims(modelOwnedText, corpusNormalized);
  if (badQuants.length > 0) {
    const shown = badQuants.slice(0, 4).join("; ");
    return {
      ok: false,
      code: role === "resume" ? "ERR_RESUME_FACT_DRIFT" : "ERR_COVER_LETTER_FACT_DRIFT",
      hint: `Unverified quantitative claim(s) not found in source data: ${shown}.`,
    };
  }

  return { ok: true };
}

export function verifyResumeDocumentFacts(doc: ResumeDocument, corpusNormalized: string): FactVerifyResult {
  const text = flattenResumeDocumentForFacts(doc);
  return verifyGenerationFacts("resume", text, corpusNormalized);
}

export function verifyCoverLetterDocumentFacts(doc: CoverLetterDocument, corpusNormalized: string): FactVerifyResult {
  const text = flattenCoverLetterDocumentForFacts(doc);
  return verifyGenerationFacts("cover_letter", text, corpusNormalized);
}
