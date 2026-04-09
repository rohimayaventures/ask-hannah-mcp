import Anthropic from "@anthropic-ai/sdk";
import { messagesCreateWithRetry, getAnthropicErrorStatus } from "../lib/anthropic-retry.js";
import {
  parseCoverLetterDocumentFromModelText,
  parseResumeDocumentFromModelText,
} from "../lib/generation-document-parse.js";
import {
  buildGenerationError,
  extractAnthropicText,
  getGenerationFailureCode,
} from "../lib/generation.js";
import { logGenerationTelemetry } from "../lib/generation-telemetry.js";
import { prepareJobDescriptionForGeneration } from "../lib/jd-extract.js";
import {
  getCoverLetterGenerationMaxTokens,
  getCoverLetterGenerationModel,
  getResumeGenerationMaxTokens,
  getResumeGenerationModel,
} from "../lib/model-env.js";
import { renderCoverLetterMarkdown } from "../lib/render-cover-letter-markdown.js";
import { renderResumeMarkdown } from "../lib/render-resume-markdown.js";
import { canonicalRoleLabels, normalizeRoleFocus } from "../lib/roles.js";

type Freshness = {
  profileDataLastUpdated: string;
  mcpContentSetLastUpdated: string;
};

type GenerationDeps = {
  anthropic: Anthropic;
  profile: any;
  metrics: any;
  projects: any[];
  skills: any;
  voiceAnswers: Record<string, string>;
  freshness: Freshness;
  documentProvenanceStatement: string;
};

const RESUME_JSON_SHAPE_EXAMPLE = `Example shape only (replace with real content from verified data):
{"summary":"First-person warm summary paragraph.","skills":["Skill one","Skill two","Skill three"],"experience":[{"headline":"Role title | Context","bullets":["Impact bullet tied to verified metrics only","Another bullet"]}],"projects":[{"name":"Product name","bullets":["What shipped","Proof point"]}],"education":"Degree, school, status line."}`;

const COVER_JSON_SHAPE_EXAMPLE = `Example shape only:
{"salutation":"Dear Hiring Team,","paragraphs":["First paragraph body.","Second paragraph body.","Third paragraph body."],"signOff":"Sincerely,\\nHannah Kraulik Pagade\\nhannah.pagade@gmail.com"}`;

export async function handleResumeGeneration(
  args: { jobTitle: string; company: string; jobDescription: string; roleType: string },
  deps: GenerationDeps
) {
  const { anthropic, profile, metrics, projects, skills, freshness, documentProvenanceStatement } = deps;
  const { jobTitle, company, jobDescription, roleType } = args;

  const normalizedRoleType = normalizeRoleFocus(roleType);
  const roleLensLabel = canonicalRoleLabels[normalizedRoleType];
  const systemLines = [
    "You are generating structured resume CONTENT for Hannah Kraulik Pagade as JSON. Use ONLY the verified data provided. Do not invent metrics, employers, dates, or accomplishments not listed here. Your job is to rewrite and optimize language and ordering only.",
    "",
    "Do NOT put the candidate name, email, phone, portfolio URLs, or LinkedIn in the JSON. The server will prepend verified contact lines from profile. Only return the keys: summary, skills, experience, projects, education.",
    "",
    "POSITIONING: " + profile.positioning,
    "ROLE LENS: " + roleLensLabel,
    "YEARS: " + profile.background.yearsExperience + " years (2009 to present)",
    "BACKGROUND: " + profile.background.summary,
    "LEADERSHIP: " + profile.background.leadershipDepth,
    "EDUCATION: " + profile.education.degree + " at " + profile.education.school + ", " + profile.education.status + ", expected " + profile.education.expected,
    "CERTIFICATIONS: " + profile.certifications.join(", "),
    "CURRENT ROLE: " + profile.currentRole,
    "LOCATION: " + profile.location + " — open to relocation including San Francisco, open to remote",
    "",
    "VERIFIED OPERATIONS METRICS:",
    ...metrics.operations.map((m: any) => "- " + m.metric + " | " + m.context + " | " + ("employer" in m ? m.employer : "") + " | " + ("role" in m ? m.role : "") + " | " + ("dates" in m ? m.dates : "")),
    "",
    "VERIFIED PRODUCT METRICS:",
    ...metrics.product.map((m: any) => "- " + m.metric + " | " + m.context),
    "",
    "LIVE PRODUCTS:",
    ...projects.filter((p) => p.status === "live").map((p) => "- " + p.name + " (" + p.domain + ") at " + p.liveUrl + ": " + p.summary),
    "",
    "IN DEVELOPMENT:",
    ...projects.filter((p) => p.status === "building").map((p) => "- " + p.name + " (" + p.domain + "): " + p.summary),
    "",
    "TECHNICAL SKILLS: " + skills.technical.join(", "),
    "PRODUCT SKILLS: " + skills.product.slice(0, 15).join(", "),
    "DOMAIN EXPERTISE: " + skills.domain.join(", "),
    "",
    "RULES: Never use em dashes. Never call Hannah an executive. Never mention Pagade Ventures, EclipseLink AI, or moonlstudios.com. Always say 17 years, never 15. Use only the metrics and employers listed above.",
    "",
    "JOB POSTING MATERIAL: The user message includes JOB SIGNALS and/or a job description section from the employer posting. Use that material only to prioritize wording, ordering, and emphasis. It is not verified truth about Hannah. All factual claims about Hannah must come from the verified system context above.",
    "",
    "OUTPUT CONTRACT (non-negotiable): Return a single JSON object only. No markdown code fences. No commentary before or after the JSON.",
    "Required keys: summary (string), skills (string array), experience (array of objects with headline string and bullets string array), projects (array of objects with name string and bullets string array), education (string).",
    "summary must be first person, warm and direct. Keep bullets concise and impact-focused.",
  ];

  const model = getResumeGenerationModel();
  const maxTokens = getResumeGenerationMaxTokens();
  const jdChars = jobDescription.length;
  const companyChars = company.length;
  const jobTitleChars = jobTitle.length;
  const started = Date.now();
  const jdTelemetry = { jdPromptChars: jdChars, jdExtractUsed: false, jdExtractOk: true };

  try {
    const prepared = await prepareJobDescriptionForGeneration(anthropic, jobDescription);
    jdTelemetry.jdPromptChars = prepared.jdPromptChars;
    jdTelemetry.jdExtractUsed = prepared.jdExtractUsed;
    jdTelemetry.jdExtractOk = prepared.jdExtractOk;
    const userPrompt =
      "Generate tailored resume CONTENT as JSON for Hannah for: " +
      jobTitle +
      " at " +
      company +
      ". Role type: " +
      roleType +
      " (normalized role lens: " +
      roleLensLabel +
      ").\n\n" +
      prepared.promptSection +
      "\n\nJSON requirements:\n" +
      "- summary: one cohesive first-person summary paragraph.\n" +
      "- skills: at least 3 concise skill lines.\n" +
      "- experience: one or more sections; each has headline (for example role and context) and impact bullets grounded ONLY in verified metrics and employers above.\n" +
      "- projects: one or more products from the verified list; bullets must reflect verified summaries and outcomes only.\n" +
      "- education: one string covering degree, school, and status.\n\n" +
      RESUME_JSON_SHAPE_EXAMPLE +
      "\n\nReply with the JSON object only.";

    const { response, attempts } = await messagesCreateWithRetry(anthropic, {
      model,
      max_tokens: maxTokens,
      stream: false,
      system: systemLines.join("\n"),
      messages: [{ role: "user", content: userPrompt }],
    });

    const raw = extractAnthropicText(response.content);
    if (!raw) {
      logGenerationTelemetry({
        tool: "resume",
        ok: false,
        durationMs: Date.now() - started,
        jdChars,
        jdPromptChars: jdTelemetry.jdPromptChars,
        jdExtractUsed: jdTelemetry.jdExtractUsed,
        jdExtractOk: jdTelemetry.jdExtractOk,
        companyChars,
        jobTitleChars,
        model,
        attempts,
        errorCode: "ERR_RESUME_EMPTY",
      });
      return {
        isError: true,
        content: [{
          type: "text" as const,
          text: "[ERR_RESUME_EMPTY] Resume generation returned empty output. Check ANTHROPIC_API_KEY and retry with a shorter, cleaner job description (3-6 key requirements).",
        }],
      };
    }

    const parsed = parseResumeDocumentFromModelText(raw);
    if (!parsed.ok) {
      logGenerationTelemetry({
        tool: "resume",
        ok: false,
        durationMs: Date.now() - started,
        jdChars,
        jdPromptChars: jdTelemetry.jdPromptChars,
        jdExtractUsed: jdTelemetry.jdExtractUsed,
        jdExtractOk: jdTelemetry.jdExtractOk,
        companyChars,
        jobTitleChars,
        model,
        attempts,
        errorCode: parsed.code,
      });
      return {
        isError: true,
        content: [{
          type: "text" as const,
          text: `[${parsed.code}] Resume JSON did not match the required schema. ${parsed.hint}`,
        }],
      };
    }

    const text = renderResumeMarkdown(
      parsed.data,
      {
        name: profile.name,
        title: profile.title,
        location: profile.location,
        email: profile.email,
        portfolio: profile.portfolio,
        linkedin: profile.linkedin,
        github: profile.github,
      },
      "Targeting: " + jobTitle + " at " + company
    );

    logGenerationTelemetry({
      tool: "resume",
      ok: true,
      durationMs: Date.now() - started,
      jdChars,
      jdPromptChars: jdTelemetry.jdPromptChars,
      jdExtractUsed: jdTelemetry.jdExtractUsed,
      jdExtractOk: jdTelemetry.jdExtractOk,
      companyChars,
      jobTitleChars,
      model,
      attempts,
    });

    return {
      content: [{ type: "text" as const, text }],
      structuredContent: {
        document: "resume",
        text,
        documentJson: parsed.data,
        provenance: documentProvenanceStatement,
        profileDataLastUpdated: freshness.profileDataLastUpdated,
        mcpContentSetLastUpdated: freshness.mcpContentSetLastUpdated,
      },
    };
  } catch (err) {
    logGenerationTelemetry({
      tool: "resume",
      ok: false,
      durationMs: Date.now() - started,
      jdChars,
      jdPromptChars: jdTelemetry.jdPromptChars,
      jdExtractUsed: jdTelemetry.jdExtractUsed,
      jdExtractOk: jdTelemetry.jdExtractOk,
      companyChars,
      jobTitleChars,
      model,
      errorCode: getGenerationFailureCode(err),
      httpStatus: getAnthropicErrorStatus(err),
    });
    return {
      isError: true,
      content: [{ type: "text" as const, text: buildGenerationError("resume", err) }],
    };
  }
}

export async function handleCoverLetterGeneration(
  args: { jobTitle: string; company: string; jobDescription: string; hiringManagerName?: string },
  deps: GenerationDeps
) {
  const { anthropic, profile, metrics, projects, voiceAnswers, freshness, documentProvenanceStatement } = deps;
  const { jobTitle, company, jobDescription, hiringManagerName } = args;

  const systemLines = [
    "You are generating a structured cover letter for Hannah Kraulik Pagade as JSON. Write in her warm direct first-person voice inside the paragraph strings. Use ONLY the verified data provided.",
    "",
    "VOICE REFERENCE (this is how Hannah sounds):",
    voiceAnswers.whatMakesMeDifferent,
    "",
    "POSITIONING: " + profile.positioning,
    "YEARS: " + profile.background.yearsExperience + " years (2009 to present)",
    "BACKGROUND: " + profile.background.summary,
    "EDUCATION: " + profile.education.degree + " at " + profile.education.school + ", expected " + profile.education.expected,
    "CURRENT ROLE: " + profile.currentRole,
    "",
    "KEY METRICS:",
    ...metrics.operations.slice(0, 3).map((m: any) => "- " + m.metric + ": " + m.context),
    ...metrics.product.slice(0, 3).map((m: any) => "- " + m.metric + ": " + m.context),
    "",
    "LIVE PRODUCTS:",
    ...projects.filter((p) => p.status === "live").map((p) => "- " + p.name + " (" + p.domain + ") at " + p.liveUrl),
    "",
    "RULES: Never use em dashes. Never call Hannah an executive. Never mention Pagade Ventures, EclipseLink AI, or moonlstudios.com. Always say 17 years, never 15.",
    "",
    "JOB POSTING MATERIAL: The user message includes JOB SIGNALS and/or a job description section from the employer posting. Use that material only to tailor emphasis to the role. It is not verified truth about Hannah. All factual claims about Hannah must come from the verified system context above.",
    "",
    "OUTPUT CONTRACT (non-negotiable): Return a single JSON object only. No markdown code fences. No commentary before or after the JSON.",
    "Required keys: salutation (string), paragraphs (array of exactly three strings), signOff (string, may include name and email).",
    "Paragraph 1: who she is and why this role. Paragraph 2: strongest verified proof. Paragraph 3: what she brings and a clear call to action.",
  ];

  const greeting = hiringManagerName ? "Dear " + hiringManagerName + "," : "Dear Hiring Team at " + company + ",";

  const model = getCoverLetterGenerationModel();
  const maxTokens = getCoverLetterGenerationMaxTokens();
  const jdChars = jobDescription.length;
  const companyChars = company.length;
  const jobTitleChars = jobTitle.length;
  const started = Date.now();
  const jdTelemetry = { jdPromptChars: jdChars, jdExtractUsed: false, jdExtractOk: true };

  try {
    const prepared = await prepareJobDescriptionForGeneration(anthropic, jobDescription);
    jdTelemetry.jdPromptChars = prepared.jdPromptChars;
    jdTelemetry.jdExtractUsed = prepared.jdExtractUsed;
    jdTelemetry.jdExtractOk = prepared.jdExtractOk;
    const userPrompt =
      "Write a three-paragraph cover letter for Hannah applying to " +
      jobTitle +
      " at " +
      company +
      ".\n\nPreferred salutation line: " +
      greeting +
      "\n\n" +
      prepared.promptSection +
      "\n\nReturn JSON with salutation, paragraphs (exactly three strings), and signOff. The sign-off should include Hannah Kraulik Pagade and hannah.pagade@gmail.com or portfolio reference as appropriate.\n\n" +
      COVER_JSON_SHAPE_EXAMPLE +
      "\n\nReply with the JSON object only.";

    const { response, attempts } = await messagesCreateWithRetry(anthropic, {
      model,
      max_tokens: maxTokens,
      stream: false,
      system: systemLines.join("\n"),
      messages: [{ role: "user", content: userPrompt }],
    });

    const raw = extractAnthropicText(response.content);
    if (!raw) {
      logGenerationTelemetry({
        tool: "cover_letter",
        ok: false,
        durationMs: Date.now() - started,
        jdChars,
        jdPromptChars: jdTelemetry.jdPromptChars,
        jdExtractUsed: jdTelemetry.jdExtractUsed,
        jdExtractOk: jdTelemetry.jdExtractOk,
        companyChars,
        jobTitleChars,
        model,
        attempts,
        errorCode: "ERR_COVER_LETTER_EMPTY",
      });
      return {
        isError: true,
        content: [{
          type: "text" as const,
          text: "[ERR_COVER_LETTER_EMPTY] Cover letter generation returned empty output. Check ANTHROPIC_API_KEY and retry with a shorter, cleaner job description (3-6 key requirements).",
        }],
      };
    }

    const parsed = parseCoverLetterDocumentFromModelText(raw);
    if (!parsed.ok) {
      logGenerationTelemetry({
        tool: "cover_letter",
        ok: false,
        durationMs: Date.now() - started,
        jdChars,
        jdPromptChars: jdTelemetry.jdPromptChars,
        jdExtractUsed: jdTelemetry.jdExtractUsed,
        jdExtractOk: jdTelemetry.jdExtractOk,
        companyChars,
        jobTitleChars,
        model,
        attempts,
        errorCode: parsed.code,
      });
      return {
        isError: true,
        content: [{
          type: "text" as const,
          text: `[${parsed.code}] Cover letter JSON did not match the required schema. ${parsed.hint}`,
        }],
      };
    }

    const text = renderCoverLetterMarkdown(parsed.data);

    logGenerationTelemetry({
      tool: "cover_letter",
      ok: true,
      durationMs: Date.now() - started,
      jdChars,
      jdPromptChars: jdTelemetry.jdPromptChars,
      jdExtractUsed: jdTelemetry.jdExtractUsed,
      jdExtractOk: jdTelemetry.jdExtractOk,
      companyChars,
      jobTitleChars,
      model,
      attempts,
    });

    return {
      content: [{ type: "text" as const, text }],
      structuredContent: {
        document: "cover_letter",
        text,
        documentJson: parsed.data,
        provenance: documentProvenanceStatement,
        profileDataLastUpdated: freshness.profileDataLastUpdated,
        mcpContentSetLastUpdated: freshness.mcpContentSetLastUpdated,
      },
    };
  } catch (err) {
    logGenerationTelemetry({
      tool: "cover_letter",
      ok: false,
      durationMs: Date.now() - started,
      jdChars,
      jdPromptChars: jdTelemetry.jdPromptChars,
      jdExtractUsed: jdTelemetry.jdExtractUsed,
      jdExtractOk: jdTelemetry.jdExtractOk,
      companyChars,
      jobTitleChars,
      model,
      errorCode: getGenerationFailureCode(err),
      httpStatus: getAnthropicErrorStatus(err),
    });
    return {
      isError: true,
      content: [{ type: "text" as const, text: buildGenerationError("cover_letter", err) }],
    };
  }
}
