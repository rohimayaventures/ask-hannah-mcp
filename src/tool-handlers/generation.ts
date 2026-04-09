import Anthropic from "@anthropic-ai/sdk";
import { canonicalRoleLabels, normalizeRoleFocus } from "../lib/roles.js";
import { buildGenerationError, extractAnthropicText } from "../lib/generation.js";

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

export async function handleResumeGeneration(
  args: { jobTitle: string; company: string; jobDescription: string; roleType: string },
  deps: GenerationDeps
) {
  const { anthropic, profile, metrics, projects, skills, freshness, documentProvenanceStatement } = deps;
  const { jobTitle, company, jobDescription, roleType } = args;

  const normalizedRoleType = normalizeRoleFocus(roleType);
  const roleLensLabel = canonicalRoleLabels[normalizedRoleType];
  const systemLines = [
    "You are generating a tailored resume for Hannah Kraulik Pagade. Use ONLY the verified data provided. Do not invent metrics, employers, dates, or accomplishments not listed here. Your job is to rewrite and optimize language and ordering only.",
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
    "OUTPUT CONTRACT (non-negotiable): Your entire response must be only the resume text, ready to paste into a document.",
    "Do not include any preamble or postscript: no 'Here is', no 'Below is', no commentary on how the resume was tailored, no callouts, no meta bullet lists, no 'things to update', no questions, and no offer to write a cover letter.",
    "Your first character must be the first character of the resume (for example the candidate name or the first section heading). Your last character must be the last character of the resume.",
  ];

  const userPrompt =
    "Generate a tailored resume for Hannah for: " +
    jobTitle +
    " at " +
    company +
    ". Role type: " +
    roleType +
    " (normalized role lens: " +
    roleLensLabel +
    ")" +
    ".\n\nJob Description:\n" +
    jobDescription +
    "\n\nFormat: Summary, Skills, Experience, Projects, Education. Write the summary in first person, warm and direct. Keep bullet points concise and impact-focused. End with: 'Full downloadable PDF available at hannahkraulikpagade.com/resume-builder'" +
    "\n\nReply with the resume only — no other words before or after it.";

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemLines.join("\n"),
      messages: [{ role: "user", content: userPrompt }],
    });

    const text = extractAnthropicText(response.content);
    if (!text) {
      return {
        isError: true,
        content: [{
          type: "text" as const,
          text: "[ERR_RESUME_EMPTY] Resume generation returned empty output. Check ANTHROPIC_API_KEY and retry with a shorter, cleaner job description (3-6 key requirements).",
        }],
      };
    }

    return {
      content: [{ type: "text" as const, text }],
      structuredContent: {
        document: "resume",
        text,
        provenance: documentProvenanceStatement,
        profileDataLastUpdated: freshness.profileDataLastUpdated,
        mcpContentSetLastUpdated: freshness.mcpContentSetLastUpdated,
      },
    };
  } catch (err) {
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
    "You are generating a cover letter for Hannah Kraulik Pagade. Write in her warm direct first-person voice. Use ONLY the verified data provided.",
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
    "RULES: Never use em dashes. Never call Hannah an executive. Never mention Pagade Ventures, EclipseLink AI, or moonlstudios.com. Always say 17 years, never 15. Three paragraphs maximum. End with: hannah.pagade@gmail.com or hannahkraulikpagade.com",
    "",
    "OUTPUT CONTRACT (non-negotiable): Your entire response must be only the cover letter text.",
    "Do not include any preamble or postscript: no 'Here is', no commentary on tailoring, no callouts, no questions, and no offer to write a resume.",
    "Your first character must be the salutation (e.g. 'Dear'). Your last line must be the sign-off.",
  ];

  const greeting = hiringManagerName ? "Dear " + hiringManagerName + "," : "Dear Hiring Team at " + company + ",";

  const userPrompt =
    "Write a three-paragraph cover letter for Hannah applying to " +
    jobTitle +
    " at " +
    company +
    ".\n\nOpening: " +
    greeting +
    "\n\nJob Description:\n" +
    jobDescription +
    "\n\nMake it warm, direct, and specific to this role. First paragraph: who she is and why this role specifically. Second paragraph: the most relevant proof from her background. Third paragraph: what she brings to the team and a clear call to action. Sign off as Hannah Kraulik Pagade." +
    "\n\nReply with the letter only — no other words before or after it.";

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: systemLines.join("\n"),
      messages: [{ role: "user", content: userPrompt }],
    });

    const text = extractAnthropicText(response.content);
    if (!text) {
      return {
        isError: true,
        content: [{
          type: "text" as const,
          text: "[ERR_COVER_LETTER_EMPTY] Cover letter generation returned empty output. Check ANTHROPIC_API_KEY and retry with a shorter, cleaner job description (3-6 key requirements).",
        }],
      };
    }

    return {
      content: [{ type: "text" as const, text }],
      structuredContent: {
        document: "cover_letter",
        text,
        provenance: documentProvenanceStatement,
        profileDataLastUpdated: freshness.profileDataLastUpdated,
        mcpContentSetLastUpdated: freshness.mcpContentSetLastUpdated,
      },
    };
  } catch (err) {
    return {
      isError: true,
      content: [{ type: "text" as const, text: buildGenerationError("cover_letter", err) }],
    };
  }
}
